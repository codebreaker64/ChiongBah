import { useCameraSession } from '@/app-state/CameraSession';
import { useRepositories } from '@/app-state/RepositoriesContext';
import { CameraStation } from '@/domain/reps/types';
import { SetupIllustration } from '@/ui/camera/parts';
import { Body, Button, IconButton, IconLine, Press, Screen, Title } from '@/ui/kit';
import { STATION_LABEL, STATION_POSITION } from '@/ui/labels';
import { colors, fonts, radius } from '@/ui/theme';
import { useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

const TIPS: Record<CameraStation, string[]> = {
  pushup: [
    'Prop your phone sideways on the floor, side on to you.',
    'Keep your whole body, head to feet, in frame.',
    'Good light and a plain background help.',
  ],
  situp: [
    'Prop your phone sideways on the floor, side on to you.',
    'Knees bent, feet flat or held by a buddy.',
    'Keep your whole body, head to feet, in frame.',
  ],
};

/** Choose station (redesign spec section 7.10). The two cards act as one segmented control. */
export default function ChooseStation() {
  const repos = useRepositories();
  const { station, setStation } = useCameraSession();
  const [permission] = useCameraPermissions();
  const best = useMemo(() => repos.sessions.bestResults(), [repos]);
  // Screen padding 24 each side, figure padding 12 and border 1 each side.
  const figureWidth = Math.min(useWindowDimensions().width, 480) - 48 - 26;

  const close = () => router.dismissTo('/');
  const next = () => router.push(permission?.granted ? '/camera/frame' : '/camera/access');

  return (
    <Screen gap={12} footer={<Button label="Continue" onPress={next} />}>
      <View style={{ height: 44, justifyContent: 'center' }}>
        <IconButton icon="close" label="Close" onPress={close} />
      </View>
      <View style={{ gap: 8 }}>
        <Title>Count with camera</Title>
        <Body muted>A 1-minute timed set, counted the way an IPPT station does.</Body>
      </View>

      <View style={styles.stations} accessibilityRole="radiogroup">
        {(['pushup', 'situp'] as CameraStation[]).map((s) => {
          const selected = station === s;
          const b = best[s];
          return (
            <Press
              key={s}
              accessibilityRole="radio"
              accessibilityState={{ selected, checked: selected }}
              onPress={() => setStation(s)}
              style={[styles.station, selected && styles.stationSelected]}
            >
              <Text style={styles.stationName}>{STATION_LABEL[s]}</Text>
              <Text style={styles.stationBest}>{b === null ? 'No best yet' : `Best ${b}`}</Text>
            </Press>
          );
        })}
      </View>

      <View style={styles.figure}>
        <SetupIllustration station={station} width={figureWidth} />
        <Text style={styles.caption}>Phone sideways, about 2 m away, side on</Text>
      </View>

      <View style={{ gap: 10 }}>
        {TIPS[station].map((t) => <IconLine key={t} icon="check">{t}</IconLine>)}
      </View>
      <IconLine icon="speaker" boxed>
        {`Hands-free start: once everything is ticked and you are in ${STATION_POSITION[station]}, the phone says “3, 2, 1, go” out loud and the timer starts.`}
      </IconLine>
      <IconLine icon="lock" tone="muted" small>Video stays on your phone. Nothing is recorded or uploaded.</IconLine>
    </Screen>
  );
}

const styles = StyleSheet.create({
  stations: { flexDirection: 'row', gap: 12 },
  station: { flex: 1, gap: 4, paddingVertical: 14, paddingHorizontal: 16, borderRadius: radius.row, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  stationSelected: { backgroundColor: colors.surfaceSelected, borderColor: colors.accent },
  stationName: { fontFamily: fonts.semibold, fontSize: 17, color: colors.text },
  stationBest: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, fontVariant: ['tabular-nums'] },
  figure: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, padding: 12, gap: 6, alignItems: 'center' },
  caption: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, textAlign: 'center' },
});
