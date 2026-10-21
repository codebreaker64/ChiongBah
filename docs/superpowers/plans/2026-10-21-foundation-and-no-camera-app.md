# IPPT Trainer — Plan 1: Foundation and no-camera app

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An installable Android development build with profile, ORD/ROD and IPPT countdowns, IPPT scoring, goals and manual result entry, all stored on the phone.

**Architecture:** Expo (React Native, New Architecture, TypeScript) with Expo Router. All rules live in a pure TypeScript domain layer (`src/domain`) tested with Jest. SQLite storage sits behind a small `Db` interface, so repositories are tested in Node with `better-sqlite3` and run on the phone with `expo-sqlite`. Screens are thin and get repositories and the clock through `src/app-state`.

**Tech Stack:** Expo SDK (latest via `create-expo-app@latest`), Expo Router, `expo-sqlite`, `expo-dev-client`, `expo-build-properties`, Jest (`jest-expo` preset), `@testing-library/react-native`, `better-sqlite3` (tests only), ESLint.

**Spec:** `docs/superpowers/specs/2026-10-21-ns-ippt-trainer-design.md` (sections 2, 3, 4, 5, 8, 9, 10, 12, 14 milestones 0–1)

**Later plans (not this one):** Plan 2 laptop pose pipeline and push-up counter (milestone 2); Plan 3 native plugin and live push-ups (milestone 3); Plan 4 sit-ups (milestone 4); Plan 5 Health Connect, backup and release (milestone 5).

## Global Constraints

- Android first; minimum Android 8.0 (API 26), set via `expo-build-properties` `android.minSdkVersion: 26`.
- React Native New Architecture, TypeScript `strict: true`. Expo development builds (`expo-dev-client`), not Expo Go.
- `src/domain/**` must not import `react`, `react-native`, `expo*`, or anything under `src/adapters`, `src/app-state`, `src/ui`, `app/`. Enforced by ESLint (Task 1).
- All calendar dates are `YYYY-MM-DD` strings and are computed in Asia/Singapore time (UTC+8, no daylight saving).
- Unofficial app: no SAF, MINDEF, SPF or SCDF logos or branding. App name "IPPT Trainer".
- Every displayed score or award carries the label "Practice estimate".
- First-launch copy, exactly: "Not affiliated with MINDEF/SAF/SPF/SCDF; scores are practice estimates." and "Consult a doctor if you have medical conditions."
- Award thresholds: Pass (NSmen) ≥ 51; Pass with Incentive ≥ 61; Silver ≥ 75; Gold ≥ 85; Gold for Commando/Diver/Guards ≥ 90; at least 1 point at every station.
- Results above a table's best row get that row's (maximum) points; reps below the lowest row, or run times slower than the slowest row, get 0 points.
- Manual entry ranges: reps 0–100 (integers); run 7:00–25:00.
- No network calls and no analytics.
- Domain functions take `today`/`now` as parameters; nothing in `src/domain` reads the system clock.

## Review Focus

1. **Only some stations logged.** With one or two results, Home and Goals show per-station points and say which stations are missing; no total or award is shown, and nothing crashes. Tests: Task 5 (`scoreIppt` with a `null` result), Task 8 (`goalProgress` with missing station), Task 13 (Home missing-station copy).
2. **Date of birth that maps to no age band** (age under the table's youngest band, over 60, or a future date). The profile form refuses it with a message; scoring returns `{ error: 'no_age_band' }` and Home/Goals show a message instead of a score. Tests: Task 5, Task 11.
3. **Around midnight in Singapore, or a phone set to another time zone.** Countdowns and ages use the Singapore date. Tests: Task 2 (`todayInSingapore` at 15:59:59Z and 16:00:00Z).
4. **Typos in typed results and dates**: `9.45`, `9:75`, `945`, `2026-02-30`, blank. Each is rejected with a message, never stored. Tests: Task 2, Task 7, Task 12.
5. **Deleting a mistaken entry.** After deleting the most recent result for a station, the previous result becomes "latest" again and Home/Goals update. Tests: Task 10, Task 12.

---

## File structure

```
app/
  _layout.tsx                 root: bootstrap repos, providers, redirect to onboarding if no profile
  onboarding/index.tsx        disclaimers + "I understand"
  onboarding/profile.tsx      first profile form
  (tabs)/_layout.tsx          tabs: Home, Log, Goals, Settings
  (tabs)/index.tsx            Home
  (tabs)/log.tsx              history list
  (tabs)/goals.tsx            goal picker + gaps
  (tabs)/settings.tsx         edit profile
  log/new.tsx                 manual entry (modal)
src/domain/
  dates.ts                    LocalDate helpers, Singapore today, age
  profile.ts                  Profile type, scoringAge
  countdowns/countdowns.ts
  scoring/table.ts            table types, validateTable, bandForAge, stationPoints
  scoring/awards.ts           AwardRules, awardFor, scoreIppt
  scoring/awardRules.json
  scoring/tables/index.ts     exports the shipped table
  scoring/tables/saf-male.json
  scoring/__fixtures__/miniTable.ts
  entries/validate.ts         parseRunTime, validateReps
  goals/goals.ts
src/adapters/storage/
  db.ts                       Db interface, migrate
  migrations.ts
  expoDb.ts                   expo-sqlite implementation
  testDb.ts                   better-sqlite3 implementation (tests only)
  repositories.ts             profileRepo, goalRepo, sessionRepo
src/app-state/
  bootstrap.ts                createAppRepositories()
  clock.ts                    now()
  RepositoriesContext.tsx     provider + useRepositories()
  useAppData.ts               reads profile, goal, latest results, sessions; refresh on focus
  testing.tsx                 helpers for screen tests
src/ui/
  ProfileForm.tsx
  PracticeEstimateLabel.tsx
```

Tests sit next to the file they test as `*.test.ts(x)`; screen tests live in `app/__tests__/`.

---

### Task 1: Project skeleton

**Files:**
- Create: the Expo project at the repo root (keep `docs/`), `src/domain/README.md` (one line: "Pure TypeScript. No React, Expo, adapters."), `eslint.config.js`, `jest.config.js`
- Modify: `app.json`, `tsconfig.json`, `package.json`

**Interfaces:**
- Produces: `npm test` (Jest, `jest-expo` preset), `npm run lint`, path alias `@/*` → `./*` (template default).

- [ ] **Step 1: Create the app in a temp folder and move it in**

Run: `npx create-expo-app@latest ippt-tmp --template default` then move its contents (not `.git`) into the repo root; delete the template's example screens and components, leaving an empty `app/(tabs)/index.tsx` that renders `<Text>IPPT Trainer</Text>`.

- [ ] **Step 2: Install dependencies**

Run: `npx expo install expo-sqlite expo-dev-client expo-build-properties` and `npm i -D jest jest-expo @testing-library/react-native better-sqlite3 @types/better-sqlite3`

- [ ] **Step 3: Configure**

`app.json`: `name` "IPPT Trainer", `slug` "ippt-trainer", `android.package` "com.kaijiefong.ippttrainer", `newArchEnabled: true`, plugins include `["expo-build-properties", { "android": { "minSdkVersion": 26 } }]` and `"expo-sqlite"`. `tsconfig.json`: `"strict": true`. `package.json` scripts: `"test": "jest"`, `"lint": "eslint ."`. `jest.config.js`: `preset: 'jest-expo'`, `testPathIgnorePatterns: ['/node_modules/', '/docs/']`.

`eslint.config.js`: the template's config plus an override for `src/domain/**` with `no-restricted-imports` patterns `['react', 'react-native', 'react-native/*', 'expo*', '@expo/*', '**/adapters/**', '**/app-state/**', '**/ui/**', '@/app/*']`.

- [ ] **Step 4: Verify tests and the domain import rule**

Create `src/domain/smoke.test.ts` with `test('jest runs', () => expect(1 + 1).toBe(2))`. Run `npm test` → PASS. Create a scratch `src/domain/bad.ts` containing `import { View } from 'react-native';`, run `npx eslint src/domain/bad.ts` → error `no-restricted-imports`. Delete `bad.ts` and `smoke.test.ts`. Run `npm run lint` → no errors.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "chore: scaffold Expo app with Jest, lint rule for pure domain"
```

---

### Task 2: Dates

**Files:**
- Create: `src/domain/dates.ts`, `src/domain/dates.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type LocalDate = string; // 'YYYY-MM-DD'
  export function parseLocalDate(input: string): LocalDate | null;
  export function todayInSingapore(now: Date): LocalDate;
  export function daysBetween(from: LocalDate, to: LocalDate): number; // to − from, in calendar days
  export function ageOn(dob: LocalDate, on: LocalDate): number;        // whole years
  ```

- [ ] **Step 1: Write the failing tests**

```ts
test('parseLocalDate accepts real dates only', () => {
  expect(parseLocalDate('2028-02-29')).toBe('2028-02-29');
  expect(parseLocalDate('2026-02-30')).toBeNull();
  expect(parseLocalDate('26-1-1')).toBeNull();
  expect(parseLocalDate('')).toBeNull();
});
test('todayInSingapore uses UTC+8', () => {
  expect(todayInSingapore(new Date('2026-10-21T15:59:59Z'))).toBe('2026-10-21');
  expect(todayInSingapore(new Date('2026-10-21T16:00:00Z'))).toBe('2026-10-22');
});
test('daysBetween counts calendar days', () => {
  expect(daysBetween('2026-10-21', '2026-12-01')).toBe(41);
  expect(daysBetween('2026-10-21', '2026-10-01')).toBe(-20);
});
test('ageOn handles birthdays and 29 Feb', () => {
  expect(ageOn('2004-10-22', '2026-10-21')).toBe(21);
  expect(ageOn('2004-10-21', '2026-10-21')).toBe(22);
  expect(ageOn('2004-02-29', '2026-02-28')).toBe(21);
  expect(ageOn('2004-02-29', '2026-03-01')).toBe(22);
});
```

- [ ] **Step 2: Run** `npx jest src/domain/dates.test.ts` → FAIL (module not found)
- [ ] **Step 3: Implement** in `src/domain/dates.ts`. Do date arithmetic on `Date.UTC(y, m-1, d)` values only; `todayInSingapore` adds 8 h to `now` and reads the UTC fields.
- [ ] **Step 4: Run** `npx jest src/domain/dates.test.ts` → PASS
- [ ] **Step 5: Commit** `git commit -m "feat(domain): Singapore date helpers"`

---

### Task 3: Profile type and countdowns

**Files:**
- Create: `src/domain/profile.ts`, `src/domain/countdowns/countdowns.ts`, `src/domain/countdowns/countdowns.test.ts`

**Interfaces:**
- Consumes: `LocalDate`, `daysBetween`, `ageOn` (Task 2)
- Produces:
  ```ts
  // profile.ts
  export type ServiceStatus = 'nsf' | 'nsman';
  export type Service = 'saf' | 'spf' | 'scdf';
  export type Profile = { dob: LocalDate; status: ServiceStatus; service: Service; eliteVocation: boolean; ordRodDate: LocalDate | null; ipptDate: LocalDate | null };
  export function scoringAge(profile: Profile, today: LocalDate): number; // ageOn(dob, ipptDate ?? today)
  // countdowns.ts
  export type Countdown = { kind: 'not_set' } | { kind: 'upcoming'; days: number } | { kind: 'today' } | { kind: 'passed'; daysAgo: number };
  export function countdownTo(target: LocalDate | null, today: LocalDate): Countdown;
  export function ordRodLabel(service: Service): 'ORD' | 'ROD';
  export function homeCountdowns(profile: Profile, today: LocalDate): { ordRod: { label: 'ORD' | 'ROD'; countdown: Countdown } | null; ippt: Countdown };
  ```

- [ ] **Step 1: Write the failing tests**

```ts
const nsf: Profile = { dob: '2005-03-01', status: 'nsf', service: 'saf', eliteVocation: false, ordRodDate: '2026-12-01', ipptDate: '2026-11-15' };
test('countdownTo', () => {
  expect(countdownTo('2026-12-01', '2026-10-21')).toEqual({ kind: 'upcoming', days: 41 });
  expect(countdownTo('2026-10-21', '2026-10-21')).toEqual({ kind: 'today' });
  expect(countdownTo('2026-10-01', '2026-10-21')).toEqual({ kind: 'passed', daysAgo: 20 });
  expect(countdownTo(null, '2026-10-21')).toEqual({ kind: 'not_set' });
});
test('ROD for SPF and SCDF', () => {
  expect(ordRodLabel('saf')).toBe('ORD');
  expect(ordRodLabel('spf')).toBe('ROD');
  expect(ordRodLabel('scdf')).toBe('ROD');
});
test('NSmen get no ORD countdown', () => {
  expect(homeCountdowns({ ...nsf, status: 'nsman', ordRodDate: null }, '2026-10-21').ordRod).toBeNull();
  expect(homeCountdowns(nsf, '2026-10-21').ordRod).toEqual({ label: 'ORD', countdown: { kind: 'upcoming', days: 41 } });
});
test('scoringAge uses the IPPT date when set', () => {
  expect(scoringAge({ ...nsf, dob: '2004-11-01' }, '2026-10-21')).toBe(22);
  expect(scoringAge({ ...nsf, dob: '2004-11-01', ipptDate: null }, '2026-10-21')).toBe(21);
});
```

- [ ] **Step 2: Run** `npx jest src/domain/countdowns` → FAIL
- [ ] **Step 3: Implement** `profile.ts` and `countdowns.ts` to the signatures above. Add a comment on `scoringAge`: "Age rule unverified — spec section 13."
- [ ] **Step 4: Run** `npx jest src/domain/countdowns` → PASS
- [ ] **Step 5: Commit** `git commit -m "feat(domain): profile type and countdowns"`

---

### Task 4: Scoring table format and station points

**Files:**
- Create: `src/domain/scoring/table.ts`, `src/domain/scoring/table.test.ts`, `src/domain/scoring/__fixtures__/miniTable.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Station = 'pushup' | 'situp' | 'run';
  export type AgeBand = { id: string; minAge: number; maxAge: number };
  export type RepRow = { minReps: number; points: number };    // rows ordered best first
  export type RunRow = { maxSeconds: number; points: number }; // rows ordered best first
  export type ScoringTable = { id: string; source: string; retrievedOn: string; ageBands: AgeBand[];
    pushup: Record<string, RepRow[]>; situp: Record<string, RepRow[]>; run: Record<string, RunRow[]> };
  export const MAX_POINTS: Record<Station, number>; // { pushup: 25, situp: 25, run: 50 }
  export function validateTable(t: ScoringTable): string[]; // [] when valid
  export function bandForAge(t: ScoringTable, age: number): AgeBand | null;
  export function stationPoints(t: ScoringTable, bandId: string, station: Station, result: number): number;
  ```
  `stationPoints`: reps → points of the first row with `result >= minReps`, else 0; run (seconds) → points of the first row with `result <= maxSeconds`, else 0.
  `validateTable` errors when: bands overlap or leave gaps between them; any band lacks a station; rows aren't strictly better-to-worse (reps: `minReps` and `points` strictly decreasing; run: `maxSeconds` strictly increasing, `points` strictly decreasing); first row ≠ `MAX_POINTS`; any points < 1.

- [ ] **Step 1: Write the fixture** `miniTable` with bands `lt22` (0–21) and `22-24` (22–24). For both bands and for both `pushup` and `situp`, rows: `60→25, 50→21, 40→17, 30→13, 20→8, 10→2, 5→1`. Run rows for both bands: `510→50, 600→44, 700→35, 800→20, 900→6, 1000→1`. `source: 'test fixture'`.

- [ ] **Step 2: Write the failing tests**

```ts
test('mini table is valid', () => expect(validateTable(miniTable)).toEqual([]));
test('validateTable catches a non-max top row and an overlapping band', () => {
  const bad = { ...miniTable, ageBands: [{ id: 'lt22', minAge: 0, maxAge: 22 }, { id: '22-24', minAge: 22, maxAge: 24 }],
    pushup: { ...miniTable.pushup, lt22: miniTable.pushup.lt22.slice(1) } };
  expect(validateTable(bad).length).toBeGreaterThanOrEqual(2);
});
test('bandForAge', () => {
  expect(bandForAge(miniTable, 21)?.id).toBe('lt22');
  expect(bandForAge(miniTable, 22)?.id).toBe('22-24');
  expect(bandForAge(miniTable, 25)).toBeNull();
});
test('rep points, including above best and below worst', () => {
  const p = (r: number) => stationPoints(miniTable, 'lt22', 'pushup', r);
  expect([p(75), p(60), p(59), p(50), p(5), p(4), p(0)]).toEqual([25, 25, 21, 21, 1, 0, 0]);
});
test('run points, including faster than best and slower than worst', () => {
  const p = (s: number) => stationPoints(miniTable, 'lt22', 'run', s);
  expect([p(480), p(510), p(511), p(1000), p(1001)]).toEqual([50, 50, 44, 1, 0]);
});
```

- [ ] **Step 3: Run** `npx jest src/domain/scoring/table.test.ts` → FAIL
- [ ] **Step 4: Implement** `table.ts`
- [ ] **Step 5: Run** → PASS
- [ ] **Step 6: Commit** `git commit -m "feat(domain): scoring table format, validation and station points"`

---

### Task 5: Awards and total score

**Files:**
- Create: `src/domain/scoring/awards.ts`, `src/domain/scoring/awardRules.json`, `src/domain/scoring/awards.test.ts`

**Interfaces:**
- Consumes: Task 4 types and functions; `ServiceStatus` (Task 3)
- Produces:
  ```ts
  export type Award = 'fail' | 'pass' | 'pass_incentive' | 'silver' | 'gold';
  export type AwardRules = { nsmanPass: number; nsfPass: number; passWithIncentive: number; silver: number; gold: number; eliteSilver: number; eliteGold: number };
  export const awardRules: AwardRules; // loaded from awardRules.json
  export type Who = { status: ServiceStatus; eliteVocation: boolean };
  export type StationResults = { pushup: number | null; situp: number | null; run: number | null }; // reps, reps, seconds
  export type ScoreResult = { points: Record<Station, number | null>; total: number | null; award: Award | null };
  export function awardFor(points: Record<Station, number>, who: Who, rules: AwardRules): Award;
  export function scoreIppt(results: StationResults, age: number, table: ScoringTable, who: Who, rules: AwardRules): ScoreResult | { error: 'no_age_band' };
  ```
  `awardRules.json`: `{ "nsmanPass": 51, "passWithIncentive": 61, "silver": 75, "gold": 85, "eliteGold": 90, "nsfPass": 61, "eliteSilver": 80, "unverified": ["nsfPass", "eliteSilver"], "source": "ns.gov.sg IPPT stations and scoring system, retrieved 2026-10-21" }`.
  `awardFor`: any station at 0 → `fail`. Otherwise, with total `T`: `T ≥ (elite ? eliteGold : gold)` → gold; `T ≥ (elite ? eliteSilver : silver)` → silver; `T ≥ passWithIncentive` → pass_incentive; `T ≥ (nsf ? nsfPass : nsmanPass)` → pass; else fail. (So NSFs never get plain `pass`.)
  `scoreIppt`: total and award are `null` when any result is `null`; per-station points are still filled for the results present.

- [ ] **Step 1: Write the failing tests**

```ts
const nsman: Who = { status: 'nsman', eliteVocation: false };
const s = (pushup: number | null, situp: number | null, run: number | null) =>
  scoreIppt({ pushup, situp, run }, 21, miniTable, nsman, awardRules);
test('totals and awards for NSmen', () => {
  expect(s(60, 60, 600)).toMatchObject({ total: 94, award: 'gold' });
  expect(s(50, 40, 600)).toMatchObject({ total: 82, award: 'silver' });
  expect(s(40, 30, 700)).toMatchObject({ total: 65, award: 'pass_incentive' });
  expect(s(40, 20, 700)).toMatchObject({ total: 60, award: 'pass' });
  expect(s(30, 30, 800)).toMatchObject({ total: 46, award: 'fail' });
});
test('a zero station fails regardless of total', () => {
  expect(s(4, 60, 510)).toMatchObject({ total: 75, award: 'fail' });
});
test('NSF needs 61 to pass; elite needs 90 for gold', () => {
  expect(scoreIppt({ pushup: 40, situp: 20, run: 700 }, 21, miniTable, { status: 'nsf', eliteVocation: false }, awardRules)).toMatchObject({ award: 'fail' });
  expect(scoreIppt({ pushup: 60, situp: 50, run: 600 }, 21, miniTable, { status: 'nsman', eliteVocation: true }, awardRules)).toMatchObject({ total: 90, award: 'gold' });
  expect(scoreIppt({ pushup: 60, situp: 40, run: 600 }, 21, miniTable, { status: 'nsman', eliteVocation: true }, awardRules)).toMatchObject({ total: 86, award: 'silver' });
});
test('missing result gives station points but no total', () => {
  expect(s(50, 40, null)).toEqual({ points: { pushup: 21, situp: 17, run: null }, total: null, award: null });
});
test('age outside the table', () => {
  expect(scoreIppt({ pushup: 50, situp: 40, run: 600 }, 61, miniTable, nsman, awardRules)).toEqual({ error: 'no_age_band' });
});
```

- [ ] **Step 2: Run** `npx jest src/domain/scoring/awards.test.ts` → FAIL
- [ ] **Step 3: Implement** `awards.ts` and `awardRules.json`
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** `git commit -m "feat(domain): award rules and total IPPT score"`

---

### Task 6: Official scoring table (needs human input)

**Prerequisite:** the official male IPPT scoring tables for all age bands (push-up, sit-up, 2.4km run), from MINDEF/ns.gov.sg. The executor does not invent or copy these from unofficial calculators. If the data isn't available, stop at Step 1 and report back.

**Files:**
- Create: `src/domain/scoring/tables/saf-male.json`, `src/domain/scoring/tables/index.ts`, `src/domain/scoring/tables/tables.test.ts`

**Interfaces:**
- Consumes: `ScoringTable`, `validateTable`, `stationPoints`, `bandForAge` (Task 4)
- Produces: `export const currentTable: ScoringTable` (from `saf-male.json`), with `source` naming the official document and `retrievedOn` the date it was transcribed.

- [ ] **Step 1: Transcribe** the official tables into `saf-male.json` in the Task 4 format, one band per official age group.
- [ ] **Step 2: Write the tests**

```ts
test('shipped table is valid', () => expect(validateTable(currentTable)).toEqual([]));
test('bands cover ages 16 to 60', () => {
  for (let age = 16; age <= 60; age++) expect(bandForAge(currentTable, age)).not.toBeNull();
});
test('spot checks against the official document', () => {
  // Add at least six checks, two per station, across the youngest, a middle and the oldest band,
  // each copied from the official document: expect(stationPoints(currentTable, '<band>', '<station>', <result>)).toBe(<points>);
});
```

The spot-check values come from the official document in Step 1, so this is the one test whose literals the executor fills in.

- [ ] **Step 3: Run** `npx jest src/domain/scoring/tables` → PASS (fix the JSON, not the tests, if it fails)
- [ ] **Step 4: Commit** `git commit -m "feat(domain): official IPPT scoring table"`

---

### Task 7: Manual entry validation

**Files:**
- Create: `src/domain/entries/validate.ts`, `src/domain/entries/validate.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type Parsed<T> = { ok: true; value: T } | { ok: false; error: 'format' | 'range' };
  export function validateReps(input: string): Parsed<number>;   // integer 0–100
  export function parseRunTime(input: string): Parsed<number>;   // 'm:ss' or 'mm:ss' → seconds, 420–1500
  export function formatRunTime(seconds: number): string;        // 585 → '9:45'
  ```

- [ ] **Step 1: Write the failing tests**

```ts
test('validateReps', () => {
  expect(validateReps('0')).toEqual({ ok: true, value: 0 });
  expect(validateReps(' 100 ')).toEqual({ ok: true, value: 100 });
  expect(validateReps('101')).toEqual({ ok: false, error: 'range' });
  for (const bad of ['-1', '12.5', 'abc', '']) expect(validateReps(bad)).toEqual({ ok: false, error: 'format' });
});
test('parseRunTime', () => {
  expect(parseRunTime('9:45')).toEqual({ ok: true, value: 585 });
  expect(parseRunTime('09:45')).toEqual({ ok: true, value: 585 });
  expect(parseRunTime('7:00')).toEqual({ ok: true, value: 420 });
  expect(parseRunTime('25:00')).toEqual({ ok: true, value: 1500 });
  expect(parseRunTime('6:59')).toEqual({ ok: false, error: 'range' });
  expect(parseRunTime('25:01')).toEqual({ ok: false, error: 'range' });
  for (const bad of ['9:75', '9.45', '945', '', '9:5']) expect(parseRunTime(bad)).toEqual({ ok: false, error: 'format' });
});
test('formatRunTime', () => expect(formatRunTime(585)).toBe('9:45'));
```

- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** `git commit -m "feat(domain): manual entry validation"`

---

### Task 8: Goals

**Files:**
- Create: `src/domain/goals/goals.ts`, `src/domain/goals/goals.test.ts`

**Interfaces:**
- Consumes: Task 4 and Task 5 types and functions
- Produces:
  ```ts
  export type GoalTarget = { kind: 'award'; award: Exclude<Award, 'fail'> } | { kind: 'score'; points: number };
  export type ImprovementStep = { target: number; gain: number; pointsAfter: number; improvementPct: number };
  export type StationGap = { station: Station; current: number | null; currentPoints: number | null; next: ImprovementStep[] };
  export function targetPoints(target: GoalTarget, who: Who, rules: AwardRules): number;
  export function stationGap(table: ScoringTable, bandId: string, station: Station, current: number | null): StationGap;
  export function rankCheapest(gaps: StationGap[]): Station[];
  export type GoalProgress = { targetPoints: number; total: number | null; pointsNeeded: number | null; met: boolean; stations: StationGap[]; cheapest: Station[] };
  export function goalProgress(target: GoalTarget, results: StationResults, age: number, table: ScoringTable, who: Who, rules: AwardRules): GoalProgress | { error: 'no_age_band' };
  ```
  - `targetPoints`: award → its threshold for `who` (pass uses `nsfPass` or `nsmanPass`; silver/gold use elite thresholds when `eliteVocation`); score → `points`.
  - `stationGap.next`: for N in 1, 3, 5, the easiest row with `points ≥ currentPoints + N`. `gain` is extra reps, or seconds faster for the run. `improvementPct = round1(gain / max(current, 1) × 100)`. Duplicate rows are dropped, so `next` may hold fewer than three steps. `next` is `[]` when there's no result or the station is already at maximum.
  - `rankCheapest`: stations with at least one step, ordered by `next[0].improvementPct / (next[0].pointsAfter − currentPoints)` ascending.
  - `goalProgress`: `pointsNeeded = max(0, targetPoints − total)` and `met = total ≥ targetPoints` **and** every station ≥ 1 point; both use `total`, which is `null` when any result is missing (then `pointsNeeded` is `null`, `met` false).

- [ ] **Step 1: Write the failing tests**

```ts
test('stationGap steps for push-ups, deduplicated', () => {
  expect(stationGap(miniTable, 'lt22', 'pushup', 45)).toEqual({ station: 'pushup', current: 45, currentPoints: 17, next: [
    { target: 50, gain: 5, pointsAfter: 21, improvementPct: 11.1 },
    { target: 60, gain: 15, pointsAfter: 25, improvementPct: 33.3 },
  ] });
});
test('stationGap for the run counts seconds faster', () => {
  expect(stationGap(miniTable, 'lt22', 'run', 650).next).toEqual([{ target: 600, gain: 50, pointsAfter: 44, improvementPct: 7.7 }]);
});
test('no steps at max or with no result', () => {
  expect(stationGap(miniTable, 'lt22', 'pushup', 60).next).toEqual([]);
  expect(stationGap(miniTable, 'lt22', 'situp', null)).toEqual({ station: 'situp', current: null, currentPoints: null, next: [] });
});
test('cheapest points ranks by % per point', () => {
  const gaps = [stationGap(miniTable, 'lt22', 'pushup', 45), stationGap(miniTable, 'lt22', 'run', 650)];
  expect(rankCheapest(gaps)).toEqual(['run', 'pushup']);
});
test('targetPoints', () => {
  expect(targetPoints({ kind: 'award', award: 'gold' }, { status: 'nsman', eliteVocation: true }, awardRules)).toBe(90);
  expect(targetPoints({ kind: 'award', award: 'pass' }, { status: 'nsf', eliteVocation: false }, awardRules)).toBe(61);
  expect(targetPoints({ kind: 'score', points: 70 }, { status: 'nsman', eliteVocation: false }, awardRules)).toBe(70);
});
test('goalProgress with all results and with one missing', () => {
  const who: Who = { status: 'nsman', eliteVocation: false };
  expect(goalProgress({ kind: 'award', award: 'gold' }, { pushup: 45, situp: 40, run: 650 }, 21, miniTable, who, awardRules))
    .toMatchObject({ targetPoints: 85, total: 69, pointsNeeded: 16, met: false });
  expect(goalProgress({ kind: 'award', award: 'gold' }, { pushup: 45, situp: null, run: 650 }, 21, miniTable, who, awardRules))
    .toMatchObject({ total: null, pointsNeeded: null, met: false });
});
```

- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** `git commit -m "feat(domain): goal gaps and cheapest points"`

---

### Task 9: Database and migrations

**Files:**
- Create: `src/adapters/storage/db.ts`, `src/adapters/storage/migrations.ts`, `src/adapters/storage/testDb.ts`, `src/adapters/storage/expoDb.ts`, `src/adapters/storage/db.test.ts`

**Interfaces:**
- Produces:
  ```ts
  export type SqlParam = string | number | null;
  export interface Db { exec(sql: string): void; run(sql: string, params?: SqlParam[]): { lastInsertRowId: number };
    all<T>(sql: string, params?: SqlParam[]): T[]; get<T>(sql: string, params?: SqlParam[]): T | undefined; }
  export function migrate(db: Db): void;          // runs pending migrations; reads/writes meta.schema_version
  export const migrations: string[];              // index i → schema version i+1
  export function openTestDb(): Db;               // better-sqlite3 ':memory:'
  export function openExpoDb(name?: string): Db;  // expo-sqlite openDatabaseSync, default 'ippt.db'
  ```
  Migration 1 (spec section 9; the `reps` table comes in Plan 3):
  - `meta(key TEXT PRIMARY KEY, value TEXT NOT NULL)`
  - `profile(id INTEGER PRIMARY KEY CHECK (id = 1), dob TEXT NOT NULL, status TEXT NOT NULL, service TEXT NOT NULL, elite_vocation INTEGER NOT NULL, ord_rod_date TEXT, ippt_date TEXT)`
  - `goal(id INTEGER PRIMARY KEY CHECK (id = 1), target_kind TEXT NOT NULL, target_value TEXT NOT NULL, created_at TEXT NOT NULL)`
  - `sessions(id INTEGER PRIMARY KEY AUTOINCREMENT, station TEXT NOT NULL, source TEXT NOT NULL, started_at TEXT NOT NULL, valid_count INTEGER, no_count_form INTEGER, no_count_unclear INTEGER, run_time_s INTEGER, run_distance_m INTEGER, adjusted INTEGER NOT NULL DEFAULT 0, external_id TEXT, rule_config_version TEXT, model_version TEXT)` with index on `(station, started_at)`.

- [ ] **Step 1: Write the failing tests**

```ts
test('migrate creates schema version 1 and is idempotent', () => {
  const db = openTestDb();
  migrate(db); migrate(db);
  expect(db.get<{ value: string }>("SELECT value FROM meta WHERE key = 'schema_version'")?.value).toBe('1');
  expect(db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").map(r => r.name))
    .toEqual(expect.arrayContaining(['goal', 'meta', 'profile', 'sessions']));
});
```

- [ ] **Step 2: Run** `npx jest src/adapters/storage/db.test.ts` → FAIL
- [ ] **Step 3: Implement** `db.ts`, `migrations.ts`, `testDb.ts`. Each migration runs inside one transaction together with its `schema_version` update. `expoDb.ts` maps the interface to `execSync`, `runSync`, `getAllSync`, `getFirstSync`; it isn't unit-tested (checked on the device in Task 14).
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** `git commit -m "feat(storage): Db interface and migrations"`

---

### Task 10: Repositories

**Files:**
- Create: `src/adapters/storage/repositories.ts`, `src/adapters/storage/repositories.test.ts`

**Interfaces:**
- Consumes: `Db`, `migrate`, `openTestDb` (Task 9); `Profile` (Task 3); `GoalTarget` (Task 8); `Station`, `StationResults` (Tasks 4–5)
- Produces:
  ```ts
  export type SessionSource = 'camera_test' | 'camera_practice' | 'manual' | 'health_connect';
  export type Session = { id: number; station: Station; source: SessionSource; startedAt: string /* ISO 8601 */;
    validCount: number | null; noCountForm: number | null; noCountUnclear: number | null; runTimeS: number | null;
    runDistanceM: number | null; adjusted: boolean; externalId: string | null; ruleConfigVersion: string | null; modelVersion: string | null };
  export type NewSession = Omit<Session, 'id'>;
  export function profileRepo(db: Db): { get(): Profile | null; save(p: Profile): void };
  export function goalRepo(db: Db): { get(): GoalTarget | null; save(t: GoalTarget, createdAt: string): void; clear(): void };
  export function sessionRepo(db: Db): { add(s: NewSession): number; list(limit?: number): Session[]; remove(id: number): void; latestResults(): StationResults };
  export type Repositories = { profile: ReturnType<typeof profileRepo>; goal: ReturnType<typeof goalRepo>; sessions: ReturnType<typeof sessionRepo> };
  export function createRepositories(db: Db): Repositories;
  ```
  `list` is newest first. `latestResults` uses only sources `camera_test`, `manual`, `health_connect`; the value is `validCount` for push-ups and sit-ups and `runTimeS` for the run.

- [ ] **Step 1: Write the failing tests**

```ts
const manual = (station: Station, startedAt: string, v: number): NewSession => ({ station, source: 'manual', startedAt,
  validCount: station === 'run' ? null : v, runTimeS: station === 'run' ? v : null, noCountForm: null, noCountUnclear: null,
  runDistanceM: null, adjusted: false, externalId: null, ruleConfigVersion: null, modelVersion: null });
let repos: Repositories;
beforeEach(() => { const db = openTestDb(); migrate(db); repos = createRepositories(db); });
test('profile round trip', () => {
  expect(repos.profile.get()).toBeNull();
  const p: Profile = { dob: '2004-05-01', status: 'nsf', service: 'spf', eliteVocation: true, ordRodDate: '2026-12-01', ipptDate: null };
  repos.profile.save(p); repos.profile.save({ ...p, ipptDate: '2026-11-15' });
  expect(repos.profile.get()).toEqual({ ...p, ipptDate: '2026-11-15' });
});
test('goal round trip for both kinds', () => {
  repos.goal.save({ kind: 'award', award: 'silver' }, '2026-10-21T02:00:00Z');
  expect(repos.goal.get()).toEqual({ kind: 'award', award: 'silver' });
  repos.goal.save({ kind: 'score', points: 70 }, '2026-10-21T02:00:00Z');
  expect(repos.goal.get()).toEqual({ kind: 'score', points: 70 });
});
test('latestResults ignores practice and falls back after delete', () => {
  repos.sessions.add(manual('pushup', '2026-10-01T10:00:00Z', 30));
  const newer = repos.sessions.add(manual('pushup', '2026-10-10T10:00:00Z', 35));
  repos.sessions.add({ ...manual('pushup', '2026-10-15T10:00:00Z', 50), source: 'camera_practice' });
  repos.sessions.add(manual('run', '2026-10-05T10:00:00Z', 660));
  expect(repos.sessions.latestResults()).toEqual({ pushup: 35, situp: null, run: 660 });
  repos.sessions.remove(newer);
  expect(repos.sessions.latestResults().pushup).toBe(30);
  expect(repos.sessions.list().map(s => s.startedAt)[0]).toBe('2026-10-15T10:00:00Z');
});
```

- [ ] **Step 2: Run** → FAIL
- [ ] **Step 3: Implement** (`goal.target_value` stores the award name or the points as text; booleans as 0/1)
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** `git commit -m "feat(storage): profile, goal and session repositories"`

---

### Task 11: App shell, onboarding and settings

**Files:**
- Create: `src/app-state/bootstrap.ts`, `src/app-state/clock.ts`, `src/app-state/RepositoriesContext.tsx`, `src/app-state/useAppData.ts`, `src/app-state/testing.tsx`, `src/ui/ProfileForm.tsx`, `src/ui/PracticeEstimateLabel.tsx`, `app/_layout.tsx`, `app/onboarding/index.tsx`, `app/onboarding/profile.tsx`, `app/(tabs)/_layout.tsx`, `app/(tabs)/settings.tsx`, `app/__tests__/onboarding.test.tsx`
- Test: `app/__tests__/onboarding.test.tsx`

**Interfaces:**
- Consumes: `createRepositories`, `migrate`, `openExpoDb`, `openTestDb` (Tasks 9–10); `todayInSingapore`, `parseLocalDate` (Task 2); `bandForAge`, `currentTable` (Tasks 4, 6); `scoringAge` (Task 3)
- Produces:
  ```ts
  // bootstrap.ts
  export function createAppRepositories(): Repositories;  // openExpoDb → migrate → createRepositories
  // clock.ts
  export function now(): Date;
  // RepositoriesContext.tsx
  export function RepositoriesProvider(props: { repos: Repositories; children: React.ReactNode }): JSX.Element;
  export function useRepositories(): Repositories;
  // useAppData.ts — re-reads on screen focus
  export function useAppData(): { today: LocalDate; profile: Profile | null; goal: GoalTarget | null; latest: StationResults; sessions: Session[]; refresh(): void };
  // testing.tsx — mocks bootstrap and clock for screen tests
  export function setupTestApp(opts?: { now?: string; profile?: Profile; sessions?: NewSession[]; goal?: GoalTarget }): Repositories;
  // ProfileForm.tsx
  export type ProfileFormValues = { dob: string; status: ServiceStatus; service: Service; eliteVocation: boolean; ordRodDate: string; ipptDate: string }; // dates as typed text, '' when blank
  export function validateProfileForm(v: ProfileFormValues, today: LocalDate): Record<string, string>; // field → message; {} when valid
  export function ProfileForm(props: { initial?: Profile; submitLabel: string; onSubmit(p: Profile): void }): JSX.Element;
  ```
  Form rules: date of birth must be a valid date not after today, and the age (via `scoringAge`) must map to a band in `currentTable`, else "We can't score your age group yet." NSFs must enter an ORD/ROD date (label follows the service: ORD for SAF, ROD otherwise). IPPT date is optional but must be valid if entered. Dates are typed as `YYYY-MM-DD`.

  `app/_layout.tsx` redirects to `/onboarding` when `profile` is null. The onboarding disclaimer screen shows the two Global Constraints sentences and an "I understand" button leading to `/onboarding/profile`; saving the profile goes to `/(tabs)`. Settings shows the same `ProfileForm` filled with the saved profile.

- [ ] **Step 1: Write the failing screen tests** (with `renderRouter` from `expo-router/testing-library` and `setupTestApp({ now: '2026-10-21T02:00:00Z' })`)

```ts
test('first launch shows both disclaimers, then the profile form', async () => {
  setupTestApp({ now: '2026-10-21T02:00:00Z' });
  renderRouter('app');
  expect(await screen.findByText('Not affiliated with MINDEF/SAF/SPF/SCDF; scores are practice estimates.')).toBeTruthy();
  expect(screen.getByText('Consult a doctor if you have medical conditions.')).toBeTruthy();
  fireEvent.press(screen.getByText('I understand'));
  expect(await screen.findByLabelText('Date of birth')).toBeTruthy();
});
test('profile form rejects an impossible date and a missing ROD date', async () => {
  setupTestApp({ now: '2026-10-21T02:00:00Z' });
  renderRouter('app', { initialUrl: '/onboarding/profile' });
  fireEvent.changeText(await screen.findByLabelText('Date of birth'), '2005-02-30');
  fireEvent.press(screen.getByText('SPF'));
  fireEvent.press(screen.getByText('Save'));
  expect(await screen.findByText('Enter a real date as YYYY-MM-DD.')).toBeTruthy();
  expect(screen.getByText('Enter your ROD date.')).toBeTruthy();
});
test('a saved profile skips onboarding', async () => {
  setupTestApp({ now: '2026-10-21T02:00:00Z', profile: { dob: '2005-03-01', status: 'nsf', service: 'saf', eliteVocation: false, ordRodDate: '2026-12-01', ipptDate: null } });
  renderRouter('app');
  expect(await screen.findByText('Home')).toBeTruthy();
});
test('validateProfileForm refuses a future date of birth and an age outside the table', () => {
  // future dob → dob error; dob giving age 61 on 2026-10-21 → "We can't score your age group yet."
});
```

The last test's two cases call `validateProfileForm` directly with `today = '2026-10-21'`: `dob: '2027-01-01'` must give a `dob` error, and `dob: '1965-01-01'` must give "We can't score your age group yet."

- [ ] **Step 2: Run** `npx jest app/__tests__/onboarding.test.tsx` → FAIL
- [ ] **Step 3: Implement** the files above. Tabs: Home, Log, Goals, Settings (Log and Goals can be placeholders until Tasks 12–13). `PracticeEstimateLabel` renders the text "Practice estimate".
- [ ] **Step 4: Run** → PASS; also run `npm test` and `npm run lint` → all PASS
- [ ] **Step 5: Commit** `git commit -m "feat(app): onboarding, profile settings and app shell"`

---

### Task 12: Log and manual entry

**Files:**
- Create: `app/log/new.tsx`, `app/__tests__/log.test.tsx`
- Modify: `app/(tabs)/log.tsx`

**Interfaces:**
- Consumes: `validateReps`, `parseRunTime`, `formatRunTime` (Task 7); `useAppData`, `useRepositories` (Task 11); `sessionRepo` (Task 10)

Log tab: "Add result" button opening `/log/new`, then sessions newest first. Each row shows the station name, the value (reps, or `m:ss`), a source label (Manual / Camera test / Camera practice / Imported) and the date in Singapore time, plus a "Delete" button that asks "Delete this result?" before removing.

New entry screen: station choice (Push-ups, Sit-ups, 2.4km run), one input (labelled "Reps" or "Time (m:ss)"), Save. Errors: reps format → "Enter a whole number of reps."; reps range → "Reps must be between 0 and 100."; run format → "Enter the time as m:ss, e.g. 9:45."; run range → "Time must be between 7:00 and 25:00." Saved as source `manual`, `startedAt` = `now().toISOString()`.

- [ ] **Step 1: Write the failing tests**

```ts
test('rejects a bad run time and saves a good one', async () => {
  setupTestApp({ now: '2026-10-21T02:00:00Z', profile: P });
  renderRouter('app', { initialUrl: '/log/new' });
  fireEvent.press(await screen.findByText('2.4km run'));
  fireEvent.changeText(screen.getByLabelText('Time (m:ss)'), '9.45');
  fireEvent.press(screen.getByText('Save'));
  expect(await screen.findByText('Enter the time as m:ss, e.g. 9:45.')).toBeTruthy();
  fireEvent.changeText(screen.getByLabelText('Time (m:ss)'), '9:45');
  fireEvent.press(screen.getByText('Save'));
  expect(await screen.findByText('9:45')).toBeTruthy();   // back on the Log list
});
test('rejects 101 reps', async () => { /* Reps '101' → 'Reps must be between 0 and 100.' and nothing saved */ });
test('deleting the newest push-up result falls back to the previous one on Home', async () => {
  // seed manual push-ups 30 (Oct 1) and 35 (Oct 10); delete the 35 row and confirm;
  // navigate to Home; expect the push-up line to show 30
});
```

The second and third tests are written out in full in the same style as the first: `P` is the NSF profile from Task 11's tests.

- [ ] **Step 2: Run** `npx jest app/__tests__/log.test.tsx` → FAIL
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run** → PASS
- [ ] **Step 5: Commit** `git commit -m "feat(app): manual result entry and history"`

Note: the third test depends on the Home push-up line from Task 13. If running tasks in order, mark it `test.todo` here and enable it in Task 13.

---

### Task 13: Home and Goals

**Files:**
- Modify: `app/(tabs)/index.tsx`, `app/(tabs)/goals.tsx`
- Create: `app/__tests__/home.test.tsx`, `app/__tests__/goals.test.tsx`

**Interfaces:**
- Consumes: `homeCountdowns`, `ordRodLabel` (Task 3); `scoreIppt`, `awardRules` (Task 5); `currentTable` (Task 6); `goalProgress`, `rankCheapest` (Task 8); `useAppData`, `useRepositories` (Task 11)

**Home**, top to bottom:
- **ORD/ROD card** (NSF only). Upcoming: "{n} days to ORD" (or ROD). Today: "ORD today!". Passed: "Congratulations on your ORD!" with a "Switch to NSman" button that saves the profile as `nsman` with `ordRodDate: null`.
- **IPPT card.** Not set: "Set your IPPT date" (links to Settings). Upcoming: "{n} days to IPPT". Today: "IPPT today. Good luck!". Passed: "Your IPPT date has passed. Log your result and set your next date." with "Log result" (→ `/log/new`) and "Set next date" (→ Settings).
- **Score card.** One line per station: label, latest value, points ("—" if no result). If all three are present: "Total {t}/100", the award name (Fail, Pass, Pass with Incentive, Silver, Gold) and `PracticeEstimateLabel`. Otherwise: "Log {missing stations} to see your total." If `scoreIppt` returns `no_age_band`: "We can't score your age group yet."

**Goals**:
- Target picker: chips Pass, Pass with Incentive, Silver, Gold, plus "Custom score" (input 1–100), saved via `goalRepo.save`.
- With a goal: "Target {p} points", the IPPT countdown as the deadline, and either "{n} points to go" or "Target met" (or "Log all three stations to see your gap" when the total is null).
- One row per station showing current points and its steps, e.g. "+5 reps → 21 pts (11.1%)" or "−50 s → 44 pts (7.7%)". The first station in `cheapest` is marked "Cheapest points".
- No goal: "Pick a target to see your gap."

- [ ] **Step 1: Write the failing tests**

Home (each test seeds via `setupTestApp`; fixed now `2026-10-21T02:00:00Z`, i.e. 21 Oct in Singapore):
```ts
test('NSF sees ORD and IPPT countdowns', async () => { /* ordRodDate 2026-12-01, ipptDate 2026-11-15 → '41 days to ORD', '25 days to IPPT' */ });
test('SCDF NSF sees ROD', async () => { /* service scdf → '41 days to ROD' */ });
test('ORD passed offers switch to NSman', async () => { /* ordRodDate 2026-10-01 → 'Congratulations on your ORD!'; press 'Switch to NSman' → profile.get().status === 'nsman' and the ORD card is gone */ });
test('IPPT passed prompts to log and set next date', async () => { /* ipptDate 2026-10-20 → prompt text and both buttons */ });
test('missing run shows no total', async () => { /* push-ups and sit-ups logged only → 'Log 2.4km run to see your total.' and no 'Total' text */ });
test('full results show total, award and practice label', async () => { /* using currentTable; assert 'Total ' text, an award name and 'Practice estimate' are shown */ });
```
Goals:
```ts
test('no goal prompts to pick one', async () => { /* 'Pick a target to see your gap.' */ });
test('picking Gold shows target and cheapest station', async () => { /* nsman, all three results; press 'Gold' → 'Target 85 points' and 'Cheapest points' visible; goal.get() equals { kind: 'award', award: 'gold' } */ });
test('custom score outside 1–100 is rejected', async () => { /* '0' and '101' → 'Enter a score from 1 to 100.' */ });
```
Write each test body in full, in the style of Task 11's tests; the comments above give the seed data and the exact assertions. Where an assertion depends on `currentTable` values, assert presence of text, not specific points.

- [ ] **Step 2: Run** `npx jest app/__tests__/home.test.tsx app/__tests__/goals.test.tsx` → FAIL
- [ ] **Step 3: Implement** Home and Goals. Enable Task 12's deferred test if it was marked `test.todo`.
- [ ] **Step 4: Run** `npm test` and `npm run lint` → all PASS
- [ ] **Step 5: Commit** `git commit -m "feat(app): home countdowns, score card and goals"`

---

### Task 14: Development build on a real phone (manual)

**Files:** none (fixes found here get their own commits).

This needs the user's computer with the Android SDK and an Android phone (8.0+) with USB debugging; it can't run in a cloud workspace.

- [ ] **Step 1: Build and install** — `npx expo run:android` → app installs and opens on the phone.
- [ ] **Step 2: Walk the checklist**
  - First launch shows both disclaimers; profile saves; relaunch skips onboarding (SQLite persists).
  - Enter results for all three stations; Home shows total, award, "Practice estimate".
  - Delete the newest result; Home falls back to the previous one.
  - Set the phone's time zone to London; Home countdown day counts don't change.
  - Pick a goal; Goals shows steps and "Cheapest points".
  - Confirm in `android/app/build.gradle` (after prebuild) or the built APK that `minSdkVersion` is 26.
- [ ] **Step 3: Record results** in `docs/superpowers/plans/2026-10-21-foundation-checklist-results.md` (pass/fail per line, phone model, Android version) and commit.
