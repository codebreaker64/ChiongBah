module.exports = {
  preset: 'jest-expo',
  // Reanimated 4 and Worklets run their web implementations under Jest.
  resolver: 'react-native-reanimated/jest/resolver',
  setupFiles: ['./jest.setup.js'],
  // Screen tests render the whole router, and the first test in each file also pays for
  // transforming every route and the UI kit. On a cold CI runner that alone passes 5 s.
  testTimeout: 20000,
  testPathIgnorePatterns: ['/node_modules/', '/docs/', '/.superpowers/'],
};
