import { useRepositories } from '@/app-state/RepositoriesContext';
import { useAppData } from '@/app-state/useAppData';
import { Body, Screen, Title } from '@/ui/kit';
import { ProfileForm } from '@/ui/ProfileForm';
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
      <Body muted>Not affiliated with MINDEF/SAF/SPF/SCDF; scores are practice estimates.</Body>
    </Screen>
  );
}
