import { createAppRepositories } from '@/app-state/bootstrap';
import { RepositoriesProvider } from '@/app-state/RepositoriesContext';
import { colors } from '@/ui/kit';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

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
      </Stack>
    </RepositoriesProvider>
  );
}
