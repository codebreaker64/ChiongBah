# Chiong Bah: UI redesign, gold medal brand and camera screens (spec)

- **Date:** 5 November 2026
- **Status:** Kai Jie approved the designs ("Looks good"). This spec is the brief for building them.
- **Source of truth for visuals:** the design canvas "Chiong Bah screens" (claude.ai artifact `TnKsYZUNBxZXwbe8dkA2Wf`). If this document and the canvas disagree on a pixel, the canvas wins. If they disagree on behaviour, this document wins.
- **Builds on:** `docs/superpowers/specs/2026-10-21-ns-ippt-trainer-design.md` (the version 1 spec). Rep-counting rules, the scoring engine, the SQLite model and the privacy position all stay as written there. This spec only covers what the user sees and how it moves.

---

## 1. Summary

This round makes four changes to the app. First, it gives the app a new identity. The crosshair or "marksman" emblem was too close to weapons imagery, so it is replaced with a **gold IPPT medal with rank chevrons**, and the splash screen is cut down to the mark and the wordmark. Second, it adds the **sit-up camera flow**, which sits beside the push-up flow and uses the same patterns. Third, it adds a small, deliberate set of **animations**, each of which has a reduced-motion version. Fourth, it applies a **polish pass**: annotation text comes off the screens, focus and selection states are added, numerals are tabular, and some copy is tightened.

The splash screen follows a pattern that is common across the leading fitness apps on Mobbin, all on iOS: a dark ground with one small centred mark and no tagline. The references are [WHOOP](https://mobbin.com/screens/062557a9-3719-49fa-8803-e703fb75dd48), [Strava](https://mobbin.com/screens/17bda029-9fd8-4dee-aebe-95c08e0f3e62), [Nike Training Club](https://mobbin.com/screens/c43e0ff5-9d71-4eb1-9dfb-e97d66bcc1cc), [Oura](https://mobbin.com/screens/11e3c10d-cdb8-41d7-a136-822aa8070aed), [Centr](https://mobbin.com/screens/2ab1e350-a356-46fe-8e6e-943bb2f81378) and [Equinox+](https://mobbin.com/screens/19cd0271-8c22-4082-8cf7-3d8e237b1e8f).

## 2. Scope

### In this round

| Area | Screens | What changes |
|---|---|---|
| Launch | Splash, Welcome | New medal mark, no tagline, splash animation |
| Onboarding | Steps 1 to 7 | Progress bar animates on from the previous step; annotations removed; conditional steps (section 6) |
| Everyday | Home, Log, Add result, Import, Goals, Score tables | Bars fill in, tabular numerals, real 22 to 24 points |
| Camera: push-ups | Choose station, Allow camera, Get in frame, Counting, Result | New camera access illustration; counting and result motion |
| Camera: sit-ups | Choose station, Get in frame, Counting, Result | **New.** Uses the push-up camera access screen |
| Settings and support | Settings, Help, Terms, Privacy | Visual consistency only |

### Not in this round

These items wait for a later round: iOS, a light theme, sound and haptic design beyond "one tick per rep", the JSON backup screens, and the 2.4 km run camera. The run has no camera mode at all.

## 3. Brand

### 3.1 The mark: gold medal

The mark is a round gold medal hanging from a short V-shaped green ribbon. Two dark chevrons, a rank-style motif, are cut into the face of the medal.

| Part | Spec |
|---|---|
| Ribbon | Two polygons, accent green `#8FBF6A` and dark green `#5E8A44`, meeting in a V above the disc |
| Disc | Circle of radius 38 (in an approximately 120 × 140 viewBox), fill gold `#E0B354` |
| Inner ring | Stroke in dark gold `#B98C34`, inset from the edge |
| Chevrons | Two stacked upward chevrons in `#0B0D0A`, centred on the disc |
| Shine | A soft diagonal light band clipped to the disc, used only for the splash glint |

The mark must not use official crests, the SAF or MINDEF insignia, real rank insignia copied one to one, weapons, targets or crosshairs. The chevrons are generic. This matters because the Terms already say the app is unofficial. It is also why we avoid looking like an official app, which could get the app rejected from Google Play.

**Gold variants.** The canvas offers three golds: `#E0B354` (default), `#D4A64A` and `#C9B26B`. Ship `#E0B354` unless that changes.

**Alternatives, not chosen.** The "Logo options" board also shows two alternative marks: **rank chevrons** (three stacked chevrons in gold, green and dark green) and a **dog tag** with "CB" engraved. Keep the SVGs in the repo as `assets/brand/alt-*.svg` in case the choice changes, but do not ship them.

### 3.2 Wordmark

The wordmark is "CHIONG BAH" in Barlow Condensed 700, 36 px, with 4 px letter-spacing, in text colour `#EEF1EA`. There is no tagline.

### 3.3 Where the mark appears

| Place | Size | Notes |
|---|---|---|
| Splash | About 120 px tall, with the wordmark below it | Animated (section 5.2) |
| Welcome | About 96 px, above the heading | Static |
| App icon (adaptive) | Medal only, on `#0B0D0A` | The foreground layer must keep the medal within the 66 % safe zone |
| Android 12+ system splash | Medal only, on `#0B0D0A` | See section 9.1 for how this hands off to the animated splash |

## 4. Design tokens

### 4.1 Colour

| Token | Hex | Use |
|---|---|---|
| `bg` | `#0B0D0A` | App background, bottom sheets on camera screens |
| `surface` | `#161A14` | Cards, app bars |
| `surfaceSelected` | `#1D231A` | Selected option cards, "New best" badge fill |
| `chip` | `#232920` | Unselected chips and segmented buttons |
| `border` | `#2A3026` | Card borders, dividers, ring tracks |
| `text` | `#EEF1EA` | Primary text |
| `muted` | `#9AA394` | Secondary text, captions |
| `accent` | `#8FBF6A` | Primary buttons, selected states, progress, links |
| `accentHover` | `#A9D486` | Pressed and hover state for links |
| `accentDark` | `#5E8A44` | Ribbon, secondary bar segments |
| `gold` | `#E0B354` | Medal, award highlights, "New best", form cues |
| `goldDark` | `#B98C34` | Medal inner ring |
| `danger` | `#FF6B5E` | Stop button, recording dot, failed checks |
| `cameraBg` | `#1A1E17` | Background behind the camera preview |
| `scrim` | `rgba(11,13,10,0.7)` | Pills over the camera preview (0.55 behind the ring, 0.85 behind cues) |

All text on `bg` and `surface` meets WCAG AA. `muted` on `surface` is about 6:1. Dark text (`#0B0D0A`) on `accent` and on `danger` is above 7:1.

### 4.2 Type

| Role | Font | Size and weight |
|---|---|---|
| Display numbers (count, result) | Barlow Condensed | 112 to 120 px, 700, tabular |
| Hero score (Home) | Barlow Condensed | 84 px, 700, tabular |
| Screen titles | Barlow Condensed | 28 to 34 px, 700 |
| App bar title | Inter | 19 px, 600 |
| Button label | Inter | 17 px, 600 (primary) and 16 px, 600 (secondary) |
| Body | Inter | 15 to 16 px, 400 to 500, line height 1.4 to 1.5 |
| Caption | Inter | 13 px, 400 |
| Small label | Inter | 12 px, 500 |

**Numerals.** Every number that changes or lines up with another number uses tabular figures (`fontVariant: ['tabular-nums']`). That covers scores, points, rep counts, times, countdowns and step counters. Without tabular figures, a count from 19 to 20 would make the layout jitter.

Load both fonts with `expo-font` (Barlow Condensed 600 and 700; Inter 400, 500 and 600). Keep the native splash showing until the fonts have loaded.

### 4.3 Shape and spacing

| Thing | Value |
|---|---|
| Screen padding | 24 px sides. 48 px top on full screens (below the status bar). 40 px bottom |
| Card radius | 16 px (big cards) and 14 px (rows, buttons) |
| Chip radius | Fully rounded (`height / 2`) |
| Primary button | 52 px tall, radius 14, `accent` fill, `bg` text |
| Secondary button | 48 px tall, radius 14, 1 px `accent` border, `accent` text |
| Tertiary button | 48 px tall, 1 px `border` border, `text` text |
| Minimum touch target | 44 × 44 px everywhere, including the ± stepper and close buttons |
| Gaps | 8, 10, 12, 14, 16 and 18 px (pick the nearest one; avoid others) |

### 4.4 States

| State | Treatment |
|---|---|
| Focus (keyboard or switch access) | 2 px `accent` outline, 2 px offset |
| Text selection | `accent` background, `bg` text |
| Selected option card | `surfaceSelected` fill and a 1 px `accent` border |
| Pressed | Opacity 0.85, or `accentHover` for links |
| Disabled | Opacity 0.4, and not focusable |
| Failed check | Circle with a 2 px `danger` outline and a `danger` cross |
| Passed check | Filled `accent` circle with a `bg` tick |

## 5. Motion

### 5.1 Principles

Motion in this app has one job: to tell you something changed. There is one moment of showmanship, the splash glint, and everything else is feedback or continuity. The house easing is `cubic-bezier(0.16, 1, 0.3, 1)`, a fast-out, soft-landing curve. Durations sit between 320 and 700 ms. Nothing loops except things that represent a live process: the recording dot, the timer ring, and the flag on a failed check.

**Reduce motion.** When the system setting "Remove animations" is on (read it with `AccessibilityInfo.isReduceMotionEnabled()` and Reanimated's `useReducedMotion()`), every animation jumps to its end state. Looping animations stop, and the rep-count pulse is skipped. The timer ring still updates, but it steps once a second instead of draining smoothly, because it carries information.

Use `react-native-reanimated` (already a dependency, 4.7.1) for all of this. Run animations on the UI thread, and animate only `transform` and `opacity`. Do not animate width, height or layout properties.

### 5.2 Motion table

| Where | What moves | Timing |
|---|---|---|
| Splash: medal | Fades in and rises 14 px, scaling from 0.92 to 1 | 650 ms, house easing |
| Splash: ribbon | Drops in 10 px | 650 ms, 80 ms delay |
| Splash: glint | The shine band sweeps across the disc, clipped to it | 700 ms, `cubic-bezier(0.4,0,0.2,1)`, 550 ms delay |
| Splash: wordmark | Wipes in from left to right (clip), opacity 0.2 to 1 | 500 ms, 750 ms delay |
| Splash: exit | Cross-fades to Welcome or Home | About 1.2 s after start. Never more than 1.5 s, and skipped on warm starts |
| Onboarding progress bar | Scales on from the previous step's fraction (0, 0.48, 0.67, 0.75, 0.8, 0.83, 0.86) to the current one | 500 ms |
| Home: points bars | Each bar fills left to right (scaleX 0 to 1), staggered 0, 70 and 140 ms | 700 ms |
| Home: score | Counts up from 0 to the score | 700 ms, matching the bars |
| Goals: progress bar | Fills to the current percentage (91 % in the mock) | 700 ms |
| Counting: rep number | Pops on each valid rep, scale 1.1 to 1 | About 300 ms, triggered by the rep, not on a loop (see the note below) |
| Counting: timer ring | Drains clockwise from 12 o'clock as the 60 s runs out | Linear, tied to the real timer |
| Counting: recording dot | Pulses, opacity 1 to 0.35 | 1.2 s loop |
| Counting: form cue | Slides up 10 px and fades in when a rep is not counted, then fades out after 2.5 s | 320 ms in |
| Get in frame: failed joint | A `danger` ring pulses on the joint that fails the check | 1.6 s loop, stops when the check passes |
| Result: 10 s bars | Each bar rises (scaleY 0 to 1 from the bottom), staggered 50 ms, starting at 100 ms | 600 ms each |
| Result: "New best" | Pops in, scale 0.85 to 1 with a fade | 450 ms, 500 ms delay |

> **Canvas note.** On the canvas, the rep pulse and the ring drain run on a timed loop so they can be seen in a static mock-up. In the app, the pulse fires once per counted rep, and the ring follows the real timer. Do not copy the loop.

## 6. Navigation and conditional steps

### 6.1 First launch

```
Splash → Welcome and disclaimers → Onboarding 1 to 7 → Home
```

On a later launch, the flow is Splash → Home. The splash is only shown on a cold start.

### 6.2 Onboarding steps and who sees them

| Step | Question | Shown to |
|---|---|---|
| 1 | When were you born? | Everyone |
| 2 | NSF or reservist? | Everyone |
| 3 | Which service? (SAF, SPF or SCDF) | Everyone |
| 4 | Commando, Diver or Guards? | SAF only |
| 5 | When is your ORD? (ROD for SPF and SCDF) | NSFs only |
| 6 | When is your next IPPT? (optional, "Skip for now") | Everyone |
| 7 | What are you aiming for? | Everyone. "Pass with Incentive" appears only for reservists |

The step counter shows the user's actual position out of their total. A reservist in the SPF sees "1 of 5" to "5 of 5", not "1 of 7" with gaps. The progress bar fractions follow the same rule. The canvas shows the longest route (an SAF NSF) with seven steps.

The current code collects all of this on one form in `src/app/onboarding/profile.tsx`. This round splits it into one screen per step. The `ProfileForm` validation logic should be kept and reused per step.

### 6.3 Tabs

The four tabs are Home, Log, Goals and Settings, as now. The camera flow, Add result, Import, Score tables, Help, Terms and Privacy are pushed screens with a back button, or a close button for the camera flow.

### 6.4 Camera flow

```
Home "Count reps with camera"  ─┐
Add result "Count with camera" ─┼→ Choose station (push-ups | sit-ups)
                                │        ↓ Continue
                                │  Allow camera   (first time only; shared by both stations)
                                │        ↓
                                │  Get in frame   (station-specific checks)       ┐ landscape
                                │        ↓ auto-starts when every check passes,   │
                                │          or "Start anyway"                      │
                                │  Counting (60 s)                                ┘
                                │        ↓ timer ends, or "Stop"
                                └  Result → Save to log | Try again (back to Get in frame) | Discard (Home)
```

**Orientation.** The app stays portrait everywhere except **Get in frame** and **Counting**, which are locked to landscape for both stations. A person in a plank or lying down for sit-ups is wide rather than tall, so landscape gives the pose model more pixels on the body and lets the phone sit further back. The app rotates to landscape as you leave Allow camera (or Choose station, once permission has been granted), and goes back to portrait on Result. Try again rotates back to landscape. Lock to `LANDSCAPE` rather than a single direction, so the user can prop the phone either way up and the preview is never upside down.

On Choose station, the two station cards act as a segmented control. Tapping Sit-ups swaps the illustration and tips in place; it is one route with a `station` parameter, not two separate screens. The canvas draws the two states as separate boards only so both can be seen.

"Type my reps instead" on Allow camera opens Add result with that station pre-selected.

## 7. Screens

All numbers below come from the mock profile: a 22-year-old SAF NSF, not in Commando, Diver or Guards, born on 12 May 2004. Their results are 42 push-ups (20 pts), 38 sit-ups (19 pts) and a 10:40 run (38 pts), for a total of 77, which is Silver. Their IPPT is on 30 November 2026 (25 days away) and their ORD is on 15 January 2027 (71 days away). All points come from the official 22 to 24 column. In the app, every number comes from the scoring engine and the database.

### 7.1 Splash
The splash is on `bg` and shows the medal and the "CHIONG BAH" wordmark, centred slightly above the middle. There is nothing else on it: no tagline, no loader and no version number. The motion is described in section 5.2.

### 7.2 Welcome and disclaimers
This screen shows the medal, the heading "Train for your next IPPT", and the body "Log your push-ups, sit-ups and 2.4km runs, see your points, and find the cheapest way to your goal." Two disclaimer rows follow: "Not affiliated with MINDEF/SAF/SPF/SCDF; scores are practice estimates." and "Consult a doctor if you have medical conditions." The primary button is "I understand", and the app records the date on which it was accepted.

### 7.3 Onboarding 1 to 7
Every step uses the same layout. At the top is a back button, the step counter ("2 of 7") and the progress bar. The question is in display type, with one line of why-we-ask copy in `muted`. Below that is the input: date fields, or option cards with a title and a sub-line. The primary button "Continue" is pinned at the bottom, and is disabled until the step is answered.

| Step | Copy | Extras |
|---|---|---|
| 1 Age | "When were you born?" / "Your IPPT points depend on your age group." | Live readout: "22 years old · Scored in the 22 to 24 age group" |
| 2 Status | "Which describes you?" / "The pass mark and your countdowns depend on it." | NSF: "Serving full-time national service". Reservist: "Operationally ready, with in-camp training and IPPT" |
| 3 Service | "Which service?" / "Sets whether you count down to ORD or ROD." | SAF: "Army, Navy or Air Force". SPF: "Police". SCDF: "Civil Defence" |
| 4 Vocation | "Commando, Diver or Guards?" / "These vocations need more points for Silver and Gold." | Yes: "Silver 80, Gold 90". No: "Silver 75, Gold 85" |
| 5 ORD | "When is your ORD?" / "Home counts down the days." | Live readout: "71 days to go" |
| 6 IPPT | "When is your next IPPT?" / "Optional. It sets the deadline for your goal, and you can add it later in Settings." | Readout: "25 days to train". Secondary button: "Skip for now" |
| 7 Goal | "What are you aiming for?" / "Goals shows how many points you still need, station by station." | Gold 85, Silver 75, Pass 61 (and Pass with Incentive for reservists). Button: "Start training". Secondary button: "Decide later" |

The award thresholds shown on step 7 change with the answer to step 4.

### 7.4 Home
The app bar shows "Chiong Bah" and an "Add result" action. The hero card shows the IPPT score "77 /100", the award "Silver" and the line "8 points to Gold". Below it are three station rows, each with the result, the points and a bar: Push-ups 42 reps 20 pts, Sit-ups 38 reps 19 pts, and 2.4km run 10:40 38 pts. The caption reads "Practice estimate · age group 22 to 24". Next come two countdown tiles, "25 days to IPPT" and "71 days to ORD". (A reservist sees only the IPPT tile. The ORD tile reads ROD for SPF and SCDF.) The last item is a camera card: "Count reps with camera · Push-ups or sit-ups, timed for 1 minute".

### 7.5 Log
The app bar shows "Log" and "Add result". Below it is a link row, "Import runs from Health Connect". Results are grouped by date, newest first. Each row shows the big value, the station name, the source ("Camera count", "Typed in", or "Health Connect · scaled from 2.51 km") and the points on the right.

### 7.6 Add result
A segmented control picks the station: Push-ups, Sit-ups or 2.4km run. Next comes the value input: a reps stepper, or mm:ss for the run. A live hint shows what the value is worth against the user's best, for example "Worth 1 more than your best · 21 pts". Below that is a "Count with camera instead" link, which only appears for push-ups and sit-ups. The screen ends with "Save" and "Cancel".

### 7.7 Import from Health Connect
The intro reads: "Runs of 2.3 to 2.6 km from the last 90 days in Health Connect, scaled to 2.4 km at the same pace." Each run row shows the scaled time and points, plus the date, the raw distance and time, and the source app. Each row has its own "Import" button, which changes to "Imported" once used. The footnote reads: "Scaled times are marked in your log, because GPS distances are rarely exact." The screen ends with "Done".

### 7.8 Goals
The header reads "8 points to Gold" and "25 days left", with a progress bar from "Now 77 · Silver" to "Gold 85". The card "Easiest route to Gold" lists one step per station: "Sit-ups 38 → 43 reps +2 pts", "Push-ups 42 → 47 reps +2 pts" and "2.4km run 10:40 → 10:00 +4 pts". It ends with "Together 85 · Gold". The "What if" card has a station segmented control and a slider, with the readout "10:20 · 20 s faster · +2 pts" and "Total 79/100 · Silver". A "Score tables by age" link sits at the bottom.

### 7.9 Score tables
A segmented control picks the station. A note follows: "Points for each result by age group. Scroll sideways to see every age group." The table area is a white card that holds the official table image, and it pans both ways. The push-up image already exists. The sit-up and run images are needed (open item 3 in section 11).

### 7.10 Camera: choose station (push-ups and sit-ups)
- **Shared:** a close button, the title "Count with camera", and the sub-line "A 1-minute timed set, counted the way an IPPT station does." Two station cards show the personal best ("Push-ups · Best 42", "Sit-ups · Best 38"), and the selected card uses the selected-card style. Below the tips is a hands-free start note in a `surface` card with a speaker icon: "Hands-free start: once everything is ticked and you are in push-up position (sit-up position), the phone says “3, 2, 1, go” out loud and the timer starts." The note is there so the voice does not startle the user. Below it, the privacy line reads "Video stays on your phone. Nothing is recorded or uploaded." The primary button "Continue" ends the screen.
- **Push-ups:** the illustration shows a phone turned sideways on the floor about 2 m to the side of someone in the push-up position, captioned "Phone sideways, about 2 m away, side on". The tips are "Prop your phone sideways on the floor, side on to you.", "Keep your whole body, head to feet, in frame." and "Good light and a plain background help."
- **Sit-ups:** the illustration shows the same set-up, with a person in the sit-up position with knees bent. The tips are "Prop your phone sideways on the floor, side on to you.", "Knees bent, feet flat or held by a buddy." and "Keep your whole body, head to feet, in frame."

### 7.11 Camera: allow access (shared)
A camera icon sits in a `surface` disc, with the heading "Allow camera access". The body reads "The camera is only on while you count. Each frame is checked on your phone to find your body position, then thrown away." The primary button is "Allow camera", which brings up the system prompt. The secondary button is "Type my reps instead". The footnote reads "You can change this later in Android settings." If the user has already refused permission permanently, the primary button changes to "Open settings".

### 7.12 Camera: get in frame (landscape, 844 × 390)
The camera preview takes the left side of the screen, with the tracked skeleton drawn over it (accent lines and white joints) and four corner frame brackets. A close button and a "Push-ups · 1:00" or "Sit-ups · 1:00" pill float at the top left. A side panel on the right, 300 px wide, uses `bg` with a 24 px radius on its left corners. The panel holds a heading for the first failing check (26 px), one line of help, the checklist, and "Start anyway" pinned at the bottom.

| Station | Checks | Example of a failing heading |
|---|---|---|
| Push-ups | Side on to the camera · In push-up position · Whole body in frame | "Move the phone back a little" / "Your feet are cut off." |
| Sit-ups | Side on to the camera · Whole body in frame · Knees bent | "Bend your knees" / "Knees at about a right angle, feet flat." |

The help line ends with "The timer starts by itself once everything is ticked." The joint that fails a check gets the pulsing `danger` ring. When every check passes, the phone says "3, 2, 1, go" out loud (with the numbers also shown on screen), and then the timer begins. If a check fails during the countdown, the countdown cancels and waits again. "Start anyway" skips the remaining checks.

The knee angle threshold for "Knees bent" comes from the sit-up rule config in section 6.4 of the version 1 spec, not from a constant in the UI.

### 7.13 Camera: counting (landscape, 844 × 390)
The camera preview and skeleton fill the left side. A station pill and a time-left pill ("0:24 left", with a pulsing red dot) float at the top left. A side panel on the right, 240 px wide, holds the timer ring at the top: a 160 px circle with an 8 px stroke, a `border` track and an `accent` arc. Inside the ring is the count (84 px). Under the ring is the line "reps · 17 pts", where the points update live from the table.

When a rep is not counted, a cue card in a `gold` border slides up near the top of the camera area, centred over it, for 2.5 s with the reason:

| Station | Cues |
|---|---|
| Push-ups | "Go lower: that one didn't count" · "Straighten your arms at the top" |
| Sit-ups | "Lie back fully: that one didn't count" · "Sit up higher: that one didn't count" |

The foot of the panel shows "2 not counted" and "Best so far: 42" on one line, with a full-width `danger` "Stop" button (52 px) below it. Each counted rep plays one short tick sound (the version 1 spec covers this). Keep the screen awake while counting.

### 7.14 Camera: result
- **Badge:** "New best" in `gold`, shown only when the count beats the user's best for that station.
- **Headline:** "Push-ups in 1 minute" or "Sit-ups in 1 minute", then the count (112 px) and the points ("21 pts"). The sub-line gives the change and the projection, for example "Up from 42 (20 pts). Your total would be 78." If the result is not a best, the sub-line reads "Your best is 42 (20 pts)." and the total sentence is left out.
- **Pacing card:** "Reps every 10 seconds", with six bars (for example 9, 8, 8, 7, 6, 6). Bar height is in proportion to the busiest 10 seconds, and the value sits above each bar. A summary line gives the no-reps with their reasons, for example "4 not counted: 3 not low enough, 1 arms not straight at the top." or "3 not counted: 2 didn't lie back fully, 1 didn't sit up high enough."
- **Correction row:** "Count looks off? · Fix it before saving", with − and + steppers (44 px, labelled "One fewer rep" and "One more rep"). Correcting the count updates the points and the badge straight away, and marks the result as "Camera count, corrected" in the log.
- **Label:** "Camera count · practice estimate", in italic `muted` text.
- **Actions:** "Save to log" (primary), "Try again" (secondary, returns to Get in frame), and "Discard" (tertiary, returns to Home with no confirmation, since nothing has been saved).

### 7.15 Settings
- **Profile:** Date of birth, Status, Service, Commando/Diver/Guards (SAF only), ORD or ROD date (NSF only), Next IPPT and Goal. Each opens the matching onboarding step as an editor.
- **Connections:** Health Connect, with a "Connected" or "Connect" status.
- **Support:** Help & Support, Terms of Service and Privacy Policy.

### 7.16 Help, Terms and Privacy
These keep the existing copy, which is visible on the canvas. Help is an accordion. The first item, "How is my score worked out?", is open by default. Help ends with "Still stuck? Email us" and links to `kaijiefong.work@gmail.com`. Terms and Privacy are long-read pages that use `DocScreen`.

## 8. Accessibility

- Every icon-only button has an accessibility label: Close, Back, One fewer rep, One more rep, and Stop.
- The live count is a polite live region. It announces "27 reps" every 5 reps and when a rep is not counted ("Not counted, lie back fully"), so screen-reader users are not flooded with announcements.
- Camera illustrations and skeleton overlays have one descriptive label each. For example, the get-in-frame skeleton reads "Camera view: a person lying on their back with legs almost straight".
- Colour is never the only signal. Failed checks have a cross icon and text, and cues have an icon and text.
- Text scales with the system font size up to 1.3×. Above that, the display numbers are capped so the count still fits inside the 160 px ring, and the landscape panels scroll instead of clipping.
- Reduce motion is handled as described in section 5.1.

## 9. Implementation notes

### 9.1 Splash
`expo-splash-screen` shows the static medal on `#0B0D0A` (set in `app.json`). As soon as the fonts have loaded, hide the native splash and mount a React splash route. That route draws the same medal at exactly the same position, so the hand-off is invisible, and then runs the animation in section 5.2. Android 12 and later always shows the system splash icon, so the static medal must be centred and sized to match the first frame of the animation.

### 9.2 Where things live
| Thing | Location |
|---|---|
| Tokens | `src/ui/theme.ts` (new), replacing the inline colours in `src/ui/kit.tsx` |
| Medal | `src/ui/Emblem.tsx`, replacing the crosshair with a `react-native-svg` medal component that takes an optional `animated` prop. `react-native-svg` is not installed yet, so add it with `npx expo install react-native-svg` |
| Motion presets | `src/ui/motion.ts`, holding the house easing, durations and a `useMotionOK()` hook that wraps reduce motion |
| Onboarding steps | `src/app/onboarding/[step].tsx`, or one file per step, driven by a step list that applies the conditions in section 6.2 |
| Camera routes | `src/app/camera/index.tsx` (choose station, `?station=`), `access.tsx`, `frame.tsx`, `live.tsx` and `result.tsx` |
| Result bars data | Taken from rep timestamps in `RepOutcome` and grouped into six 10 s buckets in the domain layer, not in the screen |

### 9.3 Orientation
Use `expo-screen-orientation` (not installed yet; add it with `npx expo install expo-screen-orientation`). Call `lockAsync(OrientationLock.LANDSCAPE)` when the Get in frame route gains focus, and `lockAsync(OrientationLock.PORTRAIT_UP)` when Result gains focus or the flow is closed. In `app.json`, set `orientation` to `default` so the lock can take effect, and keep every other route portrait by locking it in the root layout. Pass the current rotation to the pose pipeline, because VisionCamera frames arrive in the sensor's orientation. The landmark coordinates must be rotated before the rep rules see them, otherwise "lower" and "higher" are swapped. Add a `ReplayPoseSource` recording that was filmed in landscape to the test set.

### 9.4 Fonts and numbers
Use `fontVariant: ['tabular-nums']` on every numeric `Text`. Barlow Condensed supports it. Check this on a real Pixel device, because some Android font fallbacks ignore `fontVariant`.

## 10. Acceptance checklist

- [ ] The splash shows only the medal and the wordmark, takes 1.5 s or less on a cold start, and does not appear on a warm start.
- [ ] With "Remove animations" on, every screen renders in its final state with no movement, and the timer ring steps once per second.
- [ ] Onboarding shows the correct steps and counter for each of these four profiles: SAF NSF, SPF NSF, SAF reservist and SCDF reservist.
- [ ] Home, Goals and Result points match the scoring engine for the mock profile: 77 total, 8 to Gold, 44 push-ups = 21 pts, 41 sit-ups = 20 pts.
- [ ] Both camera stations can be completed from start to finish, including "Type my reps instead", "Start anyway", Stop part-way, ± correction, Try again and Discard.
- [ ] Sit-ups reuse the shared access screen, and permission is asked for only once.
- [ ] Get in frame and Counting are landscape for both stations, work with the phone either way up, and Result and everything else stay portrait.
- [ ] All touch targets are at least 44 px, all icon buttons have labels, and the live count announces as described in section 8.
- [ ] Numbers do not shift sideways while they count.
- [ ] `npx expo lint` and `npx tsc --noEmit` are clean, and the existing Jest tests pass with new tests added for the onboarding step conditions and the 10-second buckets.

## 11. Open items

These defaults are built in unless Kai Jie says otherwise:

1. **Logo:** the gold medal, with the two alternatives kept in the repo but not shipped.
2. **Timer start:** automatic, after a 3-2-1 countdown once all checks pass, with "Start anyway" as a manual override.
3. **No-rep feedback:** both. A cue appears live during the set, and a summary with reasons appears on the result.
4. **Phone orientation:** decided. Get in frame and Counting use landscape for both stations (Kai Jie, 5 Nov).
5. **Score table images:** sit-up and 2.4 km run images are still needed for Score tables. The push-up image is already in the design.
