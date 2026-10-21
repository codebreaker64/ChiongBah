import { LocalDate, parseLocalDate } from '@/domain/dates';
import { ordRodLabel } from '@/domain/countdowns/countdowns';
import { Profile, scoringAge, Service, ServiceStatus } from '@/domain/profile';
import { bandForAge } from '@/domain/scoring/table';
import { currentTable } from '@/domain/scoring/tables';
import { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { Body, Button, Chip, ChipRow, colors, Field } from './kit';

/** Dates as typed text, '' when blank. */
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

function toProfile(v: ProfileFormValues): Profile {
  return {
    dob: v.dob.trim(),
    status: v.status,
    service: v.service,
    eliteVocation: v.eliteVocation,
    ordRodDate: v.status === 'nsf' ? v.ordRodDate.trim() : null,
    ipptDate: v.ipptDate.trim() === '' ? null : v.ipptDate.trim(),
  };
}

function toValues(p?: Profile): ProfileFormValues {
  return {
    dob: p?.dob ?? '',
    status: p?.status ?? 'nsf',
    service: p?.service ?? 'saf',
    eliteVocation: p?.eliteVocation ?? false,
    ordRodDate: p?.ordRodDate ?? '',
    ipptDate: p?.ipptDate ?? '',
  };
}

export function ProfileForm(props: { initial?: Profile; submitLabel: string; today: LocalDate; onSubmit(p: Profile): void }) {
  const [v, setV] = useState<ProfileFormValues>(() => toValues(props.initial));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) => setV((old) => ({ ...old, [key]: value }));

  const submit = () => {
    const found = validateProfileForm(v, props.today);
    setErrors(found);
    if (Object.keys(found).length === 0) props.onSubmit(toProfile(v));
  };

  const label = ordRodLabel(v.service);
  return (
    <View style={{ gap: 14 }}>
      <Field label="Date of birth" value={v.dob} onChangeText={(t) => set('dob', t)} error={errors.dob} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />

      <View style={{ gap: 6 }}>
        <Body muted>I am</Body>
        <ChipRow>
          <Chip label="NSF" selected={v.status === 'nsf'} onPress={() => set('status', 'nsf')} />
          <Chip label="NSman" selected={v.status === 'nsman'} onPress={() => set('status', 'nsman')} />
        </ChipRow>
      </View>

      <View style={{ gap: 6 }}>
        <Body muted>Service</Body>
        <ChipRow>
          <Chip label="SAF" selected={v.service === 'saf'} onPress={() => set('service', 'saf')} />
          <Chip label="SPF" selected={v.service === 'spf'} onPress={() => set('service', 'spf')} />
          <Chip label="SCDF" selected={v.service === 'scdf'} onPress={() => set('service', 'scdf')} />
        </ChipRow>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 16, color: colors.text, flex: 1 }}>Commando, Diver or Guards</Text>
        <Switch
          accessibilityLabel="Commando, Diver or Guards"
          value={v.eliteVocation}
          onValueChange={(on) => set('eliteVocation', on)}
          trackColor={{ true: colors.accent, false: colors.border }}
          thumbColor={colors.text}
        />
      </View>

      {v.status === 'nsf' ? (
        <Field label={`${label} date`} value={v.ordRodDate} onChangeText={(t) => set('ordRodDate', t)} error={errors.ordRodDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
      ) : null}

      <Field label="Next IPPT date (optional)" value={v.ipptDate} onChangeText={(t) => set('ipptDate', t)} error={errors.ipptDate} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />

      <Button label={props.submitLabel} onPress={submit} />
    </View>
  );
}
