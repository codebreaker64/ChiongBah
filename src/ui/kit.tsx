import { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

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
};

export function Screen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.screen} keyboardShouldPersistTaps="handled">{children}</ScrollView>
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

/** Small upper-case label above a number or group, e.g. 'IPPT SCORE'. */
export function Eyebrow({ children }: { children: string }) {
  return <Text style={styles.eyebrow}>{children.toUpperCase()}</Text>;
}

/** Thin bar showing value out of max, e.g. station points out of the station's maximum. */
export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(1, value / max)) * 100;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${pct}%` }]} />
    </View>
  );
}

export function Button({ label, onPress, secondary }: { label: string; onPress: () => void; secondary?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, secondary && styles.buttonSecondary, pressed && { opacity: 0.8 }]}
    >
      <Text style={[styles.buttonText, secondary && styles.buttonTextSecondary]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
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
  title: { fontSize: 24, fontWeight: '600', color: colors.text },
  eyebrow: { fontSize: 12, fontWeight: '600', letterSpacing: 1, color: colors.muted },
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
