import { CameraSessionProvider } from '@/app-state/CameraSession';
import { CAMERA_STATIONS, CameraStation } from '@/domain/reps/types';
import { colors } from '@/ui/theme';
import { Stack, useGlobalSearchParams } from 'expo-router';

/** Count with camera: Choose station → Allow camera → Get in frame → Counting → Result (redesign spec 6.4). */
export default function CameraLayout() {
  const { station } = useGlobalSearchParams<{ station?: string }>();
  const initial: CameraStation = CAMERA_STATIONS.includes(station as CameraStation) ? (station as CameraStation) : 'pushup';
  return (
    <CameraSessionProvider initial={initial}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg }, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="access" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="frame" options={{ contentStyle: { backgroundColor: colors.cameraBg } }} />
        <Stack.Screen name="live" options={{ contentStyle: { backgroundColor: colors.cameraBg }, gestureEnabled: false }} />
        <Stack.Screen name="result" options={{ gestureEnabled: false }} />
      </Stack>
    </CameraSessionProvider>
  );
}
