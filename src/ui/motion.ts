import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';
import {
  cancelAnimation, Easing, FadeIn, FadeInDown, FadeOut, LinearTransition, ReduceMotion, SharedValue, useReducedMotion, useSharedValue,
  withDelay, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated';

/**
 * Motion presets (redesign spec section 5). Motion only says "something changed": one splash glint,
 * everything else is feedback. Animate transform and opacity only, on the UI thread.
 */

/** House easing: fast out, soft landing. cubic-bezier(0.16, 1, 0.3, 1). */
export const EASE = Easing.bezier(0.16, 1, 0.3, 1);
/** Material standard curve, used for the splash glint. */
export const EASE_STANDARD = Easing.bezier(0.4, 0, 0.2, 1);

export const DURATION = {
  cue: 320,
  pop: 450,
  progress: 500,
  bar: 600,
  medal: 650,
  fill: 700,
  glint: 700,
} as const;

/**
 * False when the user has turned on "Remove animations"; every animation then jumps to its end
 * state and loops stop. Reanimated reads the setting once at start-up; the listener catches changes.
 */
export function useMotionOK(): boolean {
  const reducedAtStart = useReducedMotion();
  const [reduced, setReduced] = useState(reducedAtStart);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((on) => { if (alive) setReduced(on); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { alive = false; sub.remove(); };
  }, []);
  return !reduced;
}

/**
 * A shared value that runs from `from` to 1 once when the component mounts (or `key` changes).
 * Used for bars that fill in and badges that pop in.
 */
export function useEnter(opts: { duration?: number; delay?: number; from?: number; key?: unknown } = {}): SharedValue<number> {
  const { duration = DURATION.fill, delay = 0, from = 0, key } = opts;
  const ok = useMotionOK();
  const t = useSharedValue(ok ? from : 1);
  useEffect(() => {
    if (!ok) { t.value = 1; return; }
    t.value = from;
    t.value = withDelay(delay, withTiming(1, { duration, easing: EASE }));
    return () => cancelAnimation(t);
  }, [ok, duration, delay, from, key, t]);
  return t;
}

/** A shared value that pulses 1 → `low` → 1 forever while `on`; stays at 1 with reduced motion. */
export function usePulse(on: boolean, period: number, low: number): SharedValue<number> {
  const ok = useMotionOK();
  const v = useSharedValue(1);
  useEffect(() => {
    if (!on || !ok) { cancelAnimation(v); v.value = 1; return; }
    const half = { duration: period / 2, easing: Easing.inOut(Easing.ease) };
    v.value = withRepeat(withSequence(withTiming(low, half), withTiming(1, half)), -1);
    return () => cancelAnimation(v);
  }, [on, ok, period, low, v]);
  return v;
}

/**
 * Counts to `target` over `duration` ms: from 0 the first time, then from wherever it was, so a
 * new result rolls the number on from the old one. Shows `target` at once with reduced motion.
 */
export function useCountUp(target: number, duration: number = DURATION.fill): number {
  const ok = useMotionOK();
  const [shown, setShown] = useState(ok ? 0 : target);
  const last = useRef(ok ? 0 : target);
  const frame = useRef<number | null>(null);
  useEffect(() => {
    if (!ok) { last.current = target; return; }
    const from = last.current;
    if (from === target) { setShown(target); return; }
    const start = Date.now();
    const ease = Easing.bezierFn(0.16, 1, 0.3, 1);
    const step = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      const v = Math.round(from + (target - from) * ease(p));
      last.current = v;
      setShown(v);
      if (p < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => { if (frame.current !== null) cancelAnimationFrame(frame.current); };
  }, [ok, target, duration]);
  return ok ? shown : target;
}

/**
 * A shared value that follows `target`: it starts at `initial` (0 by default) and springs or
 * eases to each new target, picking up from wherever it is. Jumps with reduced motion.
 */
export function useFollow(target: number, opts: { duration?: number; delay?: number; initial?: number } = {}): SharedValue<number> {
  const { duration = DURATION.fill, delay = 0, initial = 0 } = opts;
  const ok = useMotionOK();
  const v = useSharedValue(ok ? initial : target);
  const first = useRef(true);
  useEffect(() => {
    if (!ok) { v.value = target; return; }
    const anim = withTiming(target, { duration, easing: EASE });
    v.value = first.current ? withDelay(delay, anim) : anim;
    first.current = false;
  }, [ok, target, duration, delay, v]);
  return v;
}

/** Springs used for touch: quick, no wobble on release. */
export const SPRING = {
  press: { damping: 22, stiffness: 420, mass: 0.6 },
  settle: { damping: 18, stiffness: 220, mass: 0.8 },
  pop: { damping: 12, stiffness: 260, mass: 0.7 },
} as const;

/** Most staggered items that animate; later ones arrive with the last, so a long list never waits. */
const STAGGER_CAP = 6;
const STAGGER_STEP = 45;

/**
 * Entering animation for the i-th item of a list or a screen's stack of cards: rises 12 px and
 * fades in, 45 ms after the one before. Follows the system Remove animations setting.
 */
export function enter(i = 0) {
  // Reanimated's web build leaves an entering view absolutely positioned when its parent
  // re-renders mid-animation; entrances are a native nicety, so the web preview skips them.
  if (Platform.OS === 'web') return undefined;
  return FadeInDown.duration(DURATION.cue + 60)
    .delay(Math.min(i, STAGGER_CAP) * STAGGER_STEP)
    .easing(EASE)
    .withInitialValues({ opacity: 0, transform: [{ translateY: 12 }] })
    .reduceMotion(ReduceMotion.System);
}

/** Layout change (a row opening, a list item leaving): neighbours slide, never jump. */
export const reflow = LinearTransition.duration(260).easing(EASE).reduceMotion(ReduceMotion.System);

/** An item leaving a list. */
export const leave = FadeOut.duration(180).reduceMotion(ReduceMotion.System);

/** Content swapping in place (a number, a label). */
export const swapIn = FadeIn.duration(220).reduceMotion(ReduceMotion.System);
export const swapOut = FadeOut.duration(120).reduceMotion(ReduceMotion.System);
