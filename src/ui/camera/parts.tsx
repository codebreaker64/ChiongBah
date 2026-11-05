import type { CheckResult, CheckStatus } from '@/domain/reps/frameChecks';
import { LM, PoseFrame } from '@/domain/pose/types';
import type { CameraStation } from '@/domain/reps/types';
import { CameraView } from 'expo-camera';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, G, Path, Rect } from 'react-native-svg';
import { Icon } from '../Icon';
import { CHECK_LABEL } from '../labels';
import { usePulse } from '../motion';
import { colors, fonts, MAX_FONT_SCALE } from '../theme';

/* ───────────────────────── Setup illustration (choose station) ───────────────────────── */

const ILLUSTRATION_LABEL: Record<CameraStation, string> = {
  pushup: 'Phone propped on the floor, about 2 metres to the side of a person doing push-ups',
  situp: 'Phone propped on the floor, about 2 metres to the side of a person doing sit-ups',
};

/** The phone on the floor, side on to a person in position, with the 2 m distance marked. */
export function SetupIllustration({ station, width }: { station: CameraStation; width: number }) {
  const height = (width * 128) / 332;
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={ILLUSTRATION_LABEL[station]}>
      <Svg width={width} height={height} viewBox="0 0 332 128">
        <Path d="M12 112h308" stroke={colors.border} strokeWidth={2} />
        <Rect x={20} y={78} width={40} height={22} rx={4} fill="none" stroke={colors.accent} strokeWidth={2.5} transform="rotate(-10 40 89)" />
        <Path d="M46 104l10 8" stroke={colors.accent} strokeWidth={2.5} strokeLinecap="round" />
        <Path d={station === 'pushup' ? 'M58 80 L150 66' : 'M58 80 L150 58'} stroke={colors.accent} strokeWidth={1.5} strokeDasharray="4 5" />
        <Path d="M58 92 L150 112" stroke={colors.accent} strokeWidth={1.5} strokeDasharray="4 5" />
        <G stroke={colors.text} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none">
          {station === 'pushup' ? (
            <>
              <Circle cx={292} cy={70} r={9} />
              <Path d="M281 76 L180 98" />
              <Path d="M272 80 L274 110" />
              <Path d="M180 98 L172 110" />
            </>
          ) : (
            <>
              <Circle cx={168} cy={52} r={9} />
              <Path d="M176 62 L214 106" />
              <Path d="M214 106 L252 72 L288 108" />
              <Path d="M184 72 L198 64" />
            </>
          )}
        </G>
        <Path d="M90 122h120" stroke={colors.muted} strokeWidth={1.5} />
        <Path d="M90 118v8M210 118v8" stroke={colors.muted} strokeWidth={1.5} />
      </Svg>
    </View>
  );
}

/* ───────────────────────── Camera preview ───────────────────────── */

/** Bones drawn over the preview, as landmark index pairs (one side; the near side is the visible one). */
const BONES: [number, number][] = [
  [LM.leftShoulder, LM.leftElbow], [LM.leftElbow, LM.leftWrist], [LM.leftShoulder, LM.leftHip], [LM.leftHip, LM.leftKnee], [LM.leftKnee, LM.leftAnkle],
  [LM.rightShoulder, LM.rightElbow], [LM.rightElbow, LM.rightWrist], [LM.rightShoulder, LM.rightHip], [LM.rightHip, LM.rightKnee], [LM.rightKnee, LM.rightAnkle],
];
const JOINTS = [LM.leftShoulder, LM.leftElbow, LM.leftWrist, LM.leftHip, LM.leftKnee, LM.leftAnkle, LM.rightShoulder, LM.rightElbow, LM.rightWrist, LM.rightHip, LM.rightKnee, LM.rightAnkle];

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * The front camera feed with frame brackets, the tracked skeleton (accent bones, white joints) and a
 * pulsing danger ring on a joint that fails a check. Nothing is recorded: frames only feed the pose model.
 */
export function CameraPreview({ width, height, frame, flaggedJoint, active = true, label, brackets = true }: {
  width: number;
  height: number;
  frame: PoseFrame | null;
  flaggedJoint?: number;
  active?: boolean;
  label: string;
  brackets?: boolean;
}) {
  const pulse = usePulse(flaggedJoint !== undefined, 1600, 0.4);
  const flagProps = useAnimatedProps(() => ({ opacity: pulse.value }));
  const at = (i: number) => frame?.landmarks[i];
  const seen = (i: number) => (at(i)?.visibility ?? 0) >= 0.6;
  const x = (i: number) => (at(i)?.x ?? 0) * width;
  const y = (i: number) => (at(i)?.y ?? 0) * height;
  const flagged = flaggedJoint !== undefined && at(flaggedJoint) ? flaggedJoint : undefined;

  return (
    <View style={{ width, height, backgroundColor: colors.cameraBg, overflow: 'hidden' }} accessible accessibilityRole="image" accessibilityLabel={label}>
      <CameraView style={StyleSheet.absoluteFill} facing="front" mirror active={active} mute animateShutter={false} />
      <Svg style={StyleSheet.absoluteFill} width={width} height={height} pointerEvents="none">
        {frame ? (
          <>
            <G stroke={colors.accent} strokeWidth={4} strokeLinecap="round">
              {BONES.filter(([a, b]) => seen(a) && seen(b)).map(([a, b]) => (
                <Path key={`${a}-${b}`} d={`M${x(a)} ${y(a)} L${x(b)} ${y(b)}`} />
              ))}
            </G>
            <G fill={colors.text}>
              {JOINTS.filter(seen).map((i) => <Circle key={i} cx={x(i)} cy={y(i)} r={6} />)}
              {seen(LM.nose) ? <Circle cx={x(LM.nose)} cy={y(LM.nose)} r={13} /> : null}
            </G>
            {flagged !== undefined ? (
              <AnimatedCircle animatedProps={flagProps} cx={x(flagged)} cy={y(flagged)} r={16} fill="none" stroke={colors.danger} strokeWidth={3} />
            ) : null}
          </>
        ) : null}
        {brackets ? (
          <Path
            d={`M24 104v-32h32M${width - 56} 72h32v32M24 ${height - 72}v32h32M${width - 24} ${height - 72}v32h-32`}
            stroke={colors.text}
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
          />
        ) : null}
      </Svg>
    </View>
  );
}

/** Rounded translucent label floating over the preview. */
export function Pill({ children, dot }: { children: string; dot?: boolean }) {
  const pulse = usePulse(!!dot, 1200, 0.35);
  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));
  return (
    <View style={styles.pill}>
      {dot ? <Animated.View style={[styles.dot, dotStyle]} /> : null}
      <Text style={styles.pillText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{children}</Text>
    </View>
  );
}

/* ───────────────────────── Checklist ───────────────────────── */

function CheckMark({ status }: { status: CheckStatus }) {
  if (status === 'pass') {
    return <View style={[styles.mark, { backgroundColor: colors.accent }]}><Icon name="check" size={14} color={colors.bg} strokeWidth={3.5} /></View>;
  }
  if (status === 'fail') {
    return <View style={[styles.mark, { borderWidth: 2, borderColor: colors.danger }]}><Icon name="close" size={12} color={colors.danger} strokeWidth={3.5} /></View>;
  }
  return <View style={[styles.mark, { borderWidth: 2, borderColor: colors.border }]} />;
}

const STATUS_WORD: Record<CheckStatus, string> = { pass: 'done', fail: 'not yet', unknown: 'not checked' };

export function Checklist({ checks }: { checks: CheckResult[] }) {
  return (
    <View style={{ gap: 10 }}>
      {checks.map((c) => (
        <View key={c.id} style={styles.checkRow} accessible accessibilityLabel={`${CHECK_LABEL[c.id]}: ${STATUS_WORD[c.status]}`}>
          <CheckMark status={c.status} />
          <Text style={styles.checkText}>{CHECK_LABEL[c.id]}</Text>
        </View>
      ))}
    </View>
  );
}

/* ───────────────────────── Timer ring ───────────────────────── */

const RING = { size: 160, stroke: 8, r: 70 };
const CIRCUMFERENCE = 2 * Math.PI * RING.r;

/**
 * Drains clockwise from 12 o'clock as the set runs out. Smooth and linear, tied to the real timer;
 * with reduced motion it steps once a second instead, because it carries information.
 */
export function TimerRing({ remainingMs, totalMs, smooth, children }: { remainingMs: number; totalMs: number; smooth: boolean; children: React.ReactNode }) {
  const fraction = useSharedValue(remainingMs / totalMs);
  useEffect(() => {
    const target = Math.max(0, remainingMs) / totalMs;
    if (smooth) {
      // Glide to where the timer will be in one second; the next update continues from there.
      fraction.value = withTiming(Math.max(0, (remainingMs - 1000) / totalMs), { duration: Math.min(1000, Math.max(0, remainingMs)), easing: Easing.linear });
    } else {
      fraction.value = target;
    }
  }, [remainingMs, totalMs, smooth, fraction]);
  const arc = useAnimatedProps(() => ({ strokeDashoffset: CIRCUMFERENCE * (1 - fraction.value) }));
  return (
    <View style={{ width: RING.size, height: RING.size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={RING.size} height={RING.size} style={StyleSheet.absoluteFill}>
        <Circle cx={80} cy={80} r={RING.r} fill="none" stroke={colors.border} strokeWidth={RING.stroke} />
        <AnimatedCircle
          animatedProps={arc}
          cx={80}
          cy={80}
          r={RING.r}
          fill="none"
          stroke={colors.accent}
          strokeWidth={RING.stroke}
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          transform="rotate(-90 80 80)"
        />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: { height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: colors.scrim, flexDirection: 'row', alignItems: 'center', gap: 8 },
  pillText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.text, fontVariant: ['tabular-nums'] },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger },
  mark: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkText: { fontFamily: fonts.body, fontSize: 15, color: colors.text, flexShrink: 1 },
});
