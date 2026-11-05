import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { Emblem } from './Emblem';
import { EASE, useMotionOK } from './motion';
import { colors, fonts } from './theme';

/** Medal height on the splash; app.json's splash imageWidth matches its width so the hand-off lines up. */
export const SPLASH_MEDAL = 131;
/** Starts the exit about 1.2 s in and is gone by 1.45 s, inside the 1.5 s budget. */
const EXIT_AT = 1200;
const EXIT_MS = 250;

/**
 * The animated splash, drawn over the first real screen (Welcome or Home) and cross-faded away.
 * The medal sits at the centre of the screen, where the system splash draws it.
 */
export function SplashOverlay({ onDone }: { onDone: () => void }) {
  const ok = useMotionOK();
  const [wordWidth, setWordWidth] = useState(0);
  const word = useSharedValue(ok ? 0 : 1);
  const fade = useSharedValue(1);

  useEffect(() => {
    if (ok) word.value = withDelay(750, withTiming(1, { duration: 500, easing: EASE }));
    else word.value = 1;
    fade.value = withDelay(ok ? EXIT_AT : 600, withTiming(0, { duration: EXIT_MS }, (finished) => {
      if (finished) runOnJS(onDone)();
    }));
  }, [ok, word, fade, onDone]);

  const overlay = useAnimatedStyle(() => ({ opacity: fade.value }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: 0.2 + 0.8 * word.value }));
  // A cover in the background colour slides off to the right, wiping the wordmark in from the left.
  const cover = useAnimatedStyle(() => ({ transform: [{ translateX: word.value * wordWidth }] }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.root, overlay]} pointerEvents="none" accessibilityLabel="Chiong Bah" accessible>
      <Emblem size={SPLASH_MEDAL} animated />
      <View style={styles.wordWrap}>
        <Animated.View style={wordStyle} onLayout={(e) => setWordWidth(e.nativeEvent.layout.width)}>
          <Text style={styles.word} maxFontSizeMultiplier={1}>CHIONG BAH</Text>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, styles.cover, cover]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', zIndex: 10 },
  wordWrap: { position: 'absolute', top: '50%', marginTop: SPLASH_MEDAL / 2 + 22, overflow: 'hidden' },
  word: { fontFamily: fonts.display, fontSize: 36, lineHeight: 38, letterSpacing: 4, color: colors.text },
  cover: { backgroundColor: colors.bg },
});
