import { now } from '@/app-state/clock';
import { useRepositories } from '@/app-state/RepositoriesContext';
import { useAppData } from '@/app-state/useAppData';
import { countdownTo } from '@/domain/countdowns/countdowns';
import { GoalTarget, goalProgress, StationGap } from '@/domain/goals/goals';
import { scoringAge } from '@/domain/profile';
import { Award, awardRules } from '@/domain/scoring/awards';
import { currentTable } from '@/domain/scoring/tables';
import { Body, Button, Card, Chip, ChipRow, colors, Field, Screen, Title } from '@/ui/kit';
import { AWARD_LABEL, formatResult, plural, STATION_LABEL } from '@/ui/labels';
import { PracticeEstimateLabel } from '@/ui/PracticeEstimateLabel';
import { useState } from 'react';
import { Text, View } from 'react-native';

const AWARDS: Exclude<Award, 'fail'>[] = ['pass', 'pass_incentive', 'silver', 'gold'];

function StationRow({ gap, cheapest }: { gap: StationGap; cheapest: boolean }) {
  return (
    <View style={{ gap: 2, paddingVertical: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{STATION_LABEL[gap.station]}</Text>
        {cheapest ? <Text style={{ color: colors.accent, fontWeight: '600' }}>Cheapest points</Text> : null}
      </View>
      {gap.current === null ? <Body muted>No result yet</Body> : (
        <Body muted>{`Now ${formatResult(gap.station, gap.current)} · ${gap.currentPoints} pts`}</Body>
      )}
      {gap.current !== null && gap.next.length === 0 ? <Body muted>Maximum points</Body> : null}
      {gap.next.map((step) => (
        <Body key={step.target}>
          {`${gap.station === 'run' ? `−${step.gain} s` : `+${step.gain} reps`} → ${step.pointsAfter} pts (${step.improvementPct}%)`}
        </Body>
      ))}
    </View>
  );
}

export default function Goals() {
  const repos = useRepositories();
  const { today, profile, goal, latest, refresh } = useAppData();
  const [customOpen, setCustomOpen] = useState(false);
  const [customText, setCustomText] = useState('');
  const [customError, setCustomError] = useState<string>();
  if (!profile) return null;

  const save = (target: GoalTarget) => {
    repos.goal.save(target, now().toISOString());
    refresh();
  };
  const saveCustom = () => {
    const points = /^\d+$/.test(customText.trim()) ? Number(customText.trim()) : NaN;
    if (!(points >= 1 && points <= 100)) {
      setCustomError('Enter a score from 1 to 100.');
      return;
    }
    setCustomError(undefined);
    save({ kind: 'score', points });
  };

  const progress = goal && currentTable
    ? goalProgress(goal, latest, scoringAge(profile, today), currentTable, profile, awardRules)
    : null;
  const deadline = countdownTo(profile.ipptDate, today);

  return (
    <Screen>
      <Title>Goals</Title>
      <ChipRow>
        {AWARDS.map((a) => (
          <Chip key={a} label={AWARD_LABEL[a]} selected={!customOpen && goal?.kind === 'award' && goal.award === a}
            onPress={() => { setCustomOpen(false); save({ kind: 'award', award: a }); }} />
        ))}
        <Chip label="Custom score" selected={customOpen || goal?.kind === 'score'} onPress={() => setCustomOpen(true)} />
      </ChipRow>
      {customOpen ? (
        <View style={{ gap: 8 }}>
          <Field label="Custom score" value={customText} onChangeText={(t) => { setCustomText(t); setCustomError(undefined); }} error={customError} keyboardType="number-pad" placeholder="70" />
          <Button label="Set target" onPress={saveCustom} />
        </View>
      ) : null}

      {!goal ? <Body muted>Pick a target to see your gap.</Body> : null}
      {goal && !currentTable ? <Body muted>Scoring tables not added yet.</Body> : null}
      {progress && 'error' in progress ? <Body muted>{"We can't score your age group yet."}</Body> : null}

      {progress && !('error' in progress) ? (
        <>
          <Card>
            <Text style={{ fontSize: 22, fontWeight: '600', color: colors.text }}>{`Target ${progress.targetPoints} points`}</Text>
            <Body muted>
              {deadline.kind === 'upcoming' ? `IPPT in ${plural(deadline.days, 'day')}`
                : deadline.kind === 'today' ? 'IPPT today'
                : deadline.kind === 'passed' ? 'Your IPPT date has passed'
                : 'Set your IPPT date in Settings'}
            </Body>
            {progress.total === null ? <Body>Log all three stations to see your gap.</Body>
              : progress.met ? <Body>Target met</Body>
              : progress.pointsNeeded === 0 ? <Body>Every station needs at least 1 point.</Body>
              : <Body>{`${plural(progress.pointsNeeded ?? 0, 'point')} to go`}</Body>}
            <PracticeEstimateLabel />
          </Card>
          <Card>
            {progress.stations.map((gap) => (
              <StationRow key={gap.station} gap={gap} cheapest={progress.cheapest[0] === gap.station} />
            ))}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
