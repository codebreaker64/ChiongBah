import type { Session, SessionSource } from '@/adapters/storage/repositories';
import { formatLocalDate, todayInSingapore } from '@/domain/dates';
import { formatRunTime } from '@/domain/entries/validate';
import type { Station } from '@/domain/scoring/table';

export const STATION_LABEL: Record<Station, string> = { pushup: 'Push-ups', situp: 'Sit-ups', run: '2.4km run' };

export const SOURCE_LABEL: Record<SessionSource, string> = {
  manual: 'Manual',
  camera_test: 'Camera test',
  camera_practice: 'Camera practice',
  health_connect: 'Imported',
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
