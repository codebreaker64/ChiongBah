import { now } from '@/app-state/clock';
import { useRepositories } from '@/app-state/RepositoriesContext';
import { useAppData } from '@/app-state/useAppData';
import { ordRodLabel } from '@/domain/countdowns/countdowns';
import { ageOn, parseLocalDate } from '@/domain/dates';
import { GoalTarget, targetPoints } from '@/domain/goals/goals';
import { Award, awardRules } from '@/domain/scoring/awards';
import { Body, Button, ChoiceCard, colors, Field, ProgressBar, Screen, Title } from '@/ui/kit';
import { AWARD_LABEL, STATUS_LABEL } from '@/ui/labels';
import { ProfileFormValues, toProfile, toValues, validateProfileForm } from '@/ui/ProfileForm';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type Step = 'dob' | 'status' | 'service' | 'vocation' | 'ordRod' | 'ippt' | 'goal';
const AWARDS: Exclude<Award, 'fail'>[] = ['pass', 'pass_incentive', 'silver', 'gold'];

/** The steps this person sees: vocation only for SAF, ORD/ROD only for NSFs. */
function stepsFor(v: ProfileFormValues): Step[] {
  return ['dob', 'status', 'service', ...(v.service === 'saf' ? ['vocation' as const] : []), ...(v.status === 'nsf' ? ['ordRod' as const] : []), 'ippt', 'goal'];
}

/** Which validation errors belong to each step. */
const FIELDS: Partial<Record<Step, keyof ProfileFormValues>> = { dob: 'dob', ordRod: 'ordRodDate', ippt: 'ipptDate' };

export default function OnboardingProfile() {
  const repos = useRepositories();
  const { today } = useAppData();
  const [v, setV] = useState<ProfileFormValues>(() => toValues());
  const [goal, setGoal] = useState<Exclude<Award, 'fail'> | null>(null);
  const [index, setIndex] = useState(0);
  const [error, setError] = useState<string>();
  const set = <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) => { setV((old) => ({ ...old, [key]: value })); setError(undefined); };

  const steps = stepsFor(v);
  const step = steps[Math.min(index, steps.length - 1)];
  const isLast = index >= steps.length - 1;
  const label = ordRodLabel(v.service);
  const dob = parseLocalDate(v.dob);

  const finish = (target: Exclude<Award, 'fail'> | null) => {
    repos.profile.save(toProfile(v));
    if (target) repos.goal.save({ kind: 'award', award: target } satisfies GoalTarget, now().toISOString());
    router.replace('/');
  };

  const next = () => {
    const field = FIELDS[step];
    const found = field ? validateProfileForm(v, today)[field] : undefined;
    if (found) { setError(found); return; }
    if (isLast) finish(goal);
    else setIndex(index + 1);
  };

  const back = () => { setError(undefined); if (index > 0) setIndex(index - 1); else router.back(); };

  return (
    <Screen>
      <View style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} hitSlop={12} style={styles.back}>
          <SymbolView name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }} tintColor={colors.text} size={24} />
        </Pressable>
        <Text style={styles.count}>{`${index + 1} of ${steps.length}`}</Text>
      </View>
      <ProgressBar key={steps.length} value={index + 1} max={steps.length} />

      {step === 'dob' ? (
        <View style={styles.body}>
          <Title>When were you born?</Title>
          <Body muted>Your IPPT points depend on your age group.</Body>
          <Field label="Date of birth" value={v.dob} onChangeText={(t) => set('dob', t)} error={error} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
          {dob && dob <= today && !error ? <Body>{`You're ${ageOn(dob, today)}.`}</Body> : null}
        </View>
      ) : null}

      {step === 'status' ? (
        <View style={styles.body}>
          <Title>Which describes you?</Title>
          <Body muted>The pass mark and your countdowns depend on it.</Body>
          <ChoiceCard title={STATUS_LABEL.nsf} detail="Serving full-time national service" selected={v.status === 'nsf'} onPress={() => set('status', 'nsf')} />
          <ChoiceCard title={STATUS_LABEL.nsman} detail="Operationally ready, with in-camp training and IPPT" selected={v.status === 'nsman'} onPress={() => set('status', 'nsman')} />
        </View>
      ) : null}

      {step === 'service' ? (
        <View style={styles.body}>
          <Title>Which service?</Title>
          <Body muted>Sets whether you count down to ORD or ROD.</Body>
          <ChoiceCard title="SAF" detail="Army, Navy or Air Force" selected={v.service === 'saf'} onPress={() => set('service', 'saf')} />
          <ChoiceCard title="SPF" detail="Police" selected={v.service === 'spf'} onPress={() => set('service', 'spf')} />
          <ChoiceCard title="SCDF" detail="Civil Defence" selected={v.service === 'scdf'} onPress={() => set('service', 'scdf')} />
        </View>
      ) : null}

      {step === 'vocation' ? (
        <View style={styles.body}>
          <Title>Commando, Diver or Guards?</Title>
          <Body muted>These vocations need more points for Silver and Gold.</Body>
          <ChoiceCard title="Yes" selected={v.eliteVocation} onPress={() => set('eliteVocation', true)} />
          <ChoiceCard title="No" selected={!v.eliteVocation} onPress={() => set('eliteVocation', false)} />
        </View>
      ) : null}

      {step === 'ordRod' ? (
        <View style={styles.body}>
          <Title>{`When is your ${label}?`}</Title>
          <Body muted>Home counts down the days.</Body>
          <Field label={`${label} date`} value={v.ordRodDate} onChangeText={(t) => set('ordRodDate', t)} error={error} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
        </View>
      ) : null}

      {step === 'ippt' ? (
        <View style={styles.body}>
          <Title>When is your next IPPT?</Title>
          <Body muted>Optional. It sets the deadline for your goal, and you can add it later in Settings.</Body>
          <Field label="Next IPPT date (optional)" value={v.ipptDate} onChangeText={(t) => set('ipptDate', t)} error={error} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" />
        </View>
      ) : null}

      {step === 'goal' ? (
        <View style={styles.body}>
          <Title>What are you aiming for?</Title>
          <Body muted>Goals shows how many points you still need, station by station.</Body>
          {AWARDS.slice().reverse().map((a) => (
            <ChoiceCard
              key={a}
              title={AWARD_LABEL[a]}
              detail={`${targetPoints({ kind: 'award', award: a }, { status: v.status, eliteVocation: v.service === 'saf' && v.eliteVocation }, awardRules)} points`}
              selected={goal === a}
              onPress={() => setGoal(a)}
            />
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button label={isLast ? 'Start training' : 'Continue'} onPress={next} />
        {step === 'goal' ? <Button secondary label="Decide later" onPress={() => finish(null)} /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  back: { width: 44, height: 44, justifyContent: 'center' },
  count: { fontSize: 14, color: colors.muted, fontVariant: ['tabular-nums'] },
  body: { gap: 12, marginTop: 16 },
  actions: { gap: 10, marginTop: 24 },
});
