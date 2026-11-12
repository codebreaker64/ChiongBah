import { useRepositories } from '@/app-state/RepositoriesContext';
import { useAppData } from '@/app-state/useAppData';
import { homeCountdowns } from '@/domain/countdowns/countdowns';
import { scoringAge } from '@/domain/profile';
import { stationGap } from '@/domain/goals/goals';
import { awardLadder, awardRules, nextAward, scoreIppt } from '@/domain/scoring/awards';
import { bandForAge, MAX_POINTS, Station, STATIONS } from '@/domain/scoring/table';
import { currentTable } from '@/domain/scoring/tables';
import { Icon } from '@/ui/Icon';
import { Body, Button, Caption, Card, Header, Press, ProgressBar, Screen } from '@/ui/kit';
import { AWARD_LABEL, formatResult, joinWithAnd, plural, STATION_LABEL, STATION_NOUN } from '@/ui/labels';
import { AwardPill, MedalLadder } from '@/ui/MedalLadder';
import { enter, reflow, swapIn, swapOut, useCountUp, useFollow } from '@/ui/motion';
import { colors, fonts, MAX_FONT_SCALE, radius, tabular } from '@/ui/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

/** A number that counts up to its value when it first appears. */
function CountUp({ value, style }: { value: number; style: object }) {
  return <Text style={style} maxFontSizeMultiplier={MAX_FONT_SCALE}>{String(useCountUp(value))}</Text>;
}

/** Days left as a large number over 'days to IPPT'. Read out as one sentence. */
function CountdownTile({ days, label, first }: { days: number; label: string; first: boolean }) {
  return (
    <View style={[styles.tile, !first && styles.tileDivider]} accessible accessibilityLabel={`${plural(days, 'day')} to ${label}`}>
      <CountUp value={days} style={styles.tileNumber} />
      <Text style={styles.tileCaption}>{`${days === 1 ? 'day' : 'days'} to ${label}`}</Text>
    </View>
  );
}

/**
 * One station on Home: result, points and a bar. Tapping it opens the next cheapest step for
 * that station and shortcuts to log it, so the score card is also where training starts.
 */
function StationRow({ station, value, points, max, delay, next, open, onToggle, first }: {
  station: Station;
  value: number | null;
  points: number | null;
  max: number;
  delay: number;
  next: { target: number; pointsAfter: number } | null;
  open: boolean;
  onToggle: () => void;
  first: boolean;
}) {
  const turn = useFollow(open ? 1 : 0, { duration: 260, initial: 0 });
  const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${turn.value * 180}deg` }] }));
  return (
    <Animated.View layout={reflow} style={[styles.station, !first && styles.stationDivider]}>
      <Press accessibilityRole="button" accessibilityState={{ expanded: open }} accessibilityHint={open ? 'Hides the next step' : 'Shows the next step for this station'} onPress={onToggle} scaleTo={1} style={styles.stationPress}>
        <View style={styles.stationRow}>
          <Text style={styles.stationText}>{STATION_LABEL[station]}</Text>
          <View style={styles.stationValues}>
            <Text style={styles.stationText}>{value === null ? '—' : formatResult(station, value)}</Text>
            {points !== null ? <Text style={[styles.stationText, styles.points]}>{`${points} pts`}</Text> : null}
            <Animated.View style={chevron}><Icon name="chevronDown" size={18} color={colors.muted} /></Animated.View>
          </View>
        </View>
        {points !== null ? <ProgressBar value={points} max={max} delay={delay} /> : null}
      </Press>
      {open ? (
        <Animated.View entering={swapIn} exiting={swapOut} style={styles.stationMore}>
          <Text style={styles.nextText}>
            {next && value !== null
              ? `Next: ${formatResult(station, next.target)} for ${next.pointsAfter} pts (+${next.pointsAfter - (points ?? 0)})`
              : value === null ? `No ${STATION_NOUN[station]} logged yet.` : 'Maximum points. Keep it there.'}
          </Text>
          <View style={styles.stationActions}>
            <Button secondary icon="plus" label="Log" onPress={() => router.push({ pathname: '/log/new', params: { station } })} />
            {station !== 'run' ? <Button variant="tertiary" icon="camera" label="Camera" onPress={() => router.push('/camera')} /> : null}
          </View>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

function Big({ children }: { children: string }) {
  return <Text style={styles.big}>{children}</Text>;
}

export default function Home() {
  const repos = useRepositories();
  const { today, profile, latest, goal, refresh } = useAppData();
  const [openStation, setOpenStation] = useState<Station | null>(null);
  if (!profile) return null;
  const { ordRod, ippt } = homeCountdowns(profile, today);

  const age = scoringAge(profile, today);
  const band = currentTable ? bandForAge(currentTable, age) : null;
  const score = currentTable ? scoreIppt(latest, age, currentTable, profile, awardRules) : null;
  const missing = STATIONS.filter((s) => latest[s] === null);
  const scored = score && !('error' in score) ? score : null;
  const total = scored?.total ?? null;
  const next = total !== null && scored?.award !== 'fail' ? nextAward(total, profile, awardRules) : null;

  const upcoming: { days: number; label: string }[] = [];
  if (ippt.kind === 'upcoming') upcoming.push({ days: ippt.days, label: 'IPPT' });
  if (ordRod && ordRod.countdown.kind === 'upcoming') upcoming.push({ days: ordRod.countdown.days, label: ordRod.label });

  const goalAward = goal?.kind === 'award' ? goal.award : null;
  const gaps = band && currentTable ? STATIONS.map((s) => stationGap(currentTable!, band.id, s, latest[s])) : null;

  return (
    <Screen variant="tab" onRefresh={refresh} fab={{ label: 'Add result', onPress: () => router.push('/log/new') }}>
      <Header title="Chiong Bah" />

      <Animated.View entering={enter(0)} style={styles.hero}>
        <Text style={styles.cardTitle}>IPPT score</Text>
        <View style={styles.scoreRow}>
          <View style={styles.scoreValue} accessible accessibilityLabel={total !== null ? `Total ${total}/100` : 'No total yet'}>
            {total !== null ? <CountUp value={total} style={styles.scoreNumber} /> : <Text style={styles.scoreNumber}>—</Text>}
            <Text style={styles.scoreMax}>/100</Text>
          </View>
        </View>
        {total !== null && scored?.award ? (
          <View style={styles.awardRow}>
            <AwardPill award={scored.award} />
            {next ? (
              <Press accessibilityRole="link" onPress={() => router.push('/goals')} hitSlop={10} style={styles.toNextLink}>
                <Text style={styles.toNext}>{`${plural(next.pointsToGo, 'point')} to ${AWARD_LABEL[next.award]}`}</Text>
                <Icon name="chevron" size={16} color={colors.accent} />
              </Press>
            ) : null}
          </View>
        ) : null}
        {total !== null && scored?.award ? (
          <MedalLadder total={total} award={scored.award} rungs={awardLadder(profile, awardRules)} targetAward={goalAward} />
        ) : null}
        {!currentTable ? <Body muted small>Scoring tables not added yet.</Body> : null}
        {score && 'error' in score ? <Body muted small>{"We can't score your age group yet."}</Body> : null}
        {scored && total === null ? (
          <Body muted small>{`Log ${joinWithAnd(missing.map((s) => STATION_NOUN[s]))} to see your total.`}</Body>
        ) : null}
      </Animated.View>

      <Animated.View entering={enter(1)} style={styles.stations}>
        {STATIONS.map((s, i) => {
          const gap = gaps?.find((g) => g.station === s);
          return (
            <StationRow
              key={s}
              first={i === 0}
              station={s}
              value={latest[s]}
              points={scored ? scored.points[s] : null}
              max={MAX_POINTS[s]}
              delay={300 + i * 80}
              next={gap?.next[0] ?? null}
              open={openStation === s}
              onToggle={() => setOpenStation(openStation === s ? null : s)}
            />
          );
        })}
      </Animated.View>
      {total !== null ? <Caption italic>{band ? `Practice estimate · age group ${band.minAge} to ${band.maxAge}` : 'Practice estimate'}</Caption> : null}

      {upcoming.length > 0 ? (
        <Animated.View entering={enter(2)} style={styles.tiles}>
          {upcoming.map((u, i) => <CountdownTile key={u.label} days={u.days} label={u.label} first={i === 0} />)}
        </Animated.View>
      ) : null}

      {ippt.kind !== 'upcoming' ? (
        <Card>
          {ippt.kind === 'today' ? <Big>IPPT today. Good luck!</Big> : null}
          {ippt.kind === 'not_set' ? <Button secondary label="Set your IPPT date" onPress={() => router.push({ pathname: '/onboarding/[step]', params: { step: 'ippt', edit: '1' } })} /> : null}
          {ippt.kind === 'passed' ? (
            <>
              <Body>Your IPPT date has passed. Log your result and set your next date.</Body>
              <Button label="Log result" onPress={() => router.push('/log/new')} />
              <Button secondary label="Set next date" onPress={() => router.push({ pathname: '/onboarding/[step]', params: { step: 'ippt', edit: '1' } })} />
            </>
          ) : null}
        </Card>
      ) : null}

      {ordRod && ordRod.countdown.kind !== 'upcoming' ? (
        <Card>
          {ordRod.countdown.kind === 'today' ? <Big>{`${ordRod.label} today!`}</Big> : null}
          {ordRod.countdown.kind === 'not_set' ? <Button secondary label={`Set your ${ordRod.label} date`} onPress={() => router.push({ pathname: '/onboarding/[step]', params: { step: 'ordRod', edit: '1' } })} /> : null}
          {ordRod.countdown.kind === 'passed' ? (
            <>
              <Big>{`Congratulations on your ${ordRod.label}!`}</Big>
              <Button
                label="Switch to reservist"
                onPress={() => {
                  repos.profile.save({ ...profile, status: 'nsman', ordRodDate: null });
                  refresh();
                }}
              />
            </>
          ) : null}
        </Card>
      ) : null}

      <Press accessibilityRole="button" feedback="tap" onPress={() => router.push('/camera')} style={styles.cameraCard}>
        <View style={styles.cameraIcon}><Icon name="camera" color={colors.accent} /></View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.cameraTitle}>Count reps with camera</Text>
          <Text style={styles.cameraDetail}>Push-ups or sit-ups, timed for 1 minute</Text>
        </View>
        <Icon name="chevron" size={20} color={colors.muted} />
      </Press>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { gap: 10, paddingTop: 4, paddingBottom: 6 },
  big: { fontSize: 26, fontFamily: fonts.displaySemi, color: colors.text },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.muted },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 },
  scoreValue: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  scoreNumber: { fontSize: 112, lineHeight: 108, fontFamily: fonts.display, color: colors.text, ...tabular },
  scoreMax: { fontSize: 28, fontFamily: fonts.displaySemi, color: colors.muted },
  awardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' },
  toNextLink: { flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 32 },
  toNext: { fontFamily: fonts.semibold, fontSize: 14, color: colors.accent, ...tabular },
  stations: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  station: { paddingHorizontal: 16 },
  stationDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  stationPress: { gap: 10, paddingVertical: 14 },
  stationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stationText: { fontFamily: fonts.body, fontSize: 15, color: colors.text, ...tabular },
  stationValues: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  points: { color: colors.muted },
  stationMore: { gap: 12, paddingBottom: 16 },
  nextText: { fontFamily: fonts.medium, fontSize: 15, color: colors.text, ...tabular },
  stationActions: { flexDirection: 'row', gap: 10 },
  tiles: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border },
  tile: { flex: 1, paddingVertical: 14, paddingHorizontal: 16, gap: 2 },
  tileDivider: { borderLeftWidth: 1, borderLeftColor: colors.border },
  tileNumber: { fontSize: 44, lineHeight: 46, fontFamily: fonts.display, color: colors.text, ...tabular },
  tileCaption: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  cameraCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, paddingVertical: 14, paddingHorizontal: 16 },
  cameraIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  cameraTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  cameraDetail: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
});
