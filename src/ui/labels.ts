import type { Session, SessionSource } from '@/adapters/storage/repositories';
import { formatLocalDate, LocalDate, todayInSingapore } from '@/domain/dates';
import { formatRunTime } from '@/domain/entries/validate';
import type { CheckId, CheckProblem } from '@/domain/reps/frameChecks';
import type { NoCountSummary } from '@/domain/reps/pacing';
import type { CameraStation, FormFault } from '@/domain/reps/types';
import type { Station } from '@/domain/scoring/table';

/** Status names as shown; 'Reservist' keeps the wording gender neutral. */
export const STATUS_LABEL: Record<import('@/domain/profile').ServiceStatus, string> = { nsf: 'NSF', nsman: 'Reservist' };

export const SERVICE_LABEL: Record<import('@/domain/profile').Service, string> = { saf: 'SAF', spf: 'SPF', scdf: 'SCDF' };

export const STATION_LABEL: Record<Station, string> = { pushup: 'Push-ups', situp: 'Sit-ups', run: '2.4km run' };

export const SOURCE_LABEL: Record<SessionSource, string> = {
  manual: 'Typed in',
  camera_test: 'Camera count',
  camera_practice: 'Camera practice',
  health_connect: 'Health Connect',
};

/** Where a logged result came from, e.g. 'Health Connect · scaled from 2.51 km' or 'Camera count, corrected'. */
export function sourceDetail(s: Session): string {
  if (s.source === 'health_connect' && s.adjusted && s.runDistanceM) return `Health Connect · scaled from ${(s.runDistanceM / 1000).toFixed(2)} km`;
  if (s.source === 'camera_test' && s.adjusted) return 'Camera count, corrected';
  return SOURCE_LABEL[s.source];
}

/** Reps or run time as shown to the user: '30 reps', '9:45'. */
export function formatResult(station: Station, value: number): string {
  return station === 'run' ? formatRunTime(value) : `${value} reps`;
}

/** The bare number for big displays: '30', '9:45'. */
export function formatValue(station: Station, value: number): string {
  return station === 'run' ? formatRunTime(value) : String(value);
}

export function sessionValue(s: Session): string {
  const value = s.station === 'run' ? s.runTimeS : s.validCount;
  return value === null ? '—' : formatResult(s.station, value);
}

/** Session date in Singapore time, e.g. '10 Oct 2026'. */
export function sessionDate(s: Session): string {
  return formatLocalDate(todayInSingapore(new Date(s.startedAt)));
}

/** Day heading for the log: 'Today, 5 Nov', 'Yesterday, 4 Nov', else '2 Nov 2026'. */
export function dayHeading(day: LocalDate, today: LocalDate, yesterday: LocalDate): string {
  const short = formatLocalDate(day).split(' ').slice(0, 2).join(' ');
  if (day === today) return `Today, ${short}`;
  if (day === yesterday) return `Yesterday, ${short}`;
  return formatLocalDate(day);
}

export const AWARD_LABEL: Record<import('@/domain/scoring/awards').Award, string> = {
  fail: 'Fail',
  pass: 'Pass',
  pass_incentive: 'Pass with Incentive',
  silver: 'Silver',
  gold: 'Gold',
};

/** Lower-case station names for sentences: 'push-ups', 'sit-ups', '2.4km run'. */
export const STATION_NOUN: Record<Station, string> = { pushup: 'push-ups', situp: 'sit-ups', run: '2.4km run' };

/** ['a'] → 'a'; ['a','b'] → 'a and b'; ['a','b','c'] → 'a, b and c'. */
export function joinWithAnd(items: string[]): string {
  return items.length <= 1 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/* ───────────────────────── Camera copy (redesign spec sections 7.10 to 7.14) ───────────────────────── */

export const CHECK_LABEL: Record<CheckId, string> = {
  side_on: 'Side on to the camera',
  pushup_position: 'In push-up position',
  whole_body: 'Whole body in frame',
  knees_bent: 'Knees bent',
};

/** Heading and one line of help for the first failing check. */
export const PROBLEM_COPY: Record<CheckProblem, { heading: string; help: string }> = {
  feet_cut_off: { heading: 'Move the phone back a little', help: 'Your feet are cut off.' },
  head_cut_off: { heading: 'Move the phone back a little', help: 'Your head is cut off.' },
  body_cut_off: { heading: 'Move the phone back a little', help: 'Part of your body is out of frame.' },
  facing_camera: { heading: 'Turn side on', help: 'Lie so one shoulder is behind the other.' },
  not_horizontal: { heading: 'Get into push-up position', help: 'Body in a straight line, hands under your shoulders.' },
  arms_bent: { heading: 'Straighten your arms', help: 'Start at the top, arms locked.' },
  legs_straight: { heading: 'Bend your knees', help: 'Knees at about a right angle, feet flat.' },
};

export const STATION_POSITION: Record<CameraStation, string> = { pushup: 'push-up position', situp: 'sit-up position' };

/** Live cue when a rep is not counted, keyed by the primary fault. */
export const FAULT_CUE: Record<FormFault, string> = {
  not_deep_enough: "Go lower: that one didn't count",
  no_lockout: 'Straighten your arms at the top',
  hips_sagging: "Keep your hips up: that one didn't count",
  hips_piking: "Keep your body straight: that one didn't count",
  not_back_down: "Lie back fully: that one didn't count",
  elbows_short_of_knees: "Sit up higher: that one didn't count",
  hands_off_head: "Keep your hands on your head: that one didn't count",
};

/** Short reason for the screen reader: 'Not counted, lie back fully'. */
export const FAULT_SPOKEN: Record<FormFault, string> = {
  not_deep_enough: 'go lower',
  no_lockout: 'straighten your arms at the top',
  hips_sagging: 'keep your hips up',
  hips_piking: 'keep your body straight',
  not_back_down: 'lie back fully',
  elbows_short_of_knees: 'sit up higher',
  hands_off_head: 'keep your hands on your head',
};

/** Reason as it reads in the result summary: '3 not low enough'. */
export const FAULT_SUMMARY: Record<FormFault, string> = {
  not_deep_enough: 'not low enough',
  no_lockout: 'arms not straight at the top',
  hips_sagging: 'hips sagging',
  hips_piking: 'hips too high',
  not_back_down: "didn't lie back fully",
  elbows_short_of_knees: "didn't sit up high enough",
  hands_off_head: 'hands came off the head',
};

/** '4 not counted: 3 not low enough, 1 arms not straight at the top.' or null when every rep counted. */
export function noCountSentence(s: NoCountSummary): string | null {
  if (s.total === 0) return null;
  const parts = s.byFault.map((f) => `${f.count} ${FAULT_SUMMARY[f.fault]}`);
  if (s.other > 0 && parts.length > 0) parts.push(`${s.other} other`);
  return parts.length === 0 ? `${s.total} not counted.` : `${s.total} not counted: ${parts.join(', ')}.`;
}
