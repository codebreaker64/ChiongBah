import { useRepositories } from '@/app-state/RepositoriesContext';
import { colors } from '@/ui/kit';
import { Redirect, Tabs } from 'expo-router';
import { SymbolView, SymbolViewProps } from 'expo-symbols';
import type { ColorValue } from 'react-native';

function TabIcon({ name, color }: { name: SymbolViewProps['name']; color: ColorValue }) {
  return <SymbolView name={name} tintColor={color} size={24} />;
}

export default function TabsLayout() {
  const repos = useRepositories();
  if (!repos.profile.get()) return <Redirect href="/onboarding" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.border },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <TabIcon name={{ ios: 'house', android: 'home', web: 'home' }} color={color} /> }} />
      <Tabs.Screen name="log" options={{ title: 'Log', tabBarIcon: ({ color }) => <TabIcon name={{ ios: 'list.bullet', android: 'history', web: 'history' }} color={color} /> }} />
      <Tabs.Screen name="goals" options={{ title: 'Goals', tabBarIcon: ({ color }) => <TabIcon name={{ ios: 'flag', android: 'flag', web: 'flag' }} color={color} /> }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarIcon: ({ color }) => <TabIcon name={{ ios: 'gearshape', android: 'settings', web: 'settings' }} color={color} /> }} />
    </Tabs>
  );
}
