import { now } from '@/app-state/clock';
import { useRepositories } from '@/app-state/RepositoriesContext';
import { useAppData } from '@/app-state/useAppData';
import { countdownTo } from '@/domain/countdowns/countdowns';
import { GoalTarget, goalProgress } from '@/domain/goals/goals';
import { easiestRoute } from '@/domain/goals/route';
import type { Profile } from '@/domain/profile';
import { scoringAge } from '@/domain/profile';
import { Award, awardFor, awardLadder, awardRules, scoreIppt, StationResults } from '@/domain/scoring/awards';
import { bandForAge, ScoringTable, Station, STATIONS } from '@/domain/scoring/table';
import { currentTable } from '@/domain/scoring/tables';
import { Stepper } from '@/ui/interactive';
import { Body, Button, Chip, ChipRow, Field, ListRow, ProgressBar, RowGroup, Screen, Segmented, Title } from '@/ui/kit';
import { enter, reflow, swapIn, useCountUp } from '@/ui/motion';
import { AWARD_LABEL, formatResult, formatValue, plural, STATION_LABEL } from '@/ui/labels';
import { colors, fonts, MAX_FONT_SCALE, radius, tabular } from '@/ui/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

/** A number that rolls from its last value to the new one (switching targets, logging a result). */
function RollingNumber({ value, style }: { value: number; style: object }) {
  return <Text style={style} maxFontSizeMultiplier={MAX_FONT_SCALE}>{String(useCountUp(value, 500))}</Text>;
}

const goalName = (g: GoalTarget) => (g.kind === 'award' ? AWARD_LABEL[g.award] : `${g.points}`);

const STEP: Record<Station, number> = { pushup: 1, situp: 1, run: 5 };

/** Try a better result on one station and see the total and award it would give. */
function WhatIf({ latest, age, table, profile }: { latest: StationResults; age: number; table: ScoringTable; profile: Profile }) {
  const [station, setStation] = useState<Station>('pushup');
  const [delta, setDelta] = useState(0);
  const base = latest[station];
  const now0 = scoreIppt(latest, age, table, profile, awardRules);
  if (base === null || 'error' in now0) return null;
  const isRun = station === 'run';
  const value = isRun ? Math.max(420, base - delta) : Math.min(100, base + delta);
  const result = scoreIppt({ ...latest, [station]: value }, age, table, profile, awardRules);
  if ('error' in result || result.total === null || !result.award) return null;
  const gained = (result.points[station] ?? 0) - (now0.points[station] ?? 0);
  const change = isRun ? `${delta} s faster` : `+${delta} reps`;
  const step = (dir: 1 | -1) => setDelta((d) => Math.max(0, d + dir * STEP[station]));
  const changed = !!now0.award && result.award !== now0.award;
  return (
    <Animated.View entering={enter(3)} style={styles.card}>
      <Text style={styles.cardHeading}>What if</Text>
      <Segmented
        accessibilityLabel="Station"
        options={STATIONS.map((s) => ({ value: s, label: STATION_LABEL[s] }))}
        value={station}
        onChange={(s) => { setStation(s); setDelta(0); }}
      />
      <Stepper
        value={value}
        onStep={step}
        display={isRun ? formatValue(station, value) : formatResult(station, value)}
        caption={delta === 0 ? 'Your latest' : `${change} · +${gained} pts`}
        canDown={delta > 0}
        canUp={isRun ? value > 420 : value < 100}
        labelDown={isRun ? 'Slower' : 'Fewer reps'}
        labelUp={isRun ? 'Faster' : 'More reps'}
      />
      <Animated.View key={`${result.award}`} entering={changed ? swapIn : undefined} style={[styles.whatIfBox, changed && styles.whatIfBoxUp]}>
        <Text style={[styles.whatIfResult, changed && styles.whatIfResultUp]}>{`Total ${result.total}/100 · ${AWARD_LABEL[result.award]}`}</Text>
      </Animated.View>
    </Animated.View>
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
    setCustomOpen(false);
    save({ kind: 'score', points });
  };

  const age = scoringAge(profile, today);
  const band = currentTable ? bandForAge(currentTable, age) : null;
  const progress = goal && currentTable ? goalProgress(goal, latest, age, currentTable, profile, awardRules) : null;
  const ok = progress && !('error' in progress) ? progress : null;
  const deadline = countdownTo(profile.ipptDate, today);
  const nowScore = currentTable ? scoreIppt(latest, age, currentTable, profile, awardRules) : null;
  const nowAward = nowScore && !('error' in nowScore) ? nowScore.award : null;
  const route = ok && ok.total !== null && !ok.met && band && currentTable && ok.pointsNeeded
    ? easiestRoute(ok.pointsNeeded, latest, currentTable, band.id)
    : null;
  const ladder = awardLadder(profile, awardRules).map((a) => a.award);
  // Award once every step of the route is done.
  const routeAward = route && nowScore && !('error' in nowScore) && nowScore.total !== null
    ? awardFor(
      Object.fromEntries(STATIONS.map((st) => [st, route.steps.find((r) => r.station === st)?.pointsAfter ?? nowScore.points[st] ?? 0])) as Record<Station, number>,
      profile, awardRules,
    )
    : null;

  const deadlineText = deadline.kind === 'upcoming' ? `${plural(deadline.days, 'day')} left`
    : deadline.kind === 'today' ? 'IPPT today'
    : deadline.kind === 'passed' ? 'IPPT date passed'
    : 'No IPPT date';

  return (
    <Screen variant="tab" gap={12}>
      <Title>Goals</Title>

      {ok && goal ? (
        <Animated.View entering={enter(0)} style={[styles.card, styles.headerCard]}>
          {ok.total === null ? <Text style={styles.status}>Log all three stations to see your gap.</Text>
            : ok.met ? <Text style={styles.status}>Target met</Text>
            : ok.pointsNeeded === 0 ? <Text style={styles.status}>Every station needs at least 1 point.</Text>
            : (
              <View style={styles.gapRow}>
                <View style={styles.gapValue} accessible accessibilityLabel={`${plural(ok.pointsNeeded ?? 0, 'point')} to ${goalName(goal)}`}>
                  <RollingNumber value={ok.pointsNeeded ?? 0} style={styles.gapNumber} />
                  <Text style={styles.gapCaption}>{`${ok.pointsNeeded === 1 ? 'point' : 'points'} to ${goalName(goal)}`}</Text>
                </View>
                <Text style={styles.small}>{deadlineText}</Text>
              </View>
            )}
          {ok.total !== null ? (
            <>
              <ProgressBar value={ok.total} max={ok.targetPoints} height={8} />
              <View style={styles.ends}>
                <Text style={styles.small}>{`Now ${ok.total}${nowAward ? ` · ${AWARD_LABEL[nowAward]}` : ''}`}</Text>
                <Text style={styles.small}>{`${goalName(goal)} ${ok.targetPoints}`}</Text>
              </View>
            </>
          ) : <Text style={styles.small}>{`Target ${ok.targetPoints} points · ${deadlineText}`}</Text>}
        </Animated.View>
      ) : null}

      {!goal ? <Body muted>Pick a target to see your gap.</Body> : null}
      {goal && !currentTable ? <Body muted>Scoring tables not added yet.</Body> : null}
      {progress && 'error' in progress ? <Body muted>{"We can't score your age group yet."}</Body> : null}

      <Animated.View entering={enter(1)} layout={reflow} style={styles.card}>
        <Text style={styles.cardHeading}>Target</Text>
        <ChipRow>
          {[...ladder].reverse().map((a: Exclude<Award, 'fail'>) => (
            <Chip key={a} height={36} label={AWARD_LABEL[a]} selected={!customOpen && goal?.kind === 'award' && goal.award === a}
              onPress={() => { setCustomOpen(false); save({ kind: 'award', award: a }); }} />
          ))}
          <Chip height={36} label="Custom score" selected={customOpen || goal?.kind === 'score'} onPress={() => setCustomOpen(true)} />
        </ChipRow>
        {customOpen ? (
          <Animated.View entering={swapIn} style={{ gap: 10 }}>
            <Field label="Custom score" value={customText} onChangeText={(t) => { setCustomText(t); setCustomError(undefined); }} error={customError} keyboardType="number-pad" placeholder="70" onSubmitEditing={saveCustom} />
            <Button secondary label="Set target" onPress={saveCustom} />
          </Animated.View>
        ) : null}
      </Animated.View>

      {route && goal && ok && ok.total !== null ? (
        <Animated.View entering={enter(2)} layout={reflow} style={styles.card}>
          <Text style={styles.cardHeading}>{`Easiest route to ${goalName(goal)}`}</Text>
          {route.steps.map((s) => (
            <View key={s.station} style={styles.routeRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.routeStation}>{STATION_LABEL[s.station]}</Text>
                <Text style={styles.small}>{`${formatValue(s.station, s.from)} → ${formatValue(s.station, s.to)}${s.station === 'run' ? '' : ' reps'}`}</Text>
              </View>
              <Text style={styles.gain}>{`+${s.pointsGained} pts`}</Text>
            </View>
          ))}
          <View style={styles.rule} />
          <View style={styles.routeRow}>
            <Text style={[styles.routeStation, { flex: 1, fontFamily: fonts.semibold }]}>Together</Text>
            <Text style={[styles.routeStation, { fontFamily: fonts.semibold }]}>
              {`${ok.total + route.pointsGained}${routeAward ? ` · ${AWARD_LABEL[routeAward]}` : ''}`}
            </Text>
          </View>
        </Animated.View>
      ) : null}

      {ok && ok.total !== null && currentTable ? <WhatIf latest={latest} age={age} table={currentTable} profile={profile} /> : null}

      <RowGroup>
        <ListRow first label="Score tables by age" onPress={() => router.push('/tables')} />
      </RowGroup>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headerCard: { borderRadius: 18, gap: 10 },
  cardHeading: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  status: { fontSize: 26, fontFamily: fonts.displaySemi, color: colors.text },
  gapRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  gapValue: { flexDirection: 'row', alignItems: 'baseline', gap: 8, flexShrink: 1 },
  gapNumber: { fontSize: 64, lineHeight: 60, fontFamily: fonts.display, color: colors.text, ...tabular },
  gapCaption: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  ends: { flexDirection: 'row', justifyContent: 'space-between' },
  small: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, ...tabular },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  routeStation: { fontFamily: fonts.medium, fontSize: 15, color: colors.text, ...tabular },
  gain: { fontFamily: fonts.semibold, fontSize: 15, color: colors.accent, ...tabular },
  rule: { height: 1, backgroundColor: colors.border },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12 },
  whatIfBox: { borderRadius: 12, paddingVertical: 10, alignItems: 'center', backgroundColor: colors.chip },
  whatIfBoxUp: { backgroundColor: '#2A2416', borderWidth: 1, borderColor: colors.goldDark },
  whatIfResult: { fontFamily: fonts.medium, fontSize: 15, color: colors.text, textAlign: 'center', ...tabular },
  whatIfResultUp: { fontFamily: fonts.semibold, color: colors.gold },
});
