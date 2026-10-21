// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  { ignores: ['dist/*', 'docs/*', '.superpowers/*'] },
  {
    // The domain layer is pure TypeScript (spec section 5).
    files: ['src/domain/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: ['react', 'react-native', 'react-native/*', 'expo*', '@expo/*',
          '**/adapters/**', '**/app-state/**', '**/ui/**', '@/app/*', '@/adapters/*', '@/app-state/*', '@/ui/*'],
      }],
    },
  },
]);
