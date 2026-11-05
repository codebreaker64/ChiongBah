import { useRepositories } from '@/app-state/RepositoriesContext';
import { Icon, IconName } from '@/ui/Icon';
import { colors, fonts } from '@/ui/theme';
import { Redirect, Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

const icon = (name: IconName) => function TabIcon({ color }: { color: ColorValue }) {
  return <Icon name={name} color={color} size={24} />;
};

export default function TabsLayout() {
  const repos = useRepositories();
  if (!repos.profile.get()) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1, height: 76, paddingTop: 10 },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="log" options={{ title: 'Log', tabBarIcon: icon('log') }} />
      <Tabs.Screen name="goals" options={{ title: 'Goals', tabBarIcon: icon('goals') }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: icon('settings') }} />
    </Tabs>
  );
}
