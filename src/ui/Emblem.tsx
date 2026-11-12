import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Path, Polygon } from 'react-native-svg';
import { MEDAL_DISC as DISC, MEDAL_GOLD, MEDAL_VIEW, RIBBON_DARK, RIBBON_LIGHT } from './emblemPaths';
import { DURATION, EASE, EASE_STANDARD, useMotionOK } from './motion';
import { colors } from './theme';

/**
 * The Chiong Bah mark: a gold medal on a short V-shaped green ribbon, with a runner in mid-stride
 * cut out of its face. Drawn in a 1184 × 1720 box (see emblemPaths.ts).
 * No official crests, insignia, weapons or targets.
 */
const VIEW_W = MEDAL_VIEW.w;
const VIEW_H = MEDAL_VIEW.h;

function Ribbon() {
  return (
    <>
      <Path d={RIBBON_DARK} fill={colors.accentDark} fillRule="evenodd" />
      <Path d={RIBBON_LIGHT} fill={colors.accent} fillRule="evenodd" />
    </>
  );
}

function Disc() {
  return <Path d={MEDAL_GOLD} fill={colors.gold} fillRule="evenodd" />;
}

type Props = {
  /** Height in px; width follows the medal's proportions. */
  size?: number;
  /** Runs the splash entrance: medal rises, ribbon drops, a glint sweeps the disc. */
  animated?: boolean;
  accessibilityLabel?: string;
};

export function Emblem({ size = 96, animated = false, accessibilityLabel }: Props) {
  const height = size;
  const width = (size * VIEW_W) / VIEW_H;
  const a11y = accessibilityLabel
    ? { accessible: true, accessibilityRole: 'image' as const, accessibilityLabel }
    : { accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' as const };

  if (!animated) {
    return (
      <View style={{ width, height, alignSelf: 'center' }} {...a11y}>
        <Svg width={width} height={height} viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}>
          <Ribbon />
          <Disc />
        </Svg>
      </View>
    );
  }
  return <AnimatedMedal width={width} height={height} a11y={a11y} />;
}

function AnimatedMedal({ width, height, a11y }: { width: number; height: number; a11y: object }) {
  const ok = useMotionOK();
  const s = height / VIEW_H;
  const medal = useSharedValue(ok ? 0 : 1);
  const ribbon = useSharedValue(ok ? 0 : 1);
  const glint = useSharedValue(ok ? 0 : 1);

  useEffect(() => {
    if (!ok) { medal.value = 1; ribbon.value = 1; glint.value = 1; return; }
    medal.value = withTiming(1, { duration: DURATION.medal, easing: EASE });
    ribbon.value = withDelay(80, withTiming(1, { duration: DURATION.medal, easing: EASE }));
    glint.value = withDelay(550, withTiming(1, { duration: DURATION.glint, easing: EASE_STANDARD }));
  }, [ok, medal, ribbon, glint]);

  const medalStyle = useAnimatedStyle(() => ({
    opacity: medal.value,
    transform: [{ translateY: (1 - medal.value) * 14 }, { scale: 0.92 + 0.08 * medal.value }],
  }));
  const ribbonStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (ribbon.value - 1) * 120 * s }] }));
  // The band starts left of the disc and leaves past its right edge; reduced motion parks it off the disc.
  const glintStyle = useAnimatedStyle(() => ({ transform: [{ translateX: glint.value * 2100 * s }] }));

  const disc = { left: (DISC.cx - DISC.r) * s, top: (DISC.cy - DISC.r) * s, size: DISC.r * 2 * s };
  const viewBox = `0 0 ${VIEW_W} ${VIEW_H}`;
  return (
    <Animated.View style={[{ width, height, alignSelf: 'center' }, medalStyle]} {...a11y}>
      <Animated.View style={[StyleSheet.absoluteFill, ribbonStyle]}>
        <Svg width={width} height={height} viewBox={viewBox}><Ribbon /></Svg>
      </Animated.View>
      <Svg style={StyleSheet.absoluteFill} width={width} height={height} viewBox={viewBox}><Disc /></Svg>
      <View
        pointerEvents="none"
        style={{ position: 'absolute', left: disc.left, top: disc.top, width: disc.size, height: disc.size, borderRadius: disc.size / 2, overflow: 'hidden' }}
      >
        <Animated.View style={[{ position: 'absolute', left: -disc.left, top: -disc.top, width, height }, glintStyle]}>
          <Svg width={width} height={height} viewBox={viewBox}>
            <Polygon points="-360,500 -150,500 -520,1800 -730,1800" fill={colors.goldShine} opacity={0.6} />
          </Svg>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
