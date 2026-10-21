import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

/** True when the user has asked the system to reduce motion; animations then jump to their end state. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled().then((on) => { if (alive) setReduced(on); }).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduced);
    return () => { alive = false; sub.remove(); };
  }, []);
  return reduced;
}

/** Counts up from the previous value (0 at first) to `target` over `duration` ms. */
export function useCountUp(target: number, duration = 700): number {
  const reduced = useReducedMotion();
  const [anim] = useState(() => new Animated.Value(0));
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = anim.addListener(({ value }) => setShown(Math.round(value)));
    Animated.timing(anim, { toValue: target, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
    return () => anim.removeListener(id);
  }, [anim, target, duration, reduced]);
  return reduced ? target : shown;
}

/** 0 → 1 once on mount; for bars and rings that fill in. */
export function useFillIn(duration = 800): Animated.Value {
  const reduced = useReducedMotion();
  const [anim] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (reduced) anim.setValue(1);
    else Animated.timing(anim, { toValue: 1, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [anim, duration, reduced]);
  return anim;
}

/** Scale that dips while pressed, for tactile press feedback. */
export function usePressScale() {
  const [scale] = useState(() => new Animated.Value(1));
  const to = (v: number) => Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return { scale, onPressIn: () => to(0.96), onPressOut: () => to(1) };
}
