import { now } from '@/app-state/clock';
import { useRepositories } from '@/app-state/RepositoriesContext';
import { useAppData } from '@/app-state/useAppData';
import { countdownTo } from '@/domain/countdowns/countdowns';
import { GoalTarget, goalProgress, StationGap } from '@/domain/goals/goals';
import { scoringAge } from '@/domain/profile';
import { Award, awardRules, scoreIppt, StationResults } from '@/domain/scoring/awards';
import { MAX_POINTS, ScoringTable, Station, STATIONS } from '@/domain/scoring/table';
import type { Profile } from '@/domain/profile';
import { currentTable } from '@/domain/scoring/tables';
import { Body, Button, Card, Chip, ChipRow, colors, Field, fonts, ListRow, ProgressBar, Screen, SectionTitle, Title } from '@/ui/kit';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { AWARD_LABEL, formatResult, plural, STATION_LABEL } from '@/ui/labels';
import { PracticeEstimateLabel } from '@/ui/PracticeEstimateLabel';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const AWARDS: Exclude<Award, 'fail'>[] = ['pass', 'pass_incentive', 'silver', 'gold'];

function StationRow({ gap, cheapest }: { gap: StationGap; cheapest: boolean }) {
  return (
    <View style={styles.station}>
      <View style={styles.stationHead}>
        <Text style={styles.stationName}>{STATION_LABEL[gap.station]}</Text>
        {cheapest ? <Text style={styles.tag}>Cheapest points</Text> : null}
      </View>
      {gap.current === null ? <Body muted>No result yet</Body> : (
        <>
          <Body muted>{`Now ${formatResult(gap.station, gap.current)} · ${gap.currentPoints} pts`}</Body>
          <ProgressBar value={gap.currentPoints ?? 0} max={MAX_POINTS[gap.station]} />
        </>
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

const STEP: Record<Station, number> = { pushup: 1, situp: 1, run: 5 };

/** Try a better result on one station and see the total and award it would give. */
function WhatIf({ latest, age, table, profile }: { latest: StationResults; age: number; table: ScoringTable; profile: Profile }) {
  const [station, setStation] = useState<Station>('pushup');
  const [delta, setDelta] = useState(0);
  const base = latest[station];
  if (base === null) return null;
  const isRun = station === 'run';
  const value = isRun ? Math.max(420, base - delta) : Math.min(100, base + delta);
  const result = scoreIppt({ ...latest, [station]: value }, age, table, profile, awardRules);
  if ('error' in result || result.total === null || !result.award) return null;
  const change = isRun ? `−${delta} s` : `+${delta} reps`;
  const step = (dir: 1 | -1) => setDelta((d) => Math.max(0, d + dir * STEP[station]));
  return (
    <Card>
      <Text style={styles.cardTitle}>What if</Text>
      <ChipRow>
        {STATIONS.map((s) => (
          <Chip key={s} label={STATION_LABEL[s]} selected={station === s} onPress={() => { setStation(s); setDelta(0); }} />
        ))}
      </ChipRow>
      <View style={styles.stepper}>
        <Pressable accessibilityRole="button" accessibilityLabel={isRun ? 'Slower' : 'Fewer reps'} onPress={() => step(-1)} style={styles.stepButton}>
          <SymbolView name={{ ios: 'minus', android: 'remove', web: 'remove' }} tintColor={colors.accent} size={22} />
        </Pressable>
        <View style={styles.stepValue}>
          <Text style={styles.stepMain}>{formatResult(station, value)}</Text>
          <Body muted>{delta === 0 ? 'Your latest' : change}</Body>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={isRun ? 'Faster' : 'More reps'} onPress={() => step(1)} style={styles.stepButton}>
          <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} tintColor={colors.accent} size={22} />
        </Pressable>
      </View>
      <Text style={styles.whatIfResult}>{`Total ${result.total}/100 · ${AWARD_LABEL[result.award]}`}</Text>
    </Card>
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
      <Card>
        <ListRow first label="Score tables by age" onPress={() => router.push('/tables')} />
      </Card>
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
            <Text style={styles.cardTitle}>Your gap</Text>
            {progress.total === null ? <Text style={styles.status}>Log all three stations to see your gap.</Text>
              : progress.met ? <Text style={styles.status}>Target met</Text>
              : progress.pointsNeeded === 0 ? <Text style={styles.status}>Every station needs at least 1 point.</Text>
              : (
                <View style={styles.gapRow} accessible accessibilityLabel={`${plural(progress.pointsNeeded ?? 0, 'point')} to go`}>
                  <Text style={styles.gapNumber}>{String(progress.pointsNeeded)}</Text>
                  <Text style={styles.gapCaption}>{`${progress.pointsNeeded === 1 ? 'point' : 'points'} to go`}</Text>
                </View>
              )}
            <View style={styles.facts}>
              <Body muted>{`Target ${progress.targetPoints} points`}</Body>
              <Body muted>
                {deadline.kind === 'upcoming' ? `IPPT in ${plural(deadline.days, 'day')}`
                  : deadline.kind === 'today' ? 'IPPT today'
                  : deadline.kind === 'passed' ? 'Your IPPT date has passed'
                  : 'Set your IPPT date in Settings'}
              </Body>
            </View>
            <PracticeEstimateLabel />
          </Card>
          {currentTable ? <WhatIf latest={latest} age={scoringAge(profile, today)} table={currentTable} profile={profile} /> : null}
          <SectionTitle>By station</SectionTitle>
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

const styles = StyleSheet.create({
  station: { gap: 6, paddingVertical: 6 },
  stationHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stationName: { fontSize: 16, fontWeight: '600', color: colors.text },
  tag: { color: colors.accent, fontWeight: '600', fontSize: 13 },
  status: { fontSize: 26, fontFamily: fonts.displaySemi, color: colors.text },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.muted },
  gapRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  gapNumber: { fontSize: 88, fontFamily: fonts.display, color: colors.text, fontVariant: ['tabular-nums'], lineHeight: 92 },
  gapCaption: { fontSize: 24, fontFamily: fonts.displaySemi, color: colors.muted },
  facts: { gap: 2 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  stepButton: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  stepValue: { alignItems: 'center' },
  stepMain: { fontSize: 36, fontFamily: fonts.display, color: colors.text, fontVariant: ['tabular-nums'] },
  whatIfResult: { fontSize: 24, fontFamily: fonts.displaySemi, color: colors.accent, textAlign: 'center' },
});
