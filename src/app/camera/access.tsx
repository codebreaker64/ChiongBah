import { useCameraSession } from '@/app-state/CameraSession';
import { Body, Button, Caption, IconButton, Screen, Title } from '@/ui/kit';
import { colors } from '@/ui/theme';
import { useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { Linking, View } from 'react-native';
import Svg, { Circle, G, Path } from 'react-native-svg';

/** Allow camera access, shared by both stations and shown only until permission is granted (spec 7.11). */
export default function AllowCamera() {
  const { station } = useCameraSession();
  const [permission, request] = useCameraPermissions();
  const blocked = permission !== null && !permission.granted && !permission.canAskAgain;

  const allow = async () => {
    if (blocked) { await Linking.openSettings(); return; }
    const res = await request();
    if (res.granted) router.replace('/camera/frame');
  };

  const footer = (
    <>
      <Button label={blocked ? 'Open settings' : 'Allow camera'} onPress={allow} />
      <Button variant="text" label="Type my reps instead" onPress={() => router.replace({ pathname: '/log/new', params: { station } })} />
      <Caption style={{ textAlign: 'center', marginTop: 4 }}>You can change this later in Android settings.</Caption>
    </>
  );

  return (
    <Screen gap={24} footer={footer}>
      <View style={{ height: 44, justifyContent: 'center' }}>
        <IconButton icon="back" label="Back" onPress={() => router.back()} />
      </View>
      <View style={{ alignItems: 'center', paddingTop: 24 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Svg width={148} height={148} viewBox="0 0 148 148">
          <Circle cx={74} cy={74} r={72} fill={colors.surface} stroke={colors.border} strokeWidth={2} />
          <G transform="translate(41 39) scale(1.5)" fill="none" stroke={colors.accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <Path d="M4 16a4 4 0 0 1 4-4h4l3-4h10l3 4h4a4 4 0 0 1 4 4v18a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
            <Circle cx={22} cy={25} r={7} />
          </G>
        </Svg>
      </View>
      <View style={{ gap: 10 }}>
        <Title>Allow camera access</Title>
        <Body muted>The camera is only on while you count. Each frame is checked on your phone to find your body position, then thrown away.</Body>
      </View>
    </Screen>
  );
}
