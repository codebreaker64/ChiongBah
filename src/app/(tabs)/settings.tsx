import { healthImporter } from '@/adapters/health/healthConnect';
import { useAppData } from '@/app-state/useAppData';
import { ordRodLabel } from '@/domain/countdowns/countdowns';
import { formatLocalDate } from '@/domain/dates';
import type { OnboardingStep } from '@/domain/onboarding/steps';
import { Caption, ListRow, RowGroup, Screen, SectionTitle, Title } from '@/ui/kit';
import { AWARD_LABEL, SERVICE_LABEL, STATUS_LABEL } from '@/ui/labels';
import { colors, fonts } from '@/ui/theme';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

const edit = (step: OnboardingStep) => () => router.push({ pathname: '/onboarding/[step]', params: { step, edit: '1' } });

/** Settings (redesign spec section 7.15). Each profile row opens its onboarding step as an editor. */
export default function Settings() {
  const { profile, goal } = useAppData();
  const [connected, setConnected] = useState<boolean | null>(null);
  useFocusEffect(useCallback(() => {
    let alive = true;
    healthImporter.hasAccess().then((on) => { if (alive) setConnected(on); }).catch(() => {});
    return () => { alive = false; };
  }, []));
  if (!profile) return null;

  const rows: { step: OnboardingStep; label: string; value: string }[] = [
    { step: 'dob', label: 'Date of birth', value: formatLocalDate(profile.dob) },
    { step: 'status', label: 'Status', value: STATUS_LABEL[profile.status] },
    { step: 'service', label: 'Service', value: SERVICE_LABEL[profile.service] },
  ];
  if (profile.service === 'saf') rows.push({ step: 'vocation', label: 'Commando, Diver or Guards', value: profile.eliteVocation ? 'Yes' : 'No' });
  if (profile.status === 'nsf') {
    rows.push({ step: 'ordRod', label: `${ordRodLabel(profile.service)} date`, value: profile.ordRodDate ? formatLocalDate(profile.ordRodDate) : 'Not set' });
  }
  rows.push({ step: 'ippt', label: 'Next IPPT', value: profile.ipptDate ? formatLocalDate(profile.ipptDate) : 'Not set' });
  rows.push({ step: 'goal', label: 'Goal', value: goal ? (goal.kind === 'award' ? AWARD_LABEL[goal.award] : `${goal.points} points`) : 'Not set' });

  const status = connected === null ? undefined : (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {connected ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent }} /> : null}
      <Text style={{ fontFamily: fonts.body, fontSize: 15, color: connected ? colors.accent : colors.muted }}>{connected ? 'Connected' : 'Connect'}</Text>
    </View>
  );

  return (
    <Screen variant="tab" gap={10}>
      <Title>Settings</Title>
      <SectionTitle>Profile</SectionTitle>
      <RowGroup>
        {rows.map((r, i) => (
          <ListRow key={r.step} first={i === 0} label={r.label} value={r.value} onPress={edit(r.step)} accessibilityHint={`Change your ${r.label.toLowerCase()}`} />
        ))}
      </RowGroup>
      <SectionTitle>Connections</SectionTitle>
      <RowGroup>
        <ListRow first label="Health Connect" value={status} onPress={() => router.push('/log/import')} />
      </RowGroup>
      <SectionTitle>Support</SectionTitle>
      <RowGroup>
        <ListRow first label="Help & Support" onPress={() => router.push('/help')} />
        <ListRow label="Terms of Service" onPress={() => router.push('/terms')} />
        <ListRow label="Privacy Policy" onPress={() => router.push('/privacy')} />
      </RowGroup>
      <Caption style={{ marginTop: 6 }}>Not affiliated with MINDEF/SAF/SPF/SCDF; scores are practice estimates.</Caption>
    </Screen>
  );
}
