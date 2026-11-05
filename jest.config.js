module.exports = {
  preset: 'jest-expo',
  // Reanimated 4 and Worklets run their web implementations under Jest.
  resolver: 'react-native-reanimated/jest/resolver',
  setupFiles: ['./jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/docs/', '/.superpowers/'],
};
