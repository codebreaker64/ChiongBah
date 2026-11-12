import { ReactNode, useState } from 'react';
import {
  Pressable, PressableProps, RefreshControl, StyleProp, StyleSheet, Text, TextInput, TextStyle, View, ViewStyle,
} from 'react-native';
import Animated, { interpolateColor, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Fab } from './interactive';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, IconName } from './Icon';
import { haptic } from './haptics';
import { DURATION, SPRING, useFollow, useMotionOK } from './motion';
import { colors, fonts, gap, layout, MAX_FONT_SCALE, radius, tabular, type } from './theme';

export { colors, fonts } from './theme';

/* ───────────────────────── Pressable with focus ring ───────────────────────── */

// Reanimated's animated style handles sit beside ordinary styles here.
type PressStyle = StyleProp<ViewStyle> | any;

type PressProps = Omit<PressableProps, 'style' | 'children'> & {
  /** Plain or Reanimated styles. */
  style?: PressStyle;
  children: ReactNode;
  /** Corner radius of the focus ring, so it hugs the control. */
  ringRadius?: number;
  /** How far the control sinks while held; 1 turns it off (rows inside a group). */
  scaleTo?: number;
  /** Touch feedback on press; none by default. */
  feedback?: keyof typeof haptic;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Pressable with the app's states: it sinks to 97 % on a quick spring while held (and springs
 * back on release, so a tap always reads as a tap), 0.4 and not focusable when disabled, and a
 * 2 px accent ring 2 px outside the control when focused from a keyboard or switch access.
 */
export function Press({ style, children, disabled, ringRadius = radius.row, onFocus, onBlur, onPressIn, onPressOut, onPress, scaleTo = 0.97, feedback, ...rest }: PressProps) {
  const [focused, setFocused] = useState(false);
  const [held, setHeld] = useState(false);
  const ok = useMotionOK();
  const s = useSharedValue(1);
  const sink = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      focusable={!disabled}
      accessibilityState={{ ...rest.accessibilityState, disabled: !!disabled }}
      onFocus={(e) => { setFocused(true); onFocus?.(e); }}
      onBlur={(e) => { setFocused(false); onBlur?.(e); }}
      onPressIn={(e) => { setHeld(true); if (ok && scaleTo !== 1) s.set(withSpring(scaleTo, SPRING.press)); onPressIn?.(e); }}
      onPressOut={(e) => { setHeld(false); s.set(ok ? withSpring(1, SPRING.settle) : 1); onPressOut?.(e); }}
      onPress={onPress ? (e) => { if (feedback) haptic[feedback](); onPress(e); } : undefined}
      style={[
        ...(Array.isArray(style) ? style.flat(3) : [style]),
        sink,
        held && !disabled && scaleTo === 1 && { opacity: 0.85 },
        disabled && { opacity: 0.4 },
      ]}
    >
      {children}
      {focused ? <View pointerEvents="none" style={[styles.ring, { borderRadius: ringRadius + 4 }]} /> : null}
    </AnimatedPressable>
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
  /** The screen's one primary action, as an extended FAB that folds while scrolling down. */
  fab?: { label: string; onPress: () => void };
};

/** A scrolling page on the app background. Content and footer share one scroll so nothing clips at large text sizes. */
export function Screen({ children, onRefresh, footer, variant = 'full', gap: g = 14, fab }: ScreenProps) {
  const pad = variant === 'tab' ? { paddingHorizontal: 20, paddingTop: 24, paddingBottom: fab ? 96 : 16 }
    : variant === 'sheet' ? { paddingHorizontal: layout.side, paddingTop: 32, paddingBottom: layout.bottom }
    : { paddingHorizontal: layout.side, paddingTop: 24, paddingBottom: layout.bottom };
  const collapsed = useSharedValue(0);
  const lastY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    const y = e.contentOffset.y;
    const dy = y - lastY.value;
    if (y < 24) collapsed.value = 0;
    else if (dy > 6) collapsed.value = 1;
    else if (dy < -6) collapsed.value = 0;
    lastY.value = y;
  });
  return (
    <SafeAreaView style={styles.safe} edges={variant === 'sheet' ? ['bottom'] : variant === 'tab' ? ['top'] : ['top', 'bottom']}>
      <Animated.ScrollView
        onScroll={fab ? onScroll : undefined}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scroll, pad]}
        keyboardShouldPersistTaps="handled"
        refreshControl={onRefresh ? <RefreshControl refreshing={false} onRefresh={onRefresh} tintColor={colors.accent} colors={[colors.accent]} progressBackgroundColor={colors.surface} /> : undefined}
      >
        <View style={{ gap: g }}>{children}</View>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </Animated.ScrollView>
      {fab ? <Fab label={fab.label} onPress={fab.onPress} collapsed={collapsed} /> : null}
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
      feedback={v === 'primary' ? 'tap' : undefined}
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

/** Rounded chip in a segmented row. Its fill cross-fades to accent when chosen. */
export function Chip({ label, selected, onPress, height = 40 }: { label: string; selected: boolean; onPress: () => void; height?: number }) {
  const t = useFollow(selected ? 1 : 0, { duration: 220, initial: selected ? 1 : 0 });
  const fill = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(t.value, [0, 1], [colors.chip, colors.accent]) }));
  return (
    <Press
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      onPress={onPress}
      feedback={selected ? undefined : 'tick'}
      ringRadius={height / 2}
      hitSlop={(layout.touch - height) / 2 > 0 ? (layout.touch - height) / 2 : 0}
      style={[styles.chip, { height, borderRadius: height / 2 }, fill]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Press>
  );
}

/**
 * One choice from two to four short options on a single track. The accent pill slides to the
 * chosen option, so the change reads as a move rather than a blink.
 */
export function Segmented<T extends string>({ options, value, onChange, accessibilityLabel }: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  accessibilityLabel?: string;
}) {
  const [boxes, setBoxes] = useState<Record<string, { x: number; w: number }>>({});
  const box = boxes[value];
  const x = useFollow(box?.x ?? 0, { duration: 300, initial: box?.x ?? 0 });
  const w = useFollow(box?.w ?? 0, { duration: 300, initial: box?.w ?? 0 });
  const pill = useAnimatedStyle(() => ({ width: w.value, transform: [{ translateX: x.value }] }));
  return (
    <View style={styles.segTrack} accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel}>
      {box ? <Animated.View pointerEvents="none" style={[styles.segPill, pill]} /> : null}
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <Press
            key={o.value}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            onPress={() => { if (!selected) { haptic.tick(); onChange(o.value); } }}
            onLayout={(e) => {
              const { x: lx, width } = e.nativeEvent.layout;
              setBoxes((b) => (b[o.value]?.x === lx && b[o.value]?.w === width ? b : { ...b, [o.value]: { x: lx, w: width } }));
            }}
            ringRadius={20}
            style={styles.segItem}
          >
            <Text style={[styles.segText, selected && styles.segTextSelected]} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{o.label}</Text>
          </Press>
        );
      })}
    </View>
  );
}

export function ChipRow({ children }: { children: ReactNode }) {
  return <View style={styles.chipRow} accessibilityRole="radiogroup">{children}</View>;
}

/**
 * A large single-choice option with a title and a one-line explanation. Choosing it tints the
 * card and border and springs the radio dot in, so the answer visibly lands.
 */
export function ChoiceCard({ title, detail, selected, onPress }: { title: string; detail?: string; selected: boolean; onPress: () => void }) {
  const t = useFollow(selected ? 1 : 0, { duration: 220, initial: selected ? 1 : 0 });
  const ok = useMotionOK();
  const card = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(t.value, [0, 1], [colors.surface, colors.surfaceSelected]),
    borderColor: interpolateColor(t.value, [0, 1], [colors.border, colors.accent]),
  }));
  const ring = useAnimatedStyle(() => ({ borderColor: interpolateColor(t.value, [0, 1], [colors.muted, colors.accent]) }));
  const dot = useAnimatedStyle(() => ({ transform: [{ scale: ok ? withSpring(selected ? 1 : 0, SPRING.pop) : selected ? 1 : 0 }] }));
  return (
    <Press
      accessibilityRole="radio"
      accessibilityState={{ selected, checked: selected }}
      onPress={onPress}
      feedback={selected ? undefined : 'tick'}
      scaleTo={0.98}
      style={[styles.choice, card]}
    >
      <View style={styles.choiceText}>
        <Text style={styles.choiceTitle}>{title}</Text>
        {detail ? <Text style={styles.choiceDetail}>{detail}</Text> : null}
      </View>
      <Animated.View style={[styles.radio, ring]}><Animated.View style={[styles.radioDot, dot]} /></Animated.View>
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
  // Fills from `from` of its value the first time, then glides between values as they change.
  const f = useFollow(fraction, { duration, delay, initial: from * fraction });
  const [width, setWidth] = useState(0);
  // Scale about the left edge: shift by half the lost width so the bar grows rightwards.
  const style = useAnimatedStyle(() => ({ transform: [{ translateX: -(width * (1 - f.value)) / 2 }, { scaleX: f.value }] }));
  return (
    <View
      style={[styles.track, { height, borderRadius: height / 2 }]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessible={!!accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'progressbar' : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={accessibilityLabel ? { min: 0, max: 100, now: Math.round(fraction * 100) } : undefined}
    >
      <Animated.View style={[{ width, height, borderRadius: height / 2, backgroundColor: colors.accent }, style]} />
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
  segTrack: { flexDirection: 'row', backgroundColor: colors.chip, borderRadius: 22, padding: 4, minHeight: 48 },
  segPill: { position: 'absolute', top: 4, bottom: 4, left: 0, borderRadius: 18, backgroundColor: colors.accent },
  segItem: { flex: 1, minHeight: 40, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderRadius: 18 },
  segText: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  segTextSelected: { fontFamily: fonts.semibold, color: colors.bg },
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
