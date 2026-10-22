import { ReactNode } from 'react';
import { Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SymbolView } from 'expo-symbols';
import { useFillIn, usePressScale } from './motion';

/** Barlow Condensed for titles and figures (loaded in the root layout); body text stays the platform sans. */
export const fonts = {
  display: 'BarlowCondensed_700Bold',
  displaySemi: 'BarlowCondensed_600SemiBold',
};

// Dark "tactical" theme: near-black olive surfaces, field green lightened to read on dark.
export const colors = {
  bg: '#0B0D0A',
  card: '#161A14',
  text: '#EEF1EA',
  muted: '#9AA394',
  border: '#2A3026',
  accent: '#8FBF6A', // field green
  accentText: '#0B0D0A',
  danger: '#FF6B5E',
  chipBg: '#232920',
  placeholder: '#9AA394',
};

/** Scrolling page. Pass onRefresh to allow pull to refresh. */
export function Screen({ children, onRefresh }: { children: ReactNode; onRefresh?: () => void }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.screen}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} progressBackgroundColor={colors.card} /> : undefined}
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title} accessibilityRole="header">{children}</Text>;
}

export function Body({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return <Text style={[styles.body, muted && styles.muted]}>{children}</Text>;
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

/** Outlined pill for a screen's main action, placed beside the title. */
export function HeaderAction({ label, onPress }: { label: string; onPress: () => void }) {
  const press = usePressScale();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut}>
      <Animated.View style={[styles.headerAction, { transform: [{ scale: press.scale }] }]}>
        <SymbolView name={{ ios: 'plus', android: 'add', web: 'add' }} tintColor={colors.accent} size={18} />
        <Text style={styles.headerActionText}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

/** Title on the left, optional action on the right. */
export function Header({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View style={styles.header}>
      <Title>{title}</Title>
      {action}
    </View>
  );
}

/** Heading for a group of content on a screen, e.g. 'Support' above a card. */
export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.section} accessibilityRole="header">{children}</Text>;
}

/** Thin bar showing value out of max, e.g. station points out of the station's maximum. */
export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  const fill = useFillIn();
  const width = fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', `${pct}%`] });
  return (
    <View style={styles.track}>
      <Animated.View style={[styles.fill, { width }]} />
    </View>
  );
}

export function Button({ label, onPress, secondary }: { label: string; onPress: () => void; secondary?: boolean }) {
  const press = usePressScale();
  return (
    <Pressable accessibilityRole="button" onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut}>
      <Animated.View style={[styles.button, secondary && styles.buttonSecondary, { transform: [{ scale: press.scale }] }]}>
        <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const press = usePressScale();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      onPressIn={press.onPressIn}
      onPressOut={press.onPressOut}
    >
      <Animated.View style={[styles.chip, selected && styles.chipSelected, { transform: [{ scale: press.scale }] }]}>
        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

/** A large single-choice option with a title and a one-line explanation. */
export function ChoiceCard({ title, detail, selected, onPress }: { title: string; detail?: string; selected: boolean; onPress: () => void }) {
  const press = usePressScale();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress} onPressIn={press.onPressIn} onPressOut={press.onPressOut}>
      <Animated.View style={[styles.choice, selected && styles.choiceSelected, { transform: [{ scale: press.scale }] }]}>
        <View style={styles.choiceText}>
          <Text style={styles.choiceTitle}>{title}</Text>
          {detail ? <Text style={styles.choiceDetail}>{detail}</Text> : null}
        </View>
        <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
      </Animated.View>
    </Pressable>
  );
}

/** A tappable settings-style row: label on the left, chevron on the right. */
export function ListRow({ label, onPress, first }: { label: string; onPress: () => void; first?: boolean }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} style={({ pressed }) => [styles.listRow, !first && styles.listDivider, pressed && { opacity: 0.7 }]}>
      <Text style={styles.listLabel}>{label}</Text>
      <SymbolView name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }} tintColor={colors.muted} size={20} />
    </Pressable>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

export function Field(props: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'numbers-and-punctuation';
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{props.label}</Text>
      <TextInput
        accessibilityLabel={props.label}
        value={props.value}
        onChangeText={props.onChangeText}
        placeholder={props.placeholder}
        placeholderTextColor={colors.placeholder}
        keyboardType={props.keyboardType ?? 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.input, props.error ? styles.inputError : null]}
      />
      {props.error ? <Text style={styles.error}>{props.error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  screen: { padding: 16, gap: 12 },
  title: { fontSize: 32, fontFamily: fonts.display, color: colors.text, letterSpacing: 0.2 },
  choice: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.card, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 16, minHeight: 64 },
  choiceSelected: { borderColor: colors.accent, backgroundColor: colors.chipBg },
  choiceText: { flex: 1, gap: 2 },
  choiceTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
  choiceDetail: { fontSize: 14, color: colors.muted },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  listRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, minHeight: 48 },
  listDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  listLabel: { fontSize: 16, color: colors.text },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  headerAction: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: colors.accent, borderRadius: 999, paddingVertical: 8, paddingLeft: 10, paddingRight: 14, minHeight: 44 },
  headerActionText: { color: colors.accent, fontSize: 15, fontWeight: '600' },
  section: { fontSize: 17, fontWeight: '600', color: colors.text, marginTop: 12 },
  track: { height: 4, borderRadius: 2, backgroundColor: colors.border, overflow: 'hidden' },
  fill: { height: 4, borderRadius: 2, backgroundColor: colors.accent },
  body: { fontSize: 16, lineHeight: 22, color: colors.text },
  muted: { color: colors.muted },
  card: { backgroundColor: colors.card, borderRadius: 12, padding: 16, gap: 8, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  button: { backgroundColor: colors.accent, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  buttonSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.accent },
  buttonText: { color: colors.accentText, fontSize: 16, fontWeight: '600' },
  buttonTextSecondary: { color: colors.accent },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 999, backgroundColor: colors.chipBg },
  chipSelected: { backgroundColor: colors.accent },
  chipText: { color: colors.text, fontSize: 15 },
  chipTextSelected: { color: colors.accentText, fontWeight: '600' },
  field: { gap: 4 },
  label: { fontSize: 14, color: colors.muted },
  input: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 10, fontSize: 16, color: colors.text },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 14 },
});
