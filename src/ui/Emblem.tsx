import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path, Polygon } from 'react-native-svg';
import { DURATION, EASE, EASE_STANDARD, useMotionOK } from './motion';
import { colors } from './theme';

/**
 * The Chiong Bah mark: a gold medal on a short V-shaped green ribbon, with two generic rank
 * chevrons on its face (redesign spec section 3.1). Drawn in a 120 × 140 box.
 * No official crests, insignia, weapons or targets.
 */
const VIEW_W = 120;
const VIEW_H = 140;
const DISC = { cx: 60, cy: 92, r: 38 };

function Ribbon() {
  return (
    <>
      <Polygon points="30,4 52,4 70,62 50,66" fill={colors.accent} />
      <Polygon points="90,4 68,4 50,62 70,66" fill={colors.accentDark} />
    </>
  );
}

function Disc() {
  return (
    <>
      <Circle cx={DISC.cx} cy={DISC.cy} r={DISC.r} fill={colors.gold} />
      <Circle cx={DISC.cx} cy={DISC.cy} r={30} fill="none" stroke={colors.goldDark} strokeWidth={2.5} />
      <Path
        d="M44 92 L60 76 L76 92 M44 106 L60 90 L76 106"
        fill="none"
        stroke={colors.bg}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  );
}

type Props = {
  /** Height in px; width follows the 120 × 140 proportions. */
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
  const ribbonStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (ribbon.value - 1) * 10 * s }] }));
  // The band starts left of the disc and leaves past its right edge; reduced motion parks it off the disc.
  const glintStyle = useAnimatedStyle(() => ({ transform: [{ translateX: glint.value * 200 * s }] }));

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
            <Polygon points="-30,40 -12,40 -42,150 -60,150" fill={colors.goldShine} opacity={0.6} />
          </Svg>
        </Animated.View>
      </View>
    </Animated.View>
  );
}
