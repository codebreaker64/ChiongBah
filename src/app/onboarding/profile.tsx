import { useAppData } from '@/app-state/useAppData';
import { useRepositories } from '@/app-state/RepositoriesContext';
import { Body, Screen, Title } from '@/ui/kit';
import { ProfileForm } from '@/ui/ProfileForm';
import { router } from 'expo-router';

export default function OnboardingProfile() {
  const repos = useRepositories();
  const { today } = useAppData();
  return (
    <Screen>
      <Title>About you</Title>
      <Body muted>Used for your age group, countdowns and award thresholds. Stays on this phone.</Body>
      <ProfileForm
        submitLabel="Save"
        today={today}
        onSubmit={(p) => {
          repos.profile.save(p);
          router.replace('/');
        }}
      />
    </Screen>
  );
}
