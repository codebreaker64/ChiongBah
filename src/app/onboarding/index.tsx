import { now } from '@/app-state/clock';
import { useRepositories } from '@/app-state/RepositoriesContext';
import { todayInSingapore } from '@/domain/dates';
import { Emblem } from '@/ui/Emblem';
import { Body, Button, IconLine, Screen, Title } from '@/ui/kit';
import { router } from 'expo-router';
import { View } from 'react-native';

/** Welcome and disclaimers (redesign spec section 7.2). Records the day they were accepted. */
export default function Welcome() {
  const repos = useRepositories();
  const accept = () => {
    repos.consent.accept(todayInSingapore(now()));
    router.push('/onboarding/dob');
  };
  return (
    <Screen gap={24} footer={<Button label="I understand" onPress={accept} />}>
      <View style={{ paddingTop: 36 }}>
        <Emblem size={96} accessibilityLabel="Chiong Bah gold medal logo" />
      </View>
      <View style={{ gap: 10 }}>
        <Title size={40}>Train for your next IPPT</Title>
        <Body muted>Log your push-ups, sit-ups and 2.4km runs, see your points, and find the cheapest way to your goal.</Body>
      </View>
      <View style={{ gap: 10 }}>
        <IconLine icon="info" boxed>Not affiliated with MINDEF/SAF/SPF/SCDF; scores are practice estimates.</IconLine>
        <IconLine icon="heart" boxed>Consult a doctor if you have medical conditions.</IconLine>
      </View>
    </Screen>
  );
}
