import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing, FadeInDown, FadeInUp, FadeOut, ReduceMotion, SharedValue, SlideInDown, SlideOutDown, useAnimatedStyle, useSharedValue, withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from './haptics';
import { Icon } from './Icon';
import { Press } from './kit';
import { EASE, SPRING, useMotionOK } from './motion';
import { colors, fonts, MAX_FONT_SCALE, tabular } from './theme';

/* ───────────────────────── Snackbar ───────────────────────── */

type SnackOptions = { text: string; action?: { label: string; onPress: () => void }; duration?: number };
type SnackApi = { show: (o: SnackOptions) => void; lift: SharedValue<number> | null };

const SnackContext = createContext<SnackApi>({ show: () => {}, lift: null });

/** Height of the tab bar plus breathing room; the snackbar sits above it on tab screens. */
export const TAB_BAR_CLEARANCE = 84;

/**
 * Material snackbar: one short line of feedback at the bottom, with at most one action
 * (usually Undo). It slides up, waits 4 s (6 s with an action) and slides away; a new one
 * replaces the old. Read out by screen readers as it appears.
 */
export function SnackbarHost({ children, bottomOffset = 0 }: { children: ReactNode; bottomOffset?: number }) {
  const [snack, setSnack] = useState<(SnackOptions & { id: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  // How far a FAB on this screen moves up to stay clear of the snackbar (Material does the same).
  const lift = useSharedValue(0);
  useEffect(() => { lift.set(withTiming(snack ? 64 : 0, { duration: snack ? 280 : 180, easing: EASE })); }, [snack, lift]);
  const show = useCallback((o: SnackOptions) => {
    if (timer.current) clearTimeout(timer.current);
    const id = Date.now();
    setSnack({ ...o, id });
    timer.current = setTimeout(() => setSnack((s) => (s?.id === id ? null : s)), o.duration ?? (o.action ? 6000 : 4000));
  }, []);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  return (
    <SnackContext.Provider value={{ show, lift }}>
      {children}
      {snack ? (
        <Animated.View
          key={snack.id}
          entering={SlideInDown.duration(280).easing(EASE).reduceMotion(ReduceMotion.System)}
          exiting={SlideOutDown.duration(180).reduceMotion(ReduceMotion.System)}
          style={[styles.snack, { bottom: insets.bottom + 12 + bottomOffset }]}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          <Text style={styles.snackText} maxFontSizeMultiplier={MAX_FONT_SCALE}>{snack.text}</Text>
          {snack.action ? (
            <Press
              accessibilityRole="button"
              hitSlop={10}
              feedback="tap"
              onPress={() => { snack.action?.onPress(); setSnack(null); }}
              style={styles.snackAction}
            >
              <Text style={styles.snackActionText}>{snack.action.label}</Text>
            </Press>
          ) : null}
        </Animated.View>
      ) : null}
    </SnackContext.Provider>
  );
}

export function useSnackbar(): SnackApi {
  return useContext(SnackContext);
}

/* ───────────────────────── Extended FAB ───────────────────────── */

/**
 * The screen's one primary action as a Material extended FAB. It shows its label at rest and
 * folds down to the icon while the user scrolls down through content, then opens again on the
 * way back up, so it never covers the last row for long.
 */
export function Fab({ label, onPress, collapsed }: { label: string; onPress: () => void; collapsed: SharedValue<number> }) {
  const ok = useMotionOK();
  const { lift } = useSnackbar();
  const raise = useAnimatedStyle(() => ({ transform: [{ translateY: -(lift?.value ?? 0) }] }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: withTiming(1 - collapsed.value, { duration: ok ? 160 : 0 }),
    maxWidth: withTiming(collapsed.value ? 0 : 160, { duration: ok ? 240 : 0, easing: Easing.bezier(0.2, 0, 0, 1) }),
    marginLeft: withTiming(collapsed.value ? 0 : 10, { duration: ok ? 240 : 0 }),
  }));
  return (
    <Animated.View pointerEvents="box-none" style={[styles.fabWrap, raise]}>
      <Press accessibilityRole="button" accessibilityLabel={label} onPress={onPress} feedback="tap" ringRadius={18} style={styles.fab} scaleTo={0.94}>
        <Icon name="plus" size={24} color={colors.bg} strokeWidth={2.4} />
        <Animated.View style={[styles.fabLabelBox, labelStyle]}>
          <Text style={styles.fabLabel} numberOfLines={1} maxFontSizeMultiplier={1.15}>{label}</Text>
        </Animated.View>
      </Press>
    </Animated.View>
  );
}

/* ───────────────────────── Stepper ───────────────────────── */

/**
 * − value + with hold-to-repeat: a press steps once; holding for 400 ms keeps stepping every
 * 80 ms until let go, so going from 30 to 60 reps is one long press instead of thirty taps. Each step
 * ticks, and the value rolls up or down in the direction of travel.
 */
export function Stepper({ value, onStep, display, caption, canDown = true, canUp = true, labelDown, labelUp }: {
  value: number;
  onStep: (dir: 1 | -1) => void;
  display: string;
  caption?: string;
  canDown?: boolean;
  canUp?: boolean;
  labelDown: string;
  labelUp: string;
}) {
  const [dir, setDir] = useState<1 | -1>(1);
  const repeat = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stop = () => { if (repeat.current) clearTimeout(repeat.current); repeat.current = null; };
  useEffect(() => stop, []);
  const step = (d: 1 | -1) => { setDir(d); haptic.tick(); onStep(d); };
  const hold = (d: 1 | -1) => {
    const loop = () => { step(d); repeat.current = setTimeout(loop, 80); };
    loop();
  };
  const button = (d: 1 | -1, enabled: boolean, label: string) => (
    <Press
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Hold to keep changing"
      disabled={!enabled}
      onPress={() => step(d)}
      onLongPress={() => hold(d)}
      delayLongPress={400}
      onPressOut={stop}
      ringRadius={26}
      scaleTo={0.9}
      style={styles.stepButton}
    >
      <Icon name={d === 1 ? 'plus' : 'minus'} size={22} color={colors.text} strokeWidth={2.2} />
    </Press>
  );
  const ok = useMotionOK();
  return (
    <View style={styles.stepper}>
      {button(-1, canDown, labelDown)}
      <View style={styles.stepValue} accessible accessibilityLiveRegion="polite" accessibilityLabel={`${display}${caption ? `. ${caption}` : ''}`}>
        <View style={styles.stepClip}>
          <Animated.Text
            key={value}
            entering={ok ? (dir === 1 ? FadeInUp : FadeInDown).duration(170).easing(EASE).reduceMotion(ReduceMotion.System) : undefined}
            exiting={ok ? FadeOut.duration(90).reduceMotion(ReduceMotion.System) : undefined}
            style={styles.stepNumber}
            maxFontSizeMultiplier={MAX_FONT_SCALE}
          >
            {display}
          </Animated.Text>
        </View>
        {caption ? <Text style={styles.stepCaption}>{caption}</Text> : null}
      </View>
      {button(1, canUp, labelUp)}
    </View>
  );
}

const styles = StyleSheet.create({
  snack: {
    position: 'absolute', left: 16, right: 16, minHeight: 52, borderRadius: 12, paddingLeft: 16, paddingRight: 8,
    backgroundColor: colors.text, flexDirection: 'row', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  snackText: { flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.bg, paddingVertical: 14 },
  snackAction: { minHeight: 44, paddingHorizontal: 12, justifyContent: 'center', borderRadius: 8 },
  snackActionText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.accentDark },
  fabWrap: { position: 'absolute', right: 16, bottom: 16 },
  fab: {
    height: 56, minWidth: 56, paddingHorizontal: 16, borderRadius: 18, backgroundColor: colors.accent,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  fabLabelBox: { overflow: 'hidden' },
  fabLabel: { fontFamily: fonts.semibold, fontSize: 16, color: colors.bg },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  stepButton: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  stepValue: { flex: 1, alignItems: 'center', gap: 2 },
  stepClip: { height: 46, overflow: 'hidden', justifyContent: 'center' },
  stepNumber: { fontFamily: fonts.display, fontSize: 42, lineHeight: 46, color: colors.text, ...tabular },
  swipeUnder: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.danger, alignItems: 'flex-end', justifyContent: 'center', paddingRight: 22 },
  swipeIcon: { alignItems: 'center', gap: 2 },
  swipeText: { fontFamily: fonts.semibold, fontSize: 12, color: colors.bg },
  swipeRow: { backgroundColor: colors.surface },
  stepCaption: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
});

/* ───────────────────────── Swipe to delete ───────────────────────── */

const SWIPE_ACT = 110;

/**
 * A row that can be swiped left to delete, as in Gmail. The red layer underneath shows what
 * letting go will do; past 110 px the phone ticks and the trash icon grows, and letting go
 * (or a quick flick) slides the row away and calls `onDelete`. Short of that it springs back.
 * Swiping is a shortcut only: the row must also offer a Delete button for screen readers.
 */
export function SwipeToDelete({ children, onDelete, enabled = true }: { children: ReactNode; onDelete: () => void; enabled?: boolean }) {
  const x = useSharedValue(0);
  const width = useSharedValue(360);
  const armed = useSharedValue(false);
  const pan = usePanGesture({
    enabled,
    activeOffsetX: [-14, 14],
    failOffsetY: [-10, 10],
    onUpdate: (e) => {
      'worklet';
      const t = Math.min(0, e.translationX);
      // Past the action point the row drags with resistance.
      x.value = t < -SWIPE_ACT ? -SWIPE_ACT + (t + SWIPE_ACT) * 0.6 : t;
      const nowArmed = t < -SWIPE_ACT;
      if (nowArmed !== armed.value) { armed.value = nowArmed; scheduleOnRN(haptic.threshold); }
    },
    onDeactivate: (e) => {
      'worklet';
      if (x.value < -SWIPE_ACT || e.velocityX < -900) {
        x.value = withTiming(-width.value, { duration: 200, easing: Easing.in(Easing.quad) }, (done) => {
          if (done) scheduleOnRN(onDelete);
        });
      } else {
        x.value = withSpring(0, SPRING.settle);
      }
      armed.value = false;
    },
  });
  const row = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const under = useAnimatedStyle(() => ({ opacity: Math.min(1, -x.value / 40) }));
  const icon = useAnimatedStyle(() => {
    const p = Math.min(1, -x.value / SWIPE_ACT);
    return { transform: [{ scale: 0.7 + 0.3 * p + (x.value < -SWIPE_ACT ? 0.15 : 0) }] };
  });
  return (
    <View onLayout={(e) => { width.value = e.nativeEvent.layout.width; }}>
      <Animated.View pointerEvents="none" importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={[styles.swipeUnder, under]}>
        <Animated.View style={[styles.swipeIcon, icon]}>
          <Icon name="trash" size={22} color={colors.bg} strokeWidth={2.2} />
          <Text style={styles.swipeText}>Delete</Text>
        </Animated.View>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.swipeRow, row]}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}
