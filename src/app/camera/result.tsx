import { poseSource } from '@/adapters/pose/poseSource';
import { useCameraSession } from '@/app-state/CameraSession';
import { lockPortrait } from '@/app-state/orientation';
import { useRepositories } from '@/app-state/RepositoriesContext';
import { useAppData } from '@/app-state/useAppData';
import { scoringAge } from '@/domain/profile';
import { barHeights, repsPer10s, summariseNoCounts, validCount } from '@/domain/reps/pacing';
import { ruleVersion } from '@/domain/reps/ruleConfig';
import { awardRules, scoreIppt } from '@/domain/scoring/awards';
import { bandForAge, stationPoints } from '@/domain/scoring/table';
import { currentTable } from '@/domain/scoring/tables';
import { Button, Caption, Card, IconButton, Screen } from '@/ui/kit';
import { noCountSentence, STATION_LABEL } from '@/ui/labels';
import { DURATION, useEnter } from '@/ui/motion';
import { colors, fonts, MAX_FONT_SCALE, radius, tabular } from '@/ui/theme';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

const BAR_MAX = 64;

/** One pacing bar, rising from the bottom after a short stagger. */
function Bar({ value, height, index }: { value: number; height: number; index: number }) {
  const t = useEnter({ duration: DURATION.bar, delay: 100 + index * 50 });
  const px = Math.max(height * BAR_MAX, value > 0 ? 4 : 0);
  // Scale about the bottom edge: shift down by half the lost height.
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: (px * (1 - t.value)) / 2 }, { scaleY: t.value }] }));
  return (
    <View style={styles.barCol}>
      <Text style={styles.barValue}>{String(value)}</Text>
      <Animated.View style={[styles.bar, { height: px }, style]} />
    </View>
  );
}

/** "New best" badge that pops in. */
function NewBest() {
  const t = useEnter({ duration: DURATION.pop, delay: 500 });
  const style = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ scale: 0.85 + 0.15 * t.value }] }));
  return (
    <Animated.View style={[styles.badge, style]} accessibilityLiveRegion="polite">
      <Text style={styles.badgeText}>New best</Text>
    </Animated.View>
  );
}

/** Camera result (redesign spec section 7.14). Nothing is saved until "Save to log". */
export default function CameraResult() {
  const repos = useRepositories();
  const { today, profile, latest } = useAppData();
  const { result, setResult } = useCameraSession();
  const [correction, setCorrection] = useState(0);
  const best = useMemo(() => repos.sessions.bestResults(), [repos]);

  useFocusEffect(useCallback(() => { lockPortrait(); }, []));

  if (!result) return <Redirect href="/camera" />;
  const { station, reps } = result;
  const counted = validCount(reps);
  const count = Math.max(0, Math.min(100, counted + correction));
  const corrected = count !== counted;

  const band = profile && currentTable ? bandForAge(currentTable, scoringAge(profile, today)) : null;
  const pts = (n: number) => (band && currentTable ? stationPoints(currentTable, band.id, station, n) : null);
  const points = pts(count);
  const prevBest = best[station];
  const isBest = prevBest !== null && count > prevBest;
  const total = profile && currentTable && isBest
    ? scoreIppt({ ...latest, [station]: count }, scoringAge(profile, today), currentTable, profile, awardRules)
    : null;
  const totalNow = total && !('error' in total) ? total.total : null;

  const subline = prevBest === null ? 'Your first result for this station.'
    : isBest ? `Up from ${prevBest}${pts(prevBest) !== null ? ` (${pts(prevBest)} pts)` : ''}.${totalNow !== null ? ` Your total would be ${totalNow}.` : ''}`
    : `Your best is ${prevBest}${pts(prevBest) !== null ? ` (${pts(prevBest)} pts)` : ''}.`;

  const buckets = repsPer10s(reps);
  const heights = barHeights(buckets);
  const noCounts = summariseNoCounts(reps);
  const summary = noCountSentence(noCounts);

  const save = () => {
    const formFaults = reps.filter((r) => r.outcome.kind === 'no_count_form').length;
    repos.sessions.add({
      station, source: 'camera_test', startedAt: result.startedAt,
      validCount: count, noCountForm: formFaults, noCountUnclear: noCounts.total - formFaults,
      runTimeS: null, runDistanceM: null, adjusted: corrected, externalId: null,
      ruleConfigVersion: ruleVersion(station), modelVersion: poseSource.modelVersion ?? 'manual-tap',
    });
    setResult(null);
    router.dismissTo('/log');
  };
  const tryAgain = () => { setResult(null); router.replace('/camera/frame'); };
  const discard = () => { setResult(null); router.dismissTo('/'); };

  const footer = (
    <>
      <Button label="Save to log" onPress={save} />
      <View style={styles.twoUp}>
        <View style={{ flex: 1 }}><Button secondary label="Try again" onPress={tryAgain} /></View>
        <View style={{ flex: 1 }}><Button variant="tertiary" label="Discard" onPress={discard} /></View>
      </View>
    </>
  );

  return (
    <Screen gap={16} footer={footer}>
      <View style={{ minHeight: 30, alignItems: 'flex-start' }}>{isBest ? <NewBest /> : null}</View>
      <View style={{ gap: 2 }}>
        <Text style={styles.kicker}>{`${STATION_LABEL[station]} in 1 minute`}</Text>
        <View style={styles.countRow} accessible accessibilityLabel={`${count} reps${points !== null ? `, ${points} points` : ''}`} accessibilityLiveRegion="polite">
          <Text style={styles.count} maxFontSizeMultiplier={MAX_FONT_SCALE}>{String(count)}</Text>
          {points !== null ? <Text style={styles.points} maxFontSizeMultiplier={MAX_FONT_SCALE}>{`${points} pts`}</Text> : null}
        </View>
        <Text style={styles.subline}>{subline}</Text>
      </View>

      <Card>
        <Text style={styles.cardTitle}>Reps every 10 seconds</Text>
        <View style={styles.bars} accessible accessibilityLabel={`Reps every 10 seconds: ${buckets.join(', ')}`}>
          {buckets.map((v, i) => <Bar key={i} value={v} height={heights[i]} index={i} />)}
        </View>
        {summary ? <Caption>{summary}</Caption> : <Caption>Every rep counted.</Caption>}
      </Card>

      <View style={styles.correct}>
        <View style={{ gap: 2, flex: 1 }}>
          <Text style={styles.correctTitle}>Count looks off?</Text>
          <Text style={styles.correctDetail}>{corrected ? `Corrected from ${counted}` : 'Fix it before saving'}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <IconButton icon="minus" variant="outline" iconSize={18} strokeWidth={2.4} label="One fewer rep" onPress={() => setCorrection((c) => (counted + c > 0 ? c - 1 : c))} />
          <IconButton icon="plus" variant="outline" iconSize={18} strokeWidth={2.4} label="One more rep" onPress={() => setCorrection((c) => (counted + c < 100 ? c + 1 : c))} />
        </View>
      </View>
      <Caption italic>Camera count · practice estimate</Caption>
    </Screen>
  );
}

const styles = StyleSheet.create({
  badge: { height: 30, paddingHorizontal: 12, borderRadius: 15, justifyContent: 'center', backgroundColor: colors.surfaceSelected, borderWidth: 1, borderColor: colors.gold },
  badgeText: { fontFamily: fonts.semibold, fontSize: 14, color: colors.gold },
  kicker: { fontFamily: fonts.medium, fontSize: 16, color: colors.muted },
  countRow: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  count: { fontFamily: fonts.display, fontSize: 112, lineHeight: 112, color: colors.text, ...tabular },
  points: { fontFamily: fonts.display, fontSize: 34, color: colors.accent, ...tabular },
  subline: { fontFamily: fonts.body, fontSize: 15, color: colors.text, ...tabular },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text },
  bars: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', height: 96 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barValue: { fontFamily: fonts.body, fontSize: 13, color: colors.text, ...tabular },
  bar: { alignSelf: 'stretch', borderRadius: 6, backgroundColor: colors.accent },
  correct: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.row, paddingVertical: 10, paddingLeft: 16, paddingRight: 12 },
  correctTitle: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  correctDetail: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  twoUp: { flexDirection: 'row', gap: 10 },
});
