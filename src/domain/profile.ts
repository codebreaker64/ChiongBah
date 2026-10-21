import { ageOn, LocalDate } from './dates';

export type ServiceStatus = 'nsf' | 'nsman';
export type Service = 'saf' | 'spf' | 'scdf';

export type Profile = {
  dob: LocalDate;
  status: ServiceStatus;
  service: Service;
  eliteVocation: boolean;
  ordRodDate: LocalDate | null;
  ipptDate: LocalDate | null;
};

/**
 * Age used to pick the scoring age band: age on the IPPT date if set, else today.
 * Age rule unverified — spec section 13.
 */
export function scoringAge(profile: Profile, today: LocalDate): number {
  return ageOn(profile.dob, profile.ipptDate ?? today);
}
