import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Touch feedback, named by what happened rather than by strength. On Android these use the
 * system's own haptic constants (no VIBRATE permission, and they follow the user's
 * "Touch feedback" setting). Failures are ignored: haptics are never the only signal.
 */
function android(type: Haptics.AndroidHaptics) {
  Haptics.performAndroidHapticsAsync(type).catch(() => {});
}

export const haptic = {
  /** A button or card was pressed. */
  tap() {
    if (Platform.OS === 'android') android(Haptics.AndroidHaptics.Virtual_Key);
    else if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  /** A value stepped or a choice changed (chips, steppers, segmented controls). */
  tick() {
    if (Platform.OS === 'android') android(Haptics.AndroidHaptics.Clock_Tick);
    else if (Platform.OS === 'ios') Haptics.selectionAsync().catch(() => {});
  },
  /** Something was saved, or a threshold was crossed. */
  success() {
    if (Platform.OS === 'android') android(Haptics.AndroidHaptics.Confirm);
    else if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  /** Input was refused, or something was deleted. */
  warn() {
    if (Platform.OS === 'android') android(Haptics.AndroidHaptics.Reject);
    else if (Platform.OS === 'ios') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
  /** A swipe passed the point where letting go acts. */
  threshold() {
    if (Platform.OS === 'android') android(Haptics.AndroidHaptics.Gesture_End);
    else if (Platform.OS === 'ios') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
};
