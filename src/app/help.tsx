import { HELP, SUPPORT_EMAIL } from '@/content/legal';
import { Card, ListRow } from '@/ui/kit';
import { DocScreen } from '@/ui/DocScreen';
import { Linking } from 'react-native';

export default function Help() {
  return (
    <DocScreen
      sections={HELP}
      footer={SUPPORT_EMAIL ? (
        <Card>
          <ListRow first label="Email us" onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=Chiong%20Bah%20support`)} />
        </Card>
      ) : null}
    />
  );
}
