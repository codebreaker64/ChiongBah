# Chiong Bah — design spec (version 1)

- **Date:** 21 Oct 2026
- **Status:** Draft for review
- **Platform:** Android first (Google Play), React Native
- **App name:** Chiong Bah (Play Store title: "Chiong Bah: IPPT Trainer & ORD Countdown")

## 1. Summary

A phone app for NSFs and NSmen to train for the 3-station IPPT (push-ups, sit-ups, 2.4km run) and count down to key NS dates. The phone camera counts push-ups and sit-ups by IPPT-style rules and flags "no count" reps with a reason. After each set, a debrief gives one tip and one drill for the most common fault. Users set a target award and see how far they are from it on each station.

It starts as a personal and learning project, built so it can be released publicly on Google Play.

## 2. Users and context

- **NSFs:** SAF, SPF and SCDF. They count down to ORD (SAF) or ROD (SPF/SCDF), plus their next IPPT.
- **NSmen:** they count down to their next IPPT date or deadline.
- **Unofficial app:**
  - No SAF, MINDEF, SPF or SCDF logos or branding.
  - Every score is labelled as a practice estimate.
  - Health disclaimer shown at first launch.

## 3. Scope

### In version 1
1. **Profile:** date of birth, NSF or NSman, service (SAF/SPF/SCDF), Commando/Diver/Guards vocation toggle, ORD/ROD date (NSF only), next IPPT date.
2. **Countdowns:**
   - ORD/ROD countdown (NSF only).
   - IPPT countdown (everyone).
3. **Score calculator:** points per station and total, plus the award, using official scoring tables by age group.
4. **Goals:** pick a target award (Pass, Pass with Incentive, Silver, Gold) or a target score, with the IPPT date as the deadline. The app shows the gap on each station and where the next points are cheapest.
5. **Camera rep counting** for push-ups and sit-ups:
   - Live valid-rep count and a separate no-count counter.
   - Sound cues for each rep.
   - IPPT test mode (60 s) and free practice mode.
6. **Debrief after each set:**
   - Score and points.
   - A rep timeline.
   - The most common form fault, with one tip and one drill.
   - Camera placement advice when the app couldn't see clearly.
7. **Manual entry** for all three stations.
8. **Health Connect import** of runs, with a 2.4km adjustment (section 9).
9. **On-device storage only**, plus JSON backup export and import.

### Later (not in version 1)
iOS, live voice coaching, weekly training targets and streaks, GPS run tracking, accounts and cloud sync, comparing with friends or your unit, free-form countdowns, female scoring tables.

## 4. Tech stack

| Concern | Choice |
|---|---|
| App framework | React Native, New Architecture, TypeScript |
| Tooling | Expo with development builds (not Expo Go) |
| Camera | `react-native-vision-camera` v5 + `react-native-vision-camera-worklets` + `react-native-worklets` |
| Pose detection | **Our own frame processor plugin** in Kotlin, built as a Nitro module, wrapping Google MediaPipe Pose Landmarker (Android) |
| Storage | `expo-sqlite` |
| Health data | `react-native-health-connect` (Android only, needs Android 8 / API 26+) |
| Tests | Jest for TypeScript; Python + MediaPipe for the laptop recording pipeline |
| Minimum Android | 8.0 (API 26), set by Health Connect |

**Why our own plugin:** VisionCamera v5 (April 2026) requires frame processor plugins to be Nitro modules. The existing MediaPipe pose plugins we found target v4. Writing our own plugin keeps the app on supported versions and is a deliberate learning goal.

## 5. Architecture

Three layers. Dependencies point inward to the domain layer.

```
Screens (React Native)          Home · Train · Debrief · Log & goals · Settings
        │ calls
Domain logic (pure TypeScript)  Rep counters · Debrief & tips · Scoring & goals · Countdowns
        ▲ feeds
Adapters (behind interfaces)    PoseSource · HealthImporter · Storage repositories
```

- **Domain layer:** no React, camera, native or database imports. It's fully testable with Jest on a laptop and reusable on iOS later.
- **`PoseSource` interface:** streams `PoseFrame`s. Implementations:
  - `NativePoseSource`: our VisionCamera v5 plugin.
  - `ReplayPoseSource`: plays back a recorded landmark file, for tests, tuning and demos.
- **`HealthImporter` interface:** a Health Connect implementation.
- **Storage repositories:** functions over SQLite. Screens never write SQL directly.

### Suggested folder layout

```
app/                 screens and navigation (Expo Router)
src/domain/
  pose/              PoseFrame type, smoothing, geometry helpers, calibration
  reps/              pushUpCounter, sitUpCounter, rule configs, RepOutcome types
  scoring/           table loader, scorer, award rules
  scoring/tables/    versioned JSON scoring tables
  goals/             gap and "cheapest points" calculation
  countdowns/
  debrief/           fault ranking, tip selection
  tips/              tips.json (fault → tip + drill)
src/adapters/
  pose/              NativePoseSource, ReplayPoseSource
  health/            HealthConnectImporter
  storage/           db.ts, migrations/, repositories
modules/pose-plugin/ Kotlin Nitro frame processor plugin (MediaPipe)
tools/pose-pipeline/ Python: video → landmark JSON; labelling helpers
test-data/           recordings (landmark JSON + labels; videos kept out of git)
```

## 6. Pose data and rep counting

### 6.1 Data types

```ts
type Landmark = { x: number; y: number; z: number; visibility: number }; // x,y normalised 0–1
type PoseFrame = { tMs: number; width: number; height: number; landmarks: Landmark[] /* 33, MediaPipe order */ };

type RepOutcome =
  | { kind: 'valid' }
  | { kind: 'no_count_form'; reasons: FormFault[] }   // primary reason first
  | { kind: 'no_count_unclear'; missing: BodyPart[] };

type RepRecord = { index: number; startMs: number; endMs: number; outcome: RepOutcome; metrics: Record<string, number> };
```

The laptop pipeline and the native plugin both produce this exact format, so recordings from either source can be replayed through the same counters.

### 6.2 Shared processing
- **Smoothing:** a One Euro filter on each landmark, to cut jitter without adding much lag.
- **Near side:** during the ready check, the side of the body with the higher average landmark visibility is chosen. All rules use that side only.
- **Calibration:** during the ready check, store upper-arm, forearm, thigh and torso lengths. Distance thresholds are expressed as multiples of these lengths.
- **Person lock:** if segment lengths change by more than 25% from calibration, or the hip centre jumps more than one torso length between frames, the tracked person is treated as lost. Those frames count as unclear.
- **Visibility gate:** a required landmark with visibility below 0.6 is "unseen". If required landmarks are unseen for more than 30% of a rep's frames, that rep is `no_count_unclear`.
- **Sustained faults:** a form fault must hold for at least 3 consecutive frames (about 200 ms at 15 fps) before it counts.
- **Hysteresis:** each phase has separate enter and exit thresholds, so one rep can't be counted twice.

### 6.3 Push-up rules
Phases: `top → descending → bottom → ascending → top` (one rep).

| Rule | Measure (near side) | Starting threshold |
|---|---|---|
| Lockout at top | elbow angle (shoulder–elbow–wrist) | ≥ 160° |
| Depth at bottom | elbow angle, and shoulder drop relative to wrist height | ≤ 90° and shoulder within 0.35 × upper-arm length of wrist height |
| Straight back | shoulder–hip–ankle angle; sag if the hip is below the shoulder–ankle line, pike if above | ≥ 160° throughout |

Fault codes: `no_lockout`, `not_deep_enough`, `hips_sagging`, `hips_piking`.

### 6.4 Sit-up rules
Phases: `down → rising → up → lowering → down` (one rep).

| Rule | Measure (near side) | Starting threshold |
|---|---|---|
| Back down at bottom | torso angle to the floor (hip→shoulder vector) | ≤ 20° |
| Elbow reaches knee at top | elbow–knee distance ÷ thigh length | ≤ 0.35 |
| Hand stays at head | wrist–ear distance ÷ upper-arm length | ≤ 0.5 throughout |

Fault codes: `not_back_down`, `elbows_short_of_knees`, `hands_off_head`.

**Known limit:** the far hand is hidden from the camera. The near-hand check catches the hand leaving the head, but it can't confirm the exact hand position. The debrief wording must not claim more than this.

### 6.5 Thresholds are settings, not code
All thresholds live in a versioned `RuleConfig` JSON per exercise. The numbers above are **starting points to tune** against labelled recordings (section 11). The exact official standards are an open item (section 13). If the official rule differs, we change the config and re-run the replay tests.

## 7. Training session flow

1. **Choose:** exercise (push-ups or sit-ups), then mode (IPPT test, 60 s, or free practice).
2. **Phone setup guide:** on the floor, side-on, about 2 m away, landscape, whole body in frame.
3. **Ready check:** the user holds the start position. The app needs every required landmark visible for 1 s, then calibrates and locks onto the person.
   - It shows a specific message if something's wrong ("move the phone back", "feet out of frame").
   - It measures processing speed. Below **12 fps**, test mode is blocked and practice shows a warning.
4. **3-2-1 beep**, then the set runs.
   - **On screen:** large valid count, no-count counter, timer, and the last no-count reason for about 2 s.
   - **Sound:** a short beep for a valid rep, a different tone for a no-count.
5. **Save:** the session plus every `RepRecord`.
6. **Debrief:**
   - **Score:** valid reps and station points for the user's age group.
   - **Timeline:** a strip of dots, green for valid, red for form fault, grey for unclear.
   - **Tip:** the most common form fault, with one tip and one drill. If unclear reps are at least 20% of all reps, camera placement advice comes first.
   - **Goals:** test-mode results update the station's "latest result" and the goal gap. Practice results don't, because they're untimed.

## 8. Scoring, goals and countdowns

### 8.1 Scoring
- **Tables:** stored as versioned JSON in `src/domain/scoring/tables/`, with the source and date recorded in each file. Points come from the station result and the user's age group.
- **Award thresholds:** from the official NS portal (ns.gov.sg), for NSmen.
  - Pass ≥ 51
  - Pass with Incentive ≥ 61
  - Silver ≥ 75
  - Gold ≥ 85
  - Gold for Commando/Diver/Guards ≥ 90
  - At least 1 point is required at every station.
- **Results outside the table:** above the maximum gets full points; slower than the slowest run time gets 0 points.
- **NSF pass mark, elite Silver threshold and the age rule:** these are open items (section 13). The scorer reads them from config rather than hard-coding them.

### 8.2 Goals
- **Inputs:** target (award or score), IPPT date, the latest test-mode, manual or imported result per station, and age group.
- **Output per station:**
  - Current points.
  - The improvement needed for the next 1, 3 and 5 points (reps, or seconds off the run).
  - That improvement as a **% of current performance**.
- **"Cheapest points":** stations are ranked by smallest % improvement per point. This compares reps and seconds on equal terms. The run's 50-point weight shows up naturally in this ranking.
- **Total gap:** points still needed for the target, and whether it's reachable from the current numbers.

### 8.3 Countdowns
- **Calendar:** all dates use the Asia/Singapore time zone, counted in calendar days.
- **ORD/ROD passed:** the countdown is replaced by a congratulations message and an offer to switch the profile to NSman.
- **IPPT date passed:** the app asks the user to log their actual result and set the next date.

## 9. Data model (SQLite)

| Table | Key fields |
|---|---|
| `profile` (single row) | dob, status (`nsf`/`nsman`), service (`saf`/`spf`/`scdf`), elite_vocation (bool), ord_rod_date, ippt_date |
| `goal` (single active) | target_kind (`award`/`score`), target_value, created_at |
| `sessions` | id, station (`pushup`/`situp`/`run`), source (`camera_test`/`camera_practice`/`manual`/`health_connect`), started_at, valid_count, no_count_form, no_count_unclear, run_time_s, run_distance_m, adjusted (bool), external_id, rule_config_version, model_version |
| `reps` | session_id, idx, start_ms, end_ms, outcome, reasons (JSON), metrics (JSON) |
| `meta` | schema_version |

- **Latest result per station:** the most recent session whose source is `camera_test`, `manual` or `health_connect`.
- **Health Connect import:**
  - Reads running exercise sessions plus their distance.
  - Offers only runs between 2.3 and 2.6 km.
  - Scales the time to 2.4 km at the same pace and marks it `adjusted`.
  - Records the source's ID in `external_id` so the same run can't be imported twice.
- **Backup:** exports all tables as one JSON file through the Android share sheet. Import checks `schema_version` and the file's structure, and asks for confirmation before replacing data.
- **Migrations:** numbered and run at launch.

## 10. Error handling

| Situation | Behaviour |
|---|---|
| Camera permission refused | Explain why, offer a button to open settings. The rest of the app, including manual entry, still works. |
| Processing below 12 fps | Test mode blocked; practice works with a warning. |
| Person leaves frame / phone moves | Frames count as unclear. Test mode: timer keeps running and the debrief marks the gap. Practice: pauses automatically until the person is tracked again. |
| Another person in frame | Person lock (6.2). A tracking switch counts as unclear rather than producing wrong reps. |
| Poor lighting or baggy clothes | Shows up as unclear reps; the debrief gives placement and lighting advice. |
| App interrupted (call, app switch, screen lock) | Screen stays awake during a set. Test mode: the set is thrown away as incomplete. Practice: reps so far are kept. |
| Pose model or plugin fails to start | Show an error with a retry option and offer manual entry. Log the error locally. |
| Health Connect missing or permission refused | The import button explains what's needed; manual entry always works. |
| Manual entry out of range | Must be 0–100 reps and 7:00–25:00 for the run. |
| Corrupt or incompatible backup file | Rejected before any data is touched. |

## 11. Testing

1. **Unit tests (Jest):**
   - Scorer: official table values, age-band edges, results outside the table, award thresholds.
   - Goals: gap and cheapest-points maths.
   - Countdowns: date edges in Singapore time.
   - Debrief: tip selection.
   - Migrations.
2. **Synthetic rep tests:** hand-built `PoseFrame` sequences for every rule and fault, plus low-visibility, person-switch and jitter cases. Each checks the exact `RepRecord`s produced.
3. **Laptop recording pipeline**, built before any native code:
   1. Film sets on a phone.
   2. A Python script (`tools/pose-pipeline/`) runs the same MediaPipe Pose Landmarker model to produce `PoseFrame` JSON at 15 fps.
   3. A label file per recording lists each rep's time range, the expected outcome and the fault, judged by watching the video.
   4. A Jest replay suite runs every recording through the counters and reports how often they agree with the labels.
4. **Data set to start:** about 30 one-minute sets per exercise.
   - 5–8 people with varied builds and clothing.
   - Indoor, outdoor and night lighting.
   - At least 2 Android phones, including one mid-range.
   - At least 20 deliberate examples of each fault.
   - Get each person's consent. Videos stay on local disk and out of git; only landmark JSON and labels are committed.
5. **Held-back set:** one third of recordings are never used for tuning. Acceptance targets are measured only on these.
6. **Checking on the phone itself:** once the native plugin exists, the development build can save video alongside on-device landmarks. A handful of on-device recordings confirm the thresholds hold, since the laptop and phone versions of the model can differ slightly. Release builds never save video.
7. **Release checklist (manual, real phones):** permission flows, interruptions, the speed check on the slowest phone, Health Connect import, backup round trip.

### Acceptance targets (held-back set)
- Valid count within ±1 of the human count on **≥ 90%** of sets.
- Per-rep outcome agreement **≥ 90%**.
- Primary no-count reason matches on **≥ 80%** of no-count reps.
- Unclear reps **< 5%** when the phone is set up as the guide says.
- On a mid-range test phone: **≥ 15 fps** sustained over a 60 s set.

## 12. Privacy and release

- Video is processed on the phone and never stored or sent in release builds. The app makes no network calls in version 1 and includes no analytics.
- A privacy policy is required, covering camera use and Health Connect access.
- **Google Play:**
  - Complete the Data safety form.
  - Submit the Health Connect permission declaration (read exercise and distance only).
  - Check the current testing requirement for new developer accounts. Unit mates can be closed testers.
- First-launch screens:
  - "Not affiliated with MINDEF/SAF/SPF/SCDF; scores are practice estimates."
  - Health disclaimer: "Consult a doctor if you have medical conditions."

## 13. Open items to verify before or during planning

| Item | Why it matters | How to resolve |
|---|---|---|
| Official push-up and sit-up rep standards | Unofficial sources disagree on push-up depth (chest touch vs about a fist from the floor) and sit-up hand position (fingers interlocked behind head vs hands cupped on ears). | Read the official ns.gov.sg station page in a browser (it didn't render for automated fetching), then update `RuleConfig`. |
| Full scoring tables and age-band rule | Needed for points; which date determines your age group | Get the official tables; confirm the age rule. |
| NSF pass mark; Commando/Diver/Guards Silver threshold | Award shown to NSFs and elite vocations | Official source; keep in config. |
| Do SPF and SCDF use the same IPPT format and tables? | Users selecting SPF/SCDF | Check official sources. Until confirmed, show SAF tables with a note. |
| Expo SDK compatibility with VisionCamera v5 and Nitro modules | Project setup | Check at the start of the implementation plan. |
| MediaPipe model variant (lite vs full) | Speed vs accuracy on mid-range phones | Measure in the plugin milestone; record `model_version`. |
| Google Play new-account testing requirement | Release timeline | Check the current Play Console policy before release prep. |

## 14. Build order (milestones)

0. **Skeleton:** Expo project with a development build on a real Android phone, domain folder, Jest, SQLite with migrations.
1. **Usable app without the camera:** profile, countdowns, scoring, goals, manual entry, history, Home. Verify the official tables (section 13) here.
2. **Counting rules, proven on the laptop:** Python pipeline, labelled recordings, push-up counter tuned until it meets the acceptance targets on the held-back set.
3. **Native plugin and live push-ups:** Kotlin Nitro plugin on VisionCamera v5 with MediaPipe, `NativePoseSource`, Train screen, ready check, sound cues, debrief, tips. Confirm thresholds with on-device recordings.
4. **Sit-ups:** rules, recordings, tuning to targets, then live.
5. **Import, backup and release prep:** Health Connect import, backup export/import, privacy policy, Data safety form, Health Connect declaration, closed testing.

Each milestone ends with something you can use or measure. Milestone 2 is the go/no-go point for the camera feature: if the targets can't be met, we revisit the rules or camera setup before writing native code.
