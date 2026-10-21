import { createAppRepositories } from '@/app-state/bootstrap';
import { RepositoriesProvider } from '@/app-state/RepositoriesContext';
import { colors } from '@/ui/kit';
import { Stack } from 'expo-router';
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
  return (
    <RepositoriesProvider repos={repos}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="onboarding/profile" />
        <Stack.Screen name="log/new" options={{ presentation: 'modal' }} />
        <Stack.Screen name="log/import" options={{ presentation: 'modal' }} />
        <Stack.Screen name="help" options={{ ...docHeader, title: 'Help & Support' }} />
        <Stack.Screen name="terms" options={{ ...docHeader, title: 'Terms of Service' }} />
        <Stack.Screen name="privacy" options={{ ...docHeader, title: 'Privacy Policy' }} />
      </Stack>
    </RepositoriesProvider>
  );
}
