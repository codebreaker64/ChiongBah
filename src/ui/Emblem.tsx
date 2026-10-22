import { SymbolView, SymbolViewProps } from 'expo-symbols';
import { Animated, StyleSheet, View } from 'react-native';
import { colors } from './kit';
import { useFillIn } from './motion';

/**
 * A tactical "sight" drawn from plain views: two rings, four tick marks and an accent arc,
 * with a symbol in the middle. It sweeps and scales in once when it appears.
 */
export function Emblem({ symbol, size = 160 }: { symbol: SymbolViewProps['name']; size?: number }) {
  const t = useFillIn(900);
  const rotate = t.interpolate({ inputRange: [0, 1], outputRange: ['-120deg', '0deg'] });
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] });
  const inner = size * 0.62;
  const tick = size * 0.09;
  return (
    <View style={[styles.wrap, { width: size, height: size }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: t, transform: [{ scale }] }]}>
        <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2 }]} />
        <Animated.View
          style={[styles.arc, { width: size, height: size, borderRadius: size / 2, transform: [{ rotate }] }]}
        />
        <View style={[styles.innerRing, { width: inner, height: inner, borderRadius: inner / 2, left: (size - inner) / 2, top: (size - inner) / 2 }]} />
        <View style={[styles.tick, { width: 2, height: tick, left: size / 2 - 1, top: 0 }]} />
        <View style={[styles.tick, { width: 2, height: tick, left: size / 2 - 1, bottom: 0 }]} />
        <View style={[styles.tick, { width: tick, height: 2, top: size / 2 - 1, left: 0 }]} />
        <View style={[styles.tick, { width: tick, height: 2, top: size / 2 - 1, right: 0 }]} />
      </Animated.View>
      <SymbolView name={symbol} tintColor={colors.accent} size={size * 0.3} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  ring: { position: 'absolute', borderWidth: 2, borderColor: colors.border },
  arc: { position: 'absolute', borderWidth: 3, borderColor: 'transparent', borderTopColor: colors.accent, borderRightColor: colors.accent },
  innerRing: { position: 'absolute', borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  tick: { position: 'absolute', backgroundColor: colors.muted },
});
