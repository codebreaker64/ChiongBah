// Reanimated's test helpers: animations run on fake timers and toHaveAnimatedStyle is available.
require('react-native-reanimated').setUpTests();

// expo-audio's player is a native shared object that jest-expo does not mock.
jest.mock('expo-audio', () => ({
  useAudioPlayer: () => ({ play: jest.fn(), pause: jest.fn(), seekTo: jest.fn(async () => {}) }),
  setAudioModeAsync: jest.fn(async () => {}),
}));
