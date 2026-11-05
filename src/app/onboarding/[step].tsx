import { now } from '@/app-state/clock';
import { GoalChoice, useOnboarding } from '@/app-state/OnboardingContext';
import { useRepositories } from '@/app-state/RepositoriesContext';
import { useAppData } from '@/app-state/useAppData';
import { countdownTo, ordRodLabel } from '@/domain/countdowns/countdowns';
import { ageOn, parseLocalDate } from '@/domain/dates';
import { targetPoints } from '@/domain/goals/goals';
import { ALL_STEPS, onboardingSteps, OnboardingStep, stepProgress } from '@/domain/onboarding/steps';
import { Award, awardRules } from '@/domain/scoring/awards';
import { bandForAge } from '@/domain/scoring/table';
import { currentTable } from '@/domain/scoring/tables';
import { Body, Button, ChoiceCard, Field, IconButton, ProgressBar, Readout, Screen, Title } from '@/ui/kit';
import { AWARD_LABEL, plural, STATUS_LABEL } from '@/ui/labels';
import { DURATION } from '@/ui/motion';
import { ProfileFormValues, toProfile, validateProfileForm } from '@/ui/ProfileForm';
import { colors, fonts, tabular } from '@/ui/theme';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

/** Which validation error belongs to each step. */
const FIELD: Partial<Record<OnboardingStep, keyof ProfileFormValues>> = { dob: 'dob', ordRod: 'ordRodDate', ippt: 'ipptDate' };

/** Award options, best first; Pass with Incentive only for reservists (redesign spec section 6.2). */
function goalOptions(status: ProfileFormValues['status']): Exclude<Award, 'fail'>[] {
  return status === 'nsman' ? ['gold', 'silver', 'pass_incentive', 'pass'] : ['gold', 'silver', 'pass'];
}

/**
 * One onboarding question per screen (redesign spec sections 6.2 and 7.3). With `?edit=1`, Settings
 * opens the same screen as an editor that saves and goes back.
 */
export default function OnboardingStepScreen() {
  const params = useLocalSearchParams<{ step: string; edit?: string }>();
  const step = params.step as OnboardingStep;
  const editing = params.edit === '1';
  const repos = useRepositories();
  const { today } = useAppData();
  const { values: v, set, goal, setGoal } = useOnboarding();
  const [error, setError] = useState<string>();

  if (!ALL_STEPS.includes(step)) return <Redirect href="/onboarding" />;

  const steps = onboardingSteps(v);
  const index = Math.max(0, steps.indexOf(step));
  const progress = stepProgress(index, steps.length);
  const isLast = index === steps.length - 1;
  const label = ordRodLabel(v.service);
  const update = <K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]) => { set(key, value); setError(undefined); };
  const who = { status: v.status, eliteVocation: v.service === 'saf' && v.eliteVocation };

  const answered =
    step === 'dob' ? v.dob.trim() !== ''
      : step === 'ordRod' ? v.ordRodDate.trim() !== ''
      : step === 'goal' ? goal !== null || editing
      : true;

  /** Saves everything; in edit mode a newly needed answer (e.g. an ORD date after switching to NSF) is asked first. */
  const saveAll = (target: GoalChoice, keepGoal: boolean) => {
    const errors = validateProfileForm(v, today);
    const pending = onboardingSteps(v).find((s) => FIELD[s] && errors[FIELD[s] as string]);
    if (pending) {
      if (pending === step) setError(errors[FIELD[pending] as string]);
      // Editing: swap this editor for the one still needing an answer, so saving there goes straight back.
      else if (editing) router.replace({ pathname: '/onboarding/[step]', params: { step: pending, edit: '1' } });
      else router.push({ pathname: '/onboarding/[step]', params: { step: pending } });
      return;
    }
    repos.profile.save(toProfile(v));
    if (!keepGoal) {
      if (target) repos.goal.save({ kind: 'award', award: target }, now().toISOString());
      else if (editing) repos.goal.clear();
    }
    if (editing) router.back();
    else router.replace('/');
  };

  const next = () => {
    const field = FIELD[step];
    const found = field ? validateProfileForm(v, today)[field] : undefined;
    if (found) { setError(found); return; }
    if (editing) { saveAll(goal, step !== 'goal'); return; }
    if (isLast) saveAll(goal, false);
    else router.push({ pathname: '/onboarding/[step]', params: { step: steps[index + 1] } });
  };

  const skipIppt = () => {
    set('ipptDate', '');
    setError(undefined);
    if (editing) router.back();
    else router.push({ pathname: '/onboarding/[step]', params: { step: steps[index + 1] } });
  };

  const back = () => (router.canGoBack() ? router.back() : router.replace('/onboarding'));
  const primary = editing ? 'Save' : isLast ? 'Start training' : 'Continue';

  const footer = (
    <>
      <Button label={primary} onPress={next} disabled={!answered} />
      {step === 'ippt' ? <Button variant="text" label="Skip for now" onPress={skipIppt} /> : null}
      {step === 'goal' && !editing ? <Button secondary label="Decide later" onPress={() => saveAll(null, false)} /> : null}
    </>
  );

  return (
    <Screen gap={20} footer={footer}>
      <View style={{ gap: 12 }}>
        <View style={styles.top}>
          <IconButton icon="back" label="Back" onPress={back} />
          {editing ? null : <Text style={styles.count}>{`${index + 1} of ${steps.length}`}</Text>}
        </View>
        {editing ? null : (
          <ProgressBar value={progress.fraction} max={1} from={progress.from} duration={DURATION.progress}
            accessibilityLabel={`Step ${index + 1} of ${steps.length}`} />
        )}
      </View>

      {step === 'dob' ? (
        <StepBody title="When were you born?" why="Your IPPT points depend on your age group.">
          <Field label="Date of birth" value={v.dob} onChangeText={(t) => update('dob', t)} error={error} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" onSubmitEditing={next} />
          <AgeReadout dob={v.dob} today={today} ipptDate={v.ipptDate} hidden={!!error} />
        </StepBody>
      ) : null}

      {step === 'status' ? (
        <StepBody title="Which describes you?" why="The pass mark and your countdowns depend on it.">
          <ChoiceCard title={STATUS_LABEL.nsf} detail="Serving full-time national service" selected={v.status === 'nsf'} onPress={() => update('status', 'nsf')} />
          <ChoiceCard title={STATUS_LABEL.nsman} detail="Operationally ready, with in-camp training and IPPT" selected={v.status === 'nsman'} onPress={() => update('status', 'nsman')} />
        </StepBody>
      ) : null}

      {step === 'service' ? (
        <StepBody title="Which service?" why="Sets whether you count down to ORD or ROD.">
          <ChoiceCard title="SAF" detail="Army, Navy or Air Force" selected={v.service === 'saf'} onPress={() => update('service', 'saf')} />
          <ChoiceCard title="SPF" detail="Police" selected={v.service === 'spf'} onPress={() => update('service', 'spf')} />
          <ChoiceCard title="SCDF" detail="Civil Defence" selected={v.service === 'scdf'} onPress={() => update('service', 'scdf')} />
        </StepBody>
      ) : null}

      {step === 'vocation' ? (
        <StepBody title="Commando, Diver or Guards?" why="These vocations need more points for Silver and Gold.">
          <ChoiceCard title="Yes" detail={`Silver ${awardRules.eliteSilver}, Gold ${awardRules.eliteGold}`} selected={v.eliteVocation} onPress={() => update('eliteVocation', true)} />
          <ChoiceCard title="No" detail={`Silver ${awardRules.silver}, Gold ${awardRules.gold}`} selected={!v.eliteVocation} onPress={() => update('eliteVocation', false)} />
        </StepBody>
      ) : null}

      {step === 'ordRod' ? (
        <StepBody title={`When is your ${label}?`} why="Home counts down the days.">
          <Field label={`${label} date`} value={v.ordRodDate} onChangeText={(t) => update('ordRodDate', t)} error={error} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" onSubmitEditing={next} />
          <DaysReadout date={v.ordRodDate} today={today} label="to go" hidden={!!error} />
        </StepBody>
      ) : null}

      {step === 'ippt' ? (
        <StepBody title="When is your next IPPT?" why="Optional. It sets the deadline for your goal, and you can add it later in Settings.">
          <Field label="Next IPPT date (optional)" value={v.ipptDate} onChangeText={(t) => update('ipptDate', t)} error={error} placeholder="YYYY-MM-DD" keyboardType="numbers-and-punctuation" onSubmitEditing={next} />
          <DaysReadout date={v.ipptDate} today={today} label="to train" hidden={!!error} />
        </StepBody>
      ) : null}

      {step === 'goal' ? (
        <StepBody title="What are you aiming for?" why="Goals shows how many points you still need, station by station.">
          {goalOptions(v.status).map((a) => (
            <ChoiceCard
              key={a}
              title={AWARD_LABEL[a]}
              detail={`${targetPoints({ kind: 'award', award: a }, who, awardRules)} points`}
              selected={goal === a}
              onPress={() => setGoal(goal === a && editing ? null : a)}
            />
          ))}
        </StepBody>
      ) : null}
    </Screen>
  );
}

function StepBody({ title, why, children }: { title: string; why: string; children: React.ReactNode }) {
  return (
    <>
      <View style={{ gap: 10, marginTop: 12 }}>
        <Title>{title}</Title>
        <Body muted>{why}</Body>
      </View>
      <View style={{ gap: 12 }}>{children}</View>
    </>
  );
}

/** '22 years old · Scored in the 22 to 24 age group', once the date is real. */
function AgeReadout({ dob, today, ipptDate, hidden }: { dob: string; today: string; ipptDate: string; hidden: boolean }) {
  const date = parseLocalDate(dob);
  if (hidden || !date || date > today) return null;
  const age = ageOn(date, today);
  const scoringOn = parseLocalDate(ipptDate) ?? today;
  const band = currentTable ? bandForAge(currentTable, ageOn(date, scoringOn)) : null;
  return (
    <Readout
      value={String(age)}
      label={age === 1 ? 'year old' : 'years old'}
      detail={band ? `Scored in the ${band.minAge} to ${band.maxAge} age group` : undefined}
    />
  );
}

/** '71 days to go' for a real future date. */
function DaysReadout({ date, today, label, hidden }: { date: string; today: string; label: string; hidden: boolean }) {
  const d = parseLocalDate(date);
  if (hidden || !d) return null;
  const c = countdownTo(d, today);
  if (c.kind !== 'upcoming') return null;
  return <Readout value={String(c.days)} label={`${c.days === 1 ? 'day' : 'days'} ${label}`} accessibilityLabel={`${plural(c.days, 'day')} ${label}`} />;
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 44 },
  count: { fontFamily: fonts.body, fontSize: 14, color: colors.muted, ...tabular },
});
