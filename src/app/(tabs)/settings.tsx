import { useRepositories } from '@/app-state/RepositoriesContext';
import { useAppData } from '@/app-state/useAppData';
import { Body, Card, ListRow, Screen, SectionTitle, Title } from '@/ui/kit';
import { ProfileForm } from '@/ui/ProfileForm';
import { router } from 'expo-router';
import { useState } from 'react';

export default function Settings() {
  const repos = useRepositories();
  const { today, profile, refresh } = useAppData();
  const [saved, setSaved] = useState(false);
  if (!profile) return null;
  return (
    <Screen>
      <Title>Settings</Title>
      <ProfileForm
        key={JSON.stringify(profile)}
        initial={profile}
        submitLabel="Save"
        today={today}
        onSubmit={(p) => {
          repos.profile.save(p);
          setSaved(true);
          refresh();
        }}
      />
      {saved ? <Body muted>Saved</Body> : null}
      <SectionTitle>Support</SectionTitle>
      <Card>
        <ListRow first label="Help & Support" onPress={() => router.push('/help')} />
        <ListRow label="Terms of Service" onPress={() => router.push('/terms')} />
        <ListRow label="Privacy Policy" onPress={() => router.push('/privacy')} />
      </Card>
      <Body muted>Not affiliated with MINDEF/SAF/SPF/SCDF; scores are practice estimates.</Body>
    </Screen>
  );
}
