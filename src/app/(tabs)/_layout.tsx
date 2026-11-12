import { useRepositories } from '@/app-state/RepositoriesContext';
import { SnackbarHost } from '@/ui/interactive';
import { TAB_BAR_HEIGHT, TabBar } from '@/ui/TabBar';
import { colors } from '@/ui/theme';
import { Redirect, Tabs } from 'expo-router';

export default function TabsLayout() {
  const repos = useRepositories();
  if (!repos.profile.get()) return <Redirect href="/onboarding" />;
  return (
    <SnackbarHost bottomOffset={TAB_BAR_HEIGHT}>
      <Tabs
        tabBar={(props) => <TabBar {...props} />}
        screenOptions={{
          headerShown: false,
          // Material shared-axis feel: the outgoing tab slides a little and fades as the new one arrives.
          animation: 'shift',
          sceneStyle: { backgroundColor: colors.bg },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="log" options={{ title: 'Log' }} />
        <Tabs.Screen name="goals" options={{ title: 'Goals' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    </SnackbarHost>
  );
}
