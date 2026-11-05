import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo } from 'react-native';
import {
  cancelAnimation, Easing, SharedValue, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming,
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

/** Counts up from 0 to `target` over `duration` ms; shows `target` at once with reduced motion. */
export function useCountUp(target: number, duration: number = DURATION.fill): number {
  const ok = useMotionOK();
  const [shown, setShown] = useState(ok ? 0 : target);
  const frame = useRef<number | null>(null);
  useEffect(() => {
    if (!ok) return;
    const start = Date.now();
    const ease = Easing.bezierFn(0.16, 1, 0.3, 1);
    const step = () => {
      const p = Math.min(1, (Date.now() - start) / duration);
      setShown(Math.round(target * ease(p)));
      if (p < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
    return () => { if (frame.current !== null) cancelAnimationFrame(frame.current); };
  }, [ok, target, duration]);
  return ok ? shown : target;
}
