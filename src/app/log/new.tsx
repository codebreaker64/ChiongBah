import { now } from '@/app-state/clock';
import { useRepositories } from '@/app-state/RepositoriesContext';
import { useAppData } from '@/app-state/useAppData';
import { parseRunTime, validateReps } from '@/domain/entries/validate';
import { scoringAge } from '@/domain/profile';
import { bandForAge, Station, stationPoints, STATIONS } from '@/domain/scoring/table';
import { currentTable } from '@/domain/scoring/tables';
import { Icon } from '@/ui/Icon';
import { haptic } from '@/ui/haptics';
import { Button, Field, Press, Screen, Segmented, SheetHandle, Title } from '@/ui/kit';
import { swapIn, swapOut, useCountUp } from '@/ui/motion';
import { STATION_LABEL } from '@/ui/labels';
import { colors, fonts, MAX_FONT_SCALE, radius, tabular } from '@/ui/theme';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

const ERRORS = {
  reps: { format: 'Enter a whole number of reps.', range: 'Reps must be between 0 and 100.' },
  run: { format: 'Enter the time as m:ss, e.g. 9:45.', range: 'Time must be between 7:00 and 25:00.' },
};

/** '1 more than your best', '20 s faster than your best', 'Equals your best' or 'Your first result'. */
function compareToBest(station: Station, value: number, best: number | null): string {
  if (best === null) return 'Your first result';
  const diff = station === 'run' ? best - value : value - best;
  if (diff === 0) return 'Equals your best';
  if (station === 'run') return `${Math.abs(diff)} s ${diff > 0 ? 'faster' : 'slower'} than your best`;
  return `${Math.abs(diff)} ${diff > 0 ? 'more' : 'fewer'} than your best`;
}

/** Points the typed result is worth; rolls as the number is typed, so each digit shows its effect. */
function WorthPoints({ value }: { value: number }) {
  return <Text style={styles.worthPoints} maxFontSizeMultiplier={MAX_FONT_SCALE}>{`${useCountUp(value, 260)} pts`}</Text>;
}

export default function NewEntry() {
  const repos = useRepositories();
  const { today, profile } = useAppData();
  const params = useLocalSearchParams<{ station?: string }>();
  const [station, setStation] = useState<Station>(STATIONS.includes(params.station as Station) ? (params.station as Station) : 'pushup');
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();
  const isRun = station === 'run';
  const best = useMemo(() => repos.sessions.bestResults(), [repos]);

  const close = () => (router.canGoBack() ? router.back() : router.replace('/log'));
  const parsed = isRun ? parseRunTime(text) : validateReps(text);
  const band = profile && currentTable ? bandForAge(currentTable, scoringAge(profile, today)) : null;
  const worth = parsed.ok && band && currentTable ? stationPoints(currentTable, band.id, station, parsed.value) : null;

  const save = () => {
    if (!parsed.ok) {
      haptic.warn();
      setError(ERRORS[isRun ? 'run' : 'reps'][parsed.error]);
      return;
    }
    haptic.success();
    repos.sessions.add({
      station, source: 'manual', startedAt: now().toISOString(),
      validCount: isRun ? null : parsed.value, runTimeS: isRun ? parsed.value : null,
      noCountForm: null, noCountUnclear: null, runDistanceM: null, adjusted: false,
      externalId: null, ruleConfigVersion: null, modelVersion: null,
    });
    close();
  };

  return (
    <Screen variant="sheet" gap={20} footer={<><Button label="Save" onPress={save} /><Button label="Cancel" secondary onPress={close} /></>}>
      <SheetHandle />
      <Title>Add result</Title>
      <Segmented
        accessibilityLabel="Station"
        options={STATIONS.map((s) => ({ value: s, label: STATION_LABEL[s] }))}
        value={station}
        onChange={(s) => { setStation(s); setError(undefined); setText(''); }}
      />
      <Field
        label={isRun ? 'Time (m:ss)' : 'Reps'}
        value={text}
        onChangeText={(t) => { setText(t); setError(undefined); }}
        error={error}
        placeholder={isRun ? '9:45' : '40'}
        keyboardType={isRun ? 'numbers-and-punctuation' : 'number-pad'}
        onSubmitEditing={save}
      />
      {parsed.ok && worth !== null ? (
        <Animated.View entering={swapIn} exiting={swapOut} style={styles.worth} accessible accessibilityLiveRegion="polite" accessibilityLabel={`Worth ${worth} points. ${compareToBest(station, parsed.value, best[station])}`}>
          <View style={{ gap: 2, flex: 1 }}>
            <Text style={styles.worthLabel}>Worth</Text>
            <Text style={styles.worthDetail}>{compareToBest(station, parsed.value, best[station])}</Text>
          </View>
          <WorthPoints value={worth} />
        </Animated.View>
      ) : null}
      {!isRun ? (
        <Press accessibilityRole="link" onPress={() => router.replace({ pathname: '/camera', params: { station } })} style={styles.cameraLink} hitSlop={8}>
          <Icon name="camera" size={20} color={colors.accent} />
          <Text style={styles.cameraText}>Count with camera instead</Text>
        </Press>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  worth: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.row, paddingVertical: 14, paddingHorizontal: 16 },
  worthLabel: { fontFamily: fonts.medium, fontSize: 15, color: colors.text },
  worthDetail: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  worthPoints: { fontFamily: fonts.display, fontSize: 36, lineHeight: 38, color: colors.accent, ...tabular },
  cameraLink: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, alignSelf: 'flex-start' },
  cameraText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.accent },
});
