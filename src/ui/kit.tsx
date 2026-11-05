import { ReactNode, useState } from 'react';
import {
  Pressable, PressableProps, RefreshControl, ScrollView, StyleProp, StyleSheet, Text, TextInput, TextStyle, View, ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, IconName } from './Icon';
import { DURATION, useEnter } from './motion';
import { colors, fonts, gap, layout, MAX_FONT_SCALE, radius, tabular, type } from './theme';

export { colors, fonts } from './theme';

/* ───────────────────────── Pressable with focus ring ───────────────────────── */

type PressProps = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle> | ((s: { pressed: boolean }) => StyleProp<ViewStyle>);
  children: ReactNode;
  /** Corner radius of the focus ring, so it hugs the control. */
  ringRadius?: number;
};

/**
 * Pressable with the app's states (spec section 4.4): 0.85 opacity while pressed, 0.4 and not
 * focusable when disabled, and a 2 px accent ring 2 px outside the control when focused from a
 * keyboard or switch access.
 */
export function Press({ style, children, disabled, ringRadius = radius.row, onFocus, onBlur, ...rest }: PressProps) {
  const [focused, setFocused] = useState(false);
  return (
    <Pressable
      {...rest}
      disabled={disabled}
      focusable={!disabled}
      accessibilityState={{ ...rest.accessibilityState, disabled: !!disabled }}
      onFocus={(e) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); onBlur?.(e); }}
      style={({ pressed }) => [
        typeof style === 'function' ? style({ pressed }) : style,
        pressed && !disabled && { opacity: 0.85 },
        disabled && { opacity: 0.4 },
      ]}
    >
      {children}
      {focused ? <View pointerEvents="none" style={[styles.ring, { borderRadius: ringRadius + 4 }]} /> : null}
    </Pressable>
  );
}

/* ───────────────────────── Screens ───────────────────────── */

type ScreenProps = {
  children: ReactNode;
  onRefresh?: () => void;
  /** Pinned to the bottom of the screen, below the scrolling content. */
  footer?: ReactNode;
  /** 'tab' screens use 20 px sides; full screens and sheets use 24. */
  variant?: 'tab' | 'full' | 'sheet';
  gap?: number;
};

/** A scrolling page on the app background. Content and footer share one scroll so nothing clips at large text sizes. */
export function Screen({ children, onRefresh, footer, variant = 'full', gap: g = 14 }: ScreenProps) {
  const pad = variant === 'tab' ? { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }
    : variant === 'sheet' ? { paddingHorizontal: layout.side, paddingTop: 32, paddingBottom: layout.bottom }
    : { paddingHorizontal: layout.side, paddingTop: 24, paddingBottom: layout.bottom };
  return (
    <SafeAreaView style={styles.safe} edges={variant === 'sheet' ? ['bottom'] : ['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={[styles.scroll, pad]}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} progressBackgroundColor={colors.surface} /> : undefined}
      >
        <View style={{ gap: g }}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Grab handle at the top of a modal sheet. */
export function SheetHandle() {
  return <View style={styles.handle} />;
}

/* ───────────────────────── Text ───────────────────────── */

export function Title({ children, size = 34 }: { children: ReactNode; size?: number }) {
  return <Text style={[type.screenTitle, { fontSize: size, lineHeight: size * 1.06 }]} accessibilityRole="header" maxFontSizeMultiplier={MAX_FONT_SCALE}>{children}</Text>;
}

export function Body({ children, muted, small, style }: { children: ReactNode; muted?: boolean; small?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text style={[small ? type.bodySmall : type.body, muted && styles.muted, style]}>{children}</Text>;
}

export function Caption({ children, italic, style }: { children: ReactNode; italic?: boolean; style?: StyleProp<TextStyle> }) {
  return <Text style={[type.caption, italic && { fontStyle: 'italic' }, style]}>{children}</Text>;
}

/** Heading above a group of rows, e.g. 'Support'. */
export function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.section} accessibilityRole="header">{children}</Text>;
}

/* ───────────────────────── Containers ───────────────────────── */

export function Card({ children, style, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  return <View style={[styles.card, padded && styles.cardPad, style]}>{children}</View>;
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

/** Outlined pill for a screen's main action, beside the title ('Add result'). */
export function HeaderAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Press accessibilityRole="button" onPress={onPress} ringRadius={22} hitSlop={4} style={styles.headerAction}>
      <Icon name="plus" size={18} color={colors.accent} strokeWidth={2.4} />
      <Text style={styles.headerActionText}>{label}</Text>
    </Press>
  );
}

/* ───────────────────────── Buttons ───────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'text' | 'danger';

export function Button({ label, onPress, variant, secondary, disabled, icon, accessibilityHint }: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  /** Shorthand for variant 'secondary'. */
  secondary?: boolean;
  disabled?: boolean;
  icon?: IconName;
  accessibilityHint?: string;
}) {
  const v: ButtonVariant = variant ?? (secondary ? 'secondary' : 'primary');
  const textColor = v === 'primary' || v === 'danger' ? colors.bg : v === 'tertiary' ? colors.text : colors.accent;
  return (
    <Press
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      onPress={onPress}
      disabled={disabled}
      style={[styles.button, BUTTON[v]]}
    >
      {icon ? <Icon name={icon} size={16} color={textColor} /> : null}
      <Text style={[v === 'primary' || v === 'danger' ? styles.buttonTextPrimary : styles.buttonText, { color: textColor }]} maxFontSizeMultiplier={MAX_FONT_SCALE}>
        {label}
      </Text>
    </Press>
  );
}

const BUTTON: Record<ButtonVariant, ViewStyle> = {
  primary: { height: layout.primaryHeight, backgroundColor: colors.accent },
  danger: { height: layout.primaryHeight, backgroundColor: colors.danger },
  secondary: { height: layout.secondaryHeight, borderWidth: 1, borderColor: colors.accent },
  tertiary: { height: layout.secondaryHeight, borderWidth: 1, borderColor: colors.border },
  text: { height: layout.secondaryHeight },
};

/** Round icon-only button (close, back, ± steppers). Always labelled for screen readers. */
export function IconButton({ icon, label, onPress, variant = 'plain', size = 44, iconSize = 24, strokeWidth }: {
  icon: IconName;
  label: string;
  onPress: () => void;
  variant?: 'plain' | 'scrim' | 'outline';
  size?: number;
  iconSize?: number;
  strokeWidth?: number;
}) {
  return (
    <Press
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      ringRadius={size / 2}
      style={[
        { width: Math.max(size, layout.touch), height: Math.max(size, layout.touch), borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' },
        variant === 'plain' && { alignItems: 'flex-start' },
        variant === 'scrim' && { backgroundColor: colors.scrim },
        variant === 'outline' && { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.bg },
      ]}
    >
      <Icon name={icon} size={iconSize} color={colors.text} strokeWidth={strokeWidth} />
    </Press>
  );
}

/* ───────────────────────── Choices ───────────────────────── */

/** Rounded chip in a segmented row. */
export function Chip({ label, selected, onPress, height = 40 }: { label: string; selected: boolean; onPress: () => void; height?: number }) {
  return (
    <Press
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      onPress={onPress}
      ringRadius={height / 2}
      hitSlop={(layout.touch - height) / 2 > 0 ? (layout.touch - height) / 2 : 0}
      style={[styles.chip, { height, borderRadius: height / 2 }, selected && styles.chipSelected]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Press>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={styles.chipRow} accessibilityRole="radiogroup">{children}</View>;
}

/** A large single-choice option with a title and a one-line explanation. */
export function ChoiceCard({ title, detail, selected, onPress }: { title: string; detail?: string; selected: boolean; onPress: () => void }) {
  return (
    <Press
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      onPress={onPress}
      style={[styles.choice, selected && styles.choiceSelected]}
    >
      <View style={styles.choiceText}>
        <Text style={styles.choiceTitle}>{title}</Text>
        {detail ? <Text style={styles.choiceDetail}>{detail}</Text> : null}
      </View>
      <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
    </Press>
  );
}

/* ───────────────────────── Rows ───────────────────────── */

/** Tappable row in a grouped card: label, optional value, chevron. */
export function ListRow({ label, value, valueTone = 'muted', onPress, first, icon, detail, accessibilityHint }: {
  label: string;
  value?: ReactNode;
  valueTone?: 'muted' | 'accent';
  onPress: () => void;
  first?: boolean;
  icon?: IconName;
  detail?: string;
  accessibilityHint?: string;
}) {
  return (
    <Press accessibilityRole="button" accessibilityHint={accessibilityHint} onPress={onPress} ringRadius={radius.row} style={[styles.listRow, !first && styles.listDivider]}>
      {icon ? <Icon name={icon} size={22} color={colors.accent} /> : null}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.listLabel}>{label}</Text>
        {detail ? <Text style={type.caption}>{detail}</Text> : null}
      </View>
      {typeof value === 'string' ? <Text style={[styles.listValue, valueTone === 'accent' && { color: colors.accent }]}>{value}</Text> : value}
      <Icon name="chevron" size={20} color={colors.muted} />
    </Press>
  );
}

/** A group of rows on one card. */
export function RowGroup({ children }: { children: ReactNode }) {
  return <View style={styles.rowGroup}>{children}</View>;
}

/** Big number with a short label, e.g. '22' / 'years old'. Used for live readouts. */
export function Readout({ value, label, detail, accessibilityLabel }: { value: string; label: string; detail?: string; accessibilityLabel?: string }) {
  return (
    <View style={styles.readout} accessible accessibilityLabel={accessibilityLabel ?? `${value} ${label}${detail ? `. ${detail}` : ''}`} accessibilityLiveRegion="polite">
      <Text style={styles.readoutValue} maxFontSizeMultiplier={MAX_FONT_SCALE}>{value}</Text>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={styles.readoutLabel}>{label}</Text>
        {detail ? <Text style={styles.readoutDetail}>{detail}</Text> : null}
      </View>
    </View>
  );
}

/** A line with a leading icon: tips, notes and disclaimers. */
export function IconLine({ icon, children, tone = 'accent', boxed, small }: { icon: IconName; children: ReactNode; tone?: 'accent' | 'muted'; boxed?: boolean; small?: boolean }) {
  const color = tone === 'accent' ? colors.accent : colors.muted;
  return (
    <View style={[styles.iconLine, boxed && styles.iconLineBoxed]}>
      <View style={{ marginTop: 1 }}><Icon name={icon} size={20} color={color} strokeWidth={icon === 'check' ? 2.4 : 2} /></View>
      <Text style={[small ? type.caption : type.bodySmall, { flex: 1 }, tone === 'muted' && !small && styles.muted, small && { fontSize: 14, lineHeight: 20 }]}>{children}</Text>
    </View>
  );
}

/* ───────────────────────── Progress ───────────────────────── */

/**
 * Thin bar showing `value` out of `max`. It fills from the left (scaleX) when it appears;
 * `from` (0–1 of the final width) starts it part-way, e.g. from the previous onboarding step.
 */
export function ProgressBar({ value, max, height = 6, from = 0, delay = 0, duration = DURATION.fill, accessibilityLabel }: {
  value: number;
  max: number;
  height?: number;
  from?: number;
  delay?: number;
  duration?: number;
  accessibilityLabel?: string;
}) {
  const fraction = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  const t = useEnter({ duration, delay, from, key: fraction });
  const [width, setWidth] = useState(0);
  const fillWidth = width * fraction;
  // Scale about the left edge: shift by half the lost width so the bar grows rightwards.
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -(fillWidth * (1 - t.value)) / 2 }, { scaleX: t.value }] }));
  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2 }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'progressbar' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={accessibilityLabel ? { min: 0, max: 100, now: Math.round(fraction * 100) } : undefined}
    >
      <Animated.View style={[{ width: fillWidth, height, borderRadius: height / 2, backgroundColor: colors.accent }, style]} />
    </View>
  );
}

/* ───────────────────────── Inputs ───────────────────────── */

export function Field(props: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: 'default' | 'number-pad' | 'numbers-and-punctuation';
  onSubmitEditing?: () => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={type.label}>{props.label}</Text>
      <TextInput
        accessibilityLabel={props.label}
        value={props.value}
        onChangeText={props.onChangeText}
        onSubmitEditing={props.onSubmitEditing}
        placeholder={props.placeholder}
        placeholderTextColor={colors.muted}
        keyboardType={props.keyboardType ?? 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        selectionColor={colors.accent}
        cursorColor={colors.accent}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        maxFontSizeMultiplier={MAX_FONT_SCALE}
        style={[styles.input, focused && styles.inputFocused, props.error ? styles.inputError : null]}
      />
      {props.error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">{props.error}</Text>
      ) : null}
    </View>
  );
}

export const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flexGrow: 1 },
  footer: { marginTop: 'auto', paddingTop: 24, gap: gap.s },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 6 },
  ring: { position: 'absolute', top: -4, left: -4, right: -4, bottom: -4, borderWidth: 2, borderColor: colors.accent },
  muted: { color: colors.muted },
  section: { fontFamily: fonts.semibold, fontSize: 15, color: colors.muted, marginTop: 6 },
  card: { backgroundColor: colors.surface, borderRadius: radius.card, borderWidth: 1, borderColor: colors.border },
  cardPad: { padding: 16, gap: gap.m },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 44 },
  headerAction: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, borderColor: colors.accent },
  headerActionText: { fontFamily: fonts.semibold, color: colors.accent, fontSize: 15 },
  button: { borderRadius: radius.row, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 16 },
  buttonTextPrimary: { fontFamily: fonts.semibold, fontSize: 17 },
  buttonText: { fontFamily: fonts.semibold, fontSize: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: gap.xs },
  chip: { paddingHorizontal: 16, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  chipSelected: { backgroundColor: colors.accent },
  chipText: { fontFamily: fonts.body, color: colors.text, fontSize: 15 },
  chipTextSelected: { fontFamily: fonts.semibold, color: colors.bg },
  choice: { flexDirection: 'row', alignItems: 'center', gap: gap.m, backgroundColor: colors.surface, borderRadius: radius.row, borderWidth: 1, borderColor: colors.border, padding: 16, minHeight: 64 },
  choiceSelected: { borderColor: colors.accent, backgroundColor: colors.surfaceSelected },
  choiceText: { flex: 1, gap: 4 },
  choiceTitle: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text },
  choiceDetail: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.muted, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.accent },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },
  rowGroup: { backgroundColor: colors.surface, borderRadius: radius.row, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: gap.m, minHeight: 48, paddingHorizontal: 16, paddingVertical: 12 },
  listDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  listLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  listValue: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, ...tabular },
  readout: { flexDirection: 'row', alignItems: 'center', gap: gap.m, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.row, paddingVertical: 14, paddingHorizontal: 16 },
  readoutValue: { fontFamily: fonts.display, fontSize: 36, lineHeight: 38, color: colors.accent, ...tabular },
  readoutLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  readoutDetail: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  iconLine: { flexDirection: 'row', gap: gap.s, alignItems: 'flex-start' },
  iconLineBoxed: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.row, paddingVertical: 12, paddingHorizontal: 14 },
  track: { backgroundColor: colors.chip, overflow: 'hidden' },
  field: { gap: 8 },
  input: { height: 52, paddingHorizontal: 16, borderRadius: radius.field, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, color: colors.text, fontFamily: fonts.body, fontSize: 17, ...tabular },
  inputFocused: { borderColor: colors.accent },
  inputError: { borderColor: colors.danger },
  error: { fontFamily: fonts.body, color: colors.danger, fontSize: 14 },
});
