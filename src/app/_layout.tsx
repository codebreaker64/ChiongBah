import { createAppRepositories } from '@/app-state/bootstrap';
import { RepositoriesProvider } from '@/app-state/RepositoriesContext';
import { colors } from '@/ui/kit';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

const docHeader = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.card },
  headerTintColor: colors.text,
  headerShadowVisible: false,
} as const;

export default function RootLayout() {
  const [repos] = useState(createAppRepositories);
  // Text falls back to the platform sans until these load.
  useFonts({
    BarlowCondensed_600SemiBold: require('../../assets/fonts/BarlowCondensed_600SemiBold.ttf'),
    BarlowCondensed_700Bold: require('../../assets/fonts/BarlowCondensed_700Bold.ttf'),
  });
  return (
    <RepositoriesProvider repos={repos}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="onboarding/profile" />
        <Stack.Screen name="log/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="log/import" options={{ presentation: 'modal' }} />
        <Stack.Screen name="tables" options={{ ...docHeader, title: 'Score tables' }} />
        <Stack.Screen name="help" options={{ ...docHeader, title: 'Help & Support' }} />
        <Stack.Screen name="terms" options={{ ...docHeader, title: 'Terms of Service' }} />
        <Stack.Screen name="privacy" options={{ ...docHeader, title: 'Privacy Policy' }} />
      </Stack>
    </RepositoriesProvider>
  );
}
