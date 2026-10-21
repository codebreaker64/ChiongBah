import { Body, Button, Card, Screen, Title } from '@/ui/kit';
import { router } from 'expo-router';

export default function Disclaimer() {
  return (
    <Screen>
      <Title>Chiong Bah</Title>
      <Body>Train for your IPPT and count down to the dates that matter.</Body>
      <Card>
        <Body>Not affiliated with MINDEF/SAF/SPF/SCDF; scores are practice estimates.</Body>
        <Body>Consult a doctor if you have medical conditions.</Body>
      </Card>
      <Button label="I understand" onPress={() => router.push('/onboarding/profile')} />
    </Screen>
  );
}
