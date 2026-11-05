import { LocalDate, parseLocalDate } from '@/domain/dates';
import { ordRodLabel } from '@/domain/countdowns/countdowns';
import { Profile, scoringAge, Service, ServiceStatus } from '@/domain/profile';
import { bandForAge } from '@/domain/scoring/table';
import { currentTable } from '@/domain/scoring/tables';

/**
 * Profile answers as typed, shared by the onboarding steps and the Settings editors.
 * Dates are text, '' when blank.
 */
export type ProfileFormValues = {
  dob: string;
  status: ServiceStatus;
  service: Service;
  eliteVocation: boolean;
  ordRodDate: string;
  ipptDate: string;
};

const REAL_DATE = 'Enter a real date as YYYY-MM-DD.';

/** Field → message; {} when the values make a valid profile. */
export function validateProfileForm(v: ProfileFormValues, today: LocalDate): Record<string, string> {
  const errors: Record<string, string> = {};
  const dob = parseLocalDate(v.dob);
  const ipptDate = v.ipptDate.trim() === '' ? null : parseLocalDate(v.ipptDate);

  if (v.ipptDate.trim() !== '' && !ipptDate) errors.ipptDate = REAL_DATE;

  if (!dob) {
    errors.dob = REAL_DATE;
  } else if (dob > today) {
    errors.dob = "Date of birth can't be in the future.";
  } else if (currentTable) {
    // Without an official table yet, any age is accepted (plan Task 6).
    const age = scoringAge({ ...toProfile(v), dob, ipptDate }, today);
    if (!bandForAge(currentTable, age)) errors.dob = "We can't score your age group yet.";
  }

  if (v.status === 'nsf') {
    if (v.ordRodDate.trim() === '') errors.ordRodDate = `Enter your ${ordRodLabel(v.service)} date.`;
    else if (!parseLocalDate(v.ordRodDate)) errors.ordRodDate = REAL_DATE;
  }
  return errors;
}

export function toProfile(v: ProfileFormValues): Profile {
  return {
    dob: v.dob.trim(),
    status: v.status,
    service: v.service,
    eliteVocation: v.service === 'saf' && v.eliteVocation,
    ordRodDate: v.status === 'nsf' ? v.ordRodDate.trim() : null,
    ipptDate: v.ipptDate.trim() === '' ? null : v.ipptDate.trim(),
  };
}

export function toValues(p?: Profile): ProfileFormValues {
  return {
    dob: p?.dob ?? '',
    status: p?.status ?? 'nsf',
    service: p?.service ?? 'saf',
    eliteVocation: p?.eliteVocation ?? false,
    ordRodDate: p?.ordRodDate ?? '',
    ipptDate: p?.ipptDate ?? '',
  };
}
