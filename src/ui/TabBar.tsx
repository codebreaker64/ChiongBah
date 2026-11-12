import type { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs/types';
import { StyleSheet, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from './haptics';
import { Icon, IconName } from './Icon';
import { Press } from './kit';
import { useFollow } from './motion';
import { colors, fonts } from './theme';

const ICON: Record<string, IconName> = { index: 'home', log: 'log', goals: 'goals', settings: 'settings' };

/** One destination: the Material 3 active indicator grows out from the icon's centre when chosen. */
function Tab({ name, label, focused, onPress, onLongPress }: { name: string; label: string; focused: boolean; onPress: () => void; onLongPress: () => void }) {
  const t = useFollow(focused ? 1 : 0, { duration: 260, initial: focused ? 1 : 0 });
  const pill = useAnimatedStyle(() => ({ opacity: t.value, transform: [{ scaleX: 0.4 + 0.6 * t.value }] }));
  const text = useAnimatedStyle(() => ({ color: interpolateColor(t.value, [0, 1], [colors.muted, colors.text]) }));
  return (
    <Press
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      accessibilityLabel={label}
      onPress={onPress}
      onLongPress={onLongPress}
      scaleTo={1}
      style={styles.tab}
    >
      <View style={styles.iconBox}>
        <Animated.View style={[styles.pill, pill]} />
        <View style={styles.iconLayer}>
          <Icon name={ICON[name] ?? 'home'} size={22} color={focused ? colors.accent : colors.muted} strokeWidth={focused ? 2.2 : 2} />
        </View>
      </View>
      <Animated.Text style={[styles.label, focused && styles.labelFocused, text]} numberOfLines={1}>{label}</Animated.Text>
    </Press>
  );
}

/** Material 3 navigation bar for the four tabs. */
export function TabBar({ state, descriptors, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]} accessibilityRole="tablist">
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = typeof options.title === 'string' ? options.title : route.name;
        const focused = state.index === index;
        return (
          <Tab
            key={route.key}
            name={route.name}
            label={label}
            focused={focused}
            onPress={() => {
              const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                haptic.tick();
                navigateToTab(route.key);
              }
            }}
            onLongPress={() => emitter.emit({ type: 'tabLongPress', target: route.key })}
          />
        );
      })}
    </View>
  );
}

// Kept for screens that need to know how tall the bar is.
export const TAB_BAR_HEIGHT = 72;

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10 },
  tab: { flex: 1, alignItems: 'center', gap: 4, minHeight: 56 },
  iconBox: { width: 64, height: 32, alignItems: 'center', justifyContent: 'center' },
  pill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16, zIndex: 0, backgroundColor: colors.surfaceSelected, borderWidth: 1, borderColor: colors.accentDark },
  iconLayer: { zIndex: 1 },
  label: { fontFamily: fonts.medium, fontSize: 12, color: colors.muted },
  labelFocused: { fontFamily: fonts.semibold },
});

