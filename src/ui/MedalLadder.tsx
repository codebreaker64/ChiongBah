import type { Award } from '@/domain/scoring/awards';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  interpolateColor, SharedValue, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming,
} from 'react-native-reanimated';
import { haptic } from './haptics';
import { DURATION, SPRING, useFollow, useMotionOK } from './motion';
import { colors, fonts, MAX_FONT_SCALE } from './theme';

type Tier = Exclude<Award, 'fail'>;
export type Rung = { award: Tier; points: number };

const SHORT: Record<Award, string> = { fail: 'Below', pass: 'Pass', pass_incentive: 'Incentive', silver: 'Silver', gold: 'Gold' };

/** The colour a tier fills with: the two passes in accent green, then the medal metals. */
export const TIER_COLOR: Record<Award, string> = {
  fail: colors.accentDark, pass: colors.accent, pass_incentive: colors.accent, silver: colors.silver, gold: colors.gold,
};

/**
 * Where `total` sits on the ladder, in segment units: segment i spans [i, i+1). Equal-width
 * segments keep every label readable, even though Silver to Gold is only 10 points.
 */
export function ladderPosition(total: number, rungs: Rung[]): number {
  const edges = [0, ...rungs.map((r) => r.points), 101];
  for (let i = 0; i < edges.length - 1; i++) {
    if (total < edges[i + 1]) return i + (total - edges[i]) / (edges[i + 1] - edges[i]);
  }
  return edges.length - 1;
}

/** The highest award the user reached on this ladder in this app session, to notice a step up. */
let lastSeenAward: Award | null = null;

function Segment({ index, tier, p, lit, target }: { index: number; tier: Award; p: SharedValue<number>; lit: boolean; target: boolean }) {
  const fill = useAnimatedStyle(() => {
    const f = Math.max(0, Math.min(1, p.value - index));
    return { transform: [{ scaleX: f }], opacity: f > 0 ? 1 : 0 };
  });
  return (
    <View style={styles.seg}>
      <View style={[styles.rail, target && styles.railTarget]}>
        <Animated.View style={[styles.fill, { backgroundColor: TIER_COLOR[tier], transformOrigin: 'left' }, fill]} />
      </View>
      <Text
        style={[styles.segLabel, lit && { color: colors.text, fontFamily: fonts.semibold }, target && !lit && { color: colors.gold }]}
        numberOfLines={1}
        maxFontSizeMultiplier={1.15}
      >
        {SHORT[tier]}
      </Text>
    </View>
  );
}

/**
 * The award ladder under the score: one segment per award, filling left to right to where the
 * score sits, each in its medal colour. The goal's segment carries a gold outline. When a new
 * result lifts the user into a higher award, the award name pops and the phone confirms it.
 */
export function MedalLadder({ total, award, rungs, targetAward }: { total: number; award: Award; rungs: Rung[]; targetAward: Tier | null }) {
  const tiers: Award[] = ['fail', ...rungs.map((r) => r.award)];
  const pos = ladderPosition(total, rungs);
  const p = useFollow(pos, { duration: DURATION.fill + 300, delay: 120 });
  const reached = tiers.indexOf(award);
  const ok = useMotionOK();
  const [stepUp] = useState(() => lastSeenAward !== null && tiers.indexOf(lastSeenAward) < reached);
  const scale = useSharedValue(1);
  useEffect(() => {
    if (stepUp) {
      haptic.success();
      // The marker lands, then swells once: the step up is the moment this screen is built around.
      if (ok) scale.set(withDelay(DURATION.fill + 300, withSequence(withTiming(1.35, { duration: 180 }), withSpring(1, SPRING.pop))));
    }
    lastSeenAward = award;
  }, [award, stepUp, ok, scale]);

  const marker = useAnimatedStyle(() => ({ left: `${(p.value / tiers.length) * 100}%` }));
  const badge = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityLabel={`${SHORT[award] === 'Below' ? 'Below pass' : SHORT[award]}. ${tiers.slice(1).map((t, i) => `${SHORT[t]} at ${rungs[i].points}`).join(', ')}.`}
    >
      <View style={styles.row}>
        {tiers.map((t, i) => (
          <Segment key={t} index={i} tier={t} p={p} lit={i <= reached} target={t === targetAward} />
        ))}
        <Animated.View pointerEvents="none" style={[styles.markerBox, marker]}>
          <Animated.View style={[styles.marker, { borderColor: TIER_COLOR[award] }, badge]} />
        </Animated.View>
      </View>
    </View>
  );
}

/** The award as a tinted pill: medal-coloured dot and name. */
export function AwardPill({ award }: { award: Award }) {
  const t = useFollow(1, { duration: DURATION.pop, delay: 500 });
  const style = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ translateY: (1 - t.value) * 6 }] }));
  const tint = useFollow(award === 'gold' ? 1 : 0, { duration: 1 });
  const bg = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(tint.value, [0, 1], [colors.surfaceSelected, '#2A2416']) }));
  return (
    <Animated.View style={[styles.pill, bg, style]}>
      <View style={[styles.dot, { backgroundColor: TIER_COLOR[award] }]} />
      <Text style={[styles.pillText, { color: award === 'fail' ? colors.danger : colors.text }]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
        {award === 'fail' ? 'Below pass' : award === 'pass_incentive' ? 'Pass with Incentive' : SHORT[award]}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingTop: 10 },
  row: { flexDirection: 'row', gap: 4 },
  seg: { flex: 1, gap: 8 },
  rail: { height: 10, borderRadius: 5, backgroundColor: colors.chip, overflow: 'hidden' },
  railTarget: { borderWidth: 1, borderColor: colors.gold },
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 5 },
  segLabel: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  markerBox: { position: 'absolute', top: -5, width: 0, alignItems: 'center' },
  marker: { width: 20, height: 20, marginLeft: -10, borderRadius: 10, borderWidth: 4, backgroundColor: colors.bg },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingHorizontal: 12, height: 32, borderRadius: 16 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  pillText: { fontFamily: fonts.semibold, fontSize: 15 },
});
