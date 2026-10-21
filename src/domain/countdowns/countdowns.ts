import { daysBetween, LocalDate } from '../dates';
import { Profile, Service } from '../profile';

export type Countdown =
  | { kind: 'not_set' }
  | { kind: 'upcoming'; days: number }
  | { kind: 'today' }
  | { kind: 'passed'; daysAgo: number };

export function countdownTo(target: LocalDate | null, today: LocalDate): Countdown {
  if (target === null) return { kind: 'not_set' };
  const days = daysBetween(today, target);
  if (days > 0) return { kind: 'upcoming', days };
  if (days === 0) return { kind: 'today' };
  return { kind: 'passed', daysAgo: -days };
}

/** SAF NSFs count down to ORD; SPF and SCDF NSFs to ROD. */
export function ordRodLabel(service: Service): 'ORD' | 'ROD' {
  return service === 'saf' ? 'ORD' : 'ROD';
}

export function homeCountdowns(
  profile: Profile,
  today: LocalDate,
): { ordRod: { label: 'ORD' | 'ROD'; countdown: Countdown } | null; ippt: Countdown } {
  return {
    ordRod: profile.status === 'nsf'
      ? { label: ordRodLabel(profile.service), countdown: countdownTo(profile.ordRodDate, today) }
      : null,
    ippt: countdownTo(profile.ipptDate, today),
  };
}
