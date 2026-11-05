import { createAppRepositories } from '@/app-state/bootstrap';
import { RepositoriesProvider } from '@/app-state/RepositoriesContext';
import { lockPortrait } from '@/app-state/orientation';
import { splash } from '@/app-state/splash';
import { SplashOverlay } from '@/ui/Splash';
import { colors, fontFiles, fonts } from '@/ui/theme';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

// Keep the system splash (static medal) up until the fonts are ready, then cross-fade to the animated one.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: true, duration: 250 });

const docHeader = {
  headerShown: true,
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.text,
  headerTitleStyle: { fontFamily: fonts.semibold, fontSize: 19 },
  headerShadowVisible: false,
} as const;

export default function RootLayout() {
  const [repos] = useState(createAppRepositories);
  const [fontsLoaded, fontError] = useFonts(fontFiles);
  const ready = fontsLoaded || !!fontError;
  const [showSplash, setShowSplash] = useState(splash.claim);
  const hideSplash = useCallback(() => setShowSplash(false), []);

  useEffect(() => { lockPortrait(); }, []);
  useEffect(() => { if (ready) SplashScreen.hideAsync().catch(() => {}); }, [ready]);

  if (!ready) return null;
  return (
    <RepositoriesProvider repos={repos}>
      <StatusBar style="light" />
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="log/new" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="log/import" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="camera" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="tables" options={{ ...docHeader, title: 'Score tables' }} />
          <Stack.Screen name="help" options={{ ...docHeader, title: 'Help & Support' }} />
          <Stack.Screen name="terms" options={{ ...docHeader, title: 'Terms of Service' }} />
          <Stack.Screen name="privacy" options={{ ...docHeader, title: 'Privacy Policy' }} />
        </Stack>
        {showSplash ? <SplashOverlay onDone={hideSplash} /> : null}
      </View>
    </RepositoriesProvider>
  );
}
