import { createAppRepositories } from '@/app-state/bootstrap';
import { RepositoriesProvider } from '@/app-state/RepositoriesContext';
import { Stack } from 'expo-router';
import { useState } from 'react';

export default function RootLayout() {
  const [repos] = useState(createAppRepositories);
  return (
    <RepositoriesProvider repos={repos}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding/index" />
        <Stack.Screen name="onboarding/profile" />
        <Stack.Screen name="log/new" options={{ presentation: 'modal' }} />
      </Stack>
    </RepositoriesProvider>
  );
}
