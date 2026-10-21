import { healthImporter } from '@/adapters/health/healthConnect';
import { useRepositories } from '@/app-state/RepositoriesContext';
import { now } from '@/app-state/clock';
import { formatLocalDate, todayInSingapore } from '@/domain/dates';
import { formatRunTime } from '@/domain/entries/validate';
import { RunCandidate, runCandidates } from '@/domain/imports/runs';
import { Emblem } from '@/ui/Emblem';
import { Body, Button, Card, colors, Screen, Title } from '@/ui/kit';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const LOOKBACK_DAYS = 90;

type State =
  | { kind: 'checking' }
  | { kind: 'unavailable' }
  | { kind: 'connect' }
  | { kind: 'denied' }
  | { kind: 'error' }
  | { kind: 'ready'; runs: RunCandidate[]; imported: number };

export default function ImportRuns() {
  const repos = useRepositories();
  const [state, setState] = useState<State>({ kind: 'checking' });

  const load = useCallback(async () => {
    try {
      const since = new Date(now().getTime() - LOOKBACK_DAYS * 86_400_000).toISOString();
      const runs = runCandidates(await healthImporter.runsSince(since), repos.sessions.importedIds('health_connect'));
      setState({ kind: 'ready', runs, imported: 0 });
    } catch {
      setState({ kind: 'error' });
    }
  }, [repos]);

  useEffect(() => {
    let alive = true;
    healthImporter.isAvailable().then((ok) => { if (alive) setState({ kind: ok ? 'connect' : 'unavailable' }); });
    return () => { alive = false; };
  }, []);

  const connect = async () => {
    setState({ kind: 'checking' });
    try {
      if (await healthImporter.requestAccess()) await load();
      else setState({ kind: 'denied' });
    } catch {
      setState({ kind: 'error' });
    }
  };

  const importRun = (r: RunCandidate) => {
    repos.sessions.add({
      station: 'run', source: 'health_connect', startedAt: r.startedAt,
      validCount: null, runTimeS: r.runTimeS, runDistanceM: r.distanceM, adjusted: r.adjusted,
      noCountForm: null, noCountUnclear: null, externalId: r.id, ruleConfigVersion: null, modelVersion: null,
    });
    setState((s) => (s.kind === 'ready' ? { ...s, runs: s.runs.filter((x) => x.id !== r.id), imported: s.imported + 1 } : s));
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace('/log'));

  return (
    <Screen>
      <Title>Import runs</Title>
      {state.kind === 'checking' ? <Body muted>Checking Health Connect…</Body> : null}

      {state.kind === 'unavailable' ? (
        <View style={styles.center}>
          <Emblem symbol={{ ios: 'heart.text.square', android: 'monitor_heart', web: 'monitor_heart' }} />
          <Body>Health Connect isn&apos;t available on this phone.</Body>
          <Body muted>It&apos;s built into Android 14 and later, and can be installed from Google Play on Android 8 to 13. You can still add runs by hand.</Body>
        </View>
      ) : null}

      {state.kind === 'connect' ? (
        <View style={styles.center}>
          <Emblem symbol={{ ios: 'heart.text.square', android: 'monitor_heart', web: 'monitor_heart' }} />
          <Body>Bring in 2.4km runs from your watch or any running app that saves to Health Connect.</Body>
          <Body muted>Chiong Bah only reads your exercise sessions and distance. Nothing leaves your phone.</Body>
          <Button label="Connect Health Connect" onPress={connect} />
        </View>
      ) : null}

      {state.kind === 'denied' ? (
        <Card>
          <Body>Chiong Bah needs permission to read exercise and distance to find your runs.</Body>
          <Button label="Try again" onPress={connect} />
          <Button secondary label="Open Health Connect settings" onPress={() => healthImporter.openSettings()} />
        </Card>
      ) : null}

      {state.kind === 'error' ? (
        <Card>
          <Body>Something went wrong reading Health Connect.</Body>
          <Button label="Try again" onPress={connect} />
        </Card>
      ) : null}

      {state.kind === 'ready' ? (
        <>
          <Body muted>{`Runs between 2.3 and 2.6 km from the last ${LOOKBACK_DAYS} days. Times are scaled to 2.4 km at the same pace.`}</Body>
          {state.imported > 0 ? <Text style={styles.done}>{`Imported ${state.imported} ${state.imported === 1 ? 'run' : 'runs'}.`}</Text> : null}
          {state.runs.length === 0 ? <Body muted>No more runs to import.</Body> : null}
          {state.runs.map((r) => (
            <Card key={r.id}>
              <View style={styles.row}>
                <View style={styles.text}>
                  <Text style={styles.date}>{formatLocalDate(todayInSingapore(new Date(r.startedAt)))}</Text>
                  <Body muted>{`${(r.distanceM / 1000).toFixed(2)} km in ${formatRunTime(r.durationS)}`}</Body>
                </View>
                <View style={styles.result}>
                  <Text style={styles.time}>{formatRunTime(r.runTimeS)}</Text>
                  <Body muted>{r.adjusted ? 'scaled to 2.4 km' : '2.4 km'}</Body>
                </View>
              </View>
              <Button secondary label="Import" onPress={() => importRun(r)} />
            </Card>
          ))}
        </>
      ) : null}

      <Button secondary label="Done" onPress={close} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'stretch', gap: 16, paddingVertical: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  text: { gap: 2 },
  date: { fontSize: 16, fontWeight: '600', color: colors.text },
  result: { alignItems: 'flex-end' },
  time: { fontSize: 24, fontWeight: '700', color: colors.accent, fontVariant: ['tabular-nums'] },
  done: { color: colors.accent, fontSize: 15, fontWeight: '600' },
});
