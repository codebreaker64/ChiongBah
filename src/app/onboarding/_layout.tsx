import { OnboardingProvider } from '@/app-state/OnboardingContext';
import { colors } from '@/ui/theme';
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'slide_from_right' }} />
    </OnboardingProvider>
  );
}
