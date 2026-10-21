import type { Session, SessionSource } from '@/adapters/storage/repositories';
import { formatLocalDate, todayInSingapore } from '@/domain/dates';
import { formatRunTime } from '@/domain/entries/validate';
import type { Station } from '@/domain/scoring/table';

export const STATION_LABEL: Record<Station, string> = { pushup: 'Push-ups', situp: 'Sit-ups', run: '2.4km run' };

export const SOURCE_LABEL: Record<SessionSource, string> = {
  manual: 'Manual',
  camera_test: 'Camera test',
  camera_practice: 'Camera practice',
  health_connect: 'Health Connect',
};

/** Reps or run time as shown to the user: '30 reps', '9:45'. */
export function formatResult(station: Station, value: number): string {
  return station === 'run' ? formatRunTime(value) : `${value} reps`;
}

export function sessionValue(s: Session): string {
  const value = s.station === 'run' ? s.runTimeS : s.validCount;
  return value === null ? '—' : formatResult(s.station, value);
}

/** Session date in Singapore time, e.g. '10 Oct 2026'. */
export function sessionDate(s: Session): string {
  return formatLocalDate(todayInSingapore(new Date(s.startedAt)));
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
