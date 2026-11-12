// Reanimated's test helpers: animations run on fake timers and toHaveAnimatedStyle is available.
require('react-native-reanimated').setUpTests();

// expo-audio's player is a native shared object that jest-expo does not mock.
jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), seekTo: jest.fn(async () => {}) }),
  setAudioModeAsync: jest.fn(async () => {}),
}));

// Screen tests run as if "Remove animations" were on, so numbers show their final value at once
// (the count-ups and rolls are covered by the reduced-motion paths they would otherwise skip).
jest.mock('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo', () => {
  const actual = jest.requireActual('react-native/Libraries/Components/AccessibilityInfo/AccessibilityInfo');
  const api = actual.default ?? actual;
  api.isReduceMotionEnabled = jest.fn(async () => true);
  return actual;
});

// Haptics are native-only side effects.
jest.mock('expo-haptics', () => ({
  performAndroidHapticsAsync: jest.fn(async () => {}),
  impactAsync: jest.fn(async () => {}),
  selectionAsync: jest.fn(async () => {}),
  notificationAsync: jest.fn(async () => {}),
  AndroidHaptics: {}, ImpactFeedbackStyle: {}, NotificationFeedbackType: {},
}));
