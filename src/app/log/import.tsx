import { healthImporter } from '@/adapters/health/healthConnect';
import { now } from '@/app-state/clock';
import { useRepositories } from '@/app-state/RepositoriesContext';
import { useAppData } from '@/app-state/useAppData';
import { formatLocalDate, todayInSingapore } from '@/domain/dates';
import { formatRunTime } from '@/domain/entries/validate';
import { RunCandidate, runCandidates } from '@/domain/imports/runs';
import { scoringAge } from '@/domain/profile';
import { bandForAge, stationPoints } from '@/domain/scoring/table';
import { currentTable } from '@/domain/scoring/tables';
import { Icon } from '@/ui/Icon';
import { Body, Button, Caption, Card, Press, Screen, SheetHandle, Title } from '@/ui/kit';
import { colors, fonts, MAX_FONT_SCALE, radius, tabular } from '@/ui/theme';
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
  | { kind: 'ready'; runs: RunCandidate[]; imported: Set<string> };

/** '4 Nov' */
const shortDate = (iso: string) => formatLocalDate(todayInSingapore(new Date(iso))).split(' ').slice(0, 2).join(' ');

export default function ImportRuns() {
  const repos = useRepositories();
  const { today, profile } = useAppData();
  const [state, setState] = useState<State>({ kind: 'checking' });
  const band = profile && currentTable ? bandForAge(currentTable, scoringAge(profile, today)) : null;

  const load = useCallback(async () => {
    try {
      const since = new Date(now().getTime() - LOOKBACK_DAYS * 86_400_000).toISOString();
      const runs = runCandidates(await healthImporter.runsSince(since), repos.sessions.importedIds('health_connect'));
      setState({ kind: 'ready', runs, imported: new Set() });
    } catch {
      setState({ kind: 'error' });
    }
  }, [repos]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const ok = await healthImporter.isAvailable();
      if (!alive) return;
      if (!ok) { setState({ kind: 'unavailable' }); return; }
      if (await healthImporter.hasAccess()) { if (alive) await load(); } else if (alive) setState({ kind: 'connect' });
    })().catch(() => { if (alive) setState({ kind: 'error' }); });
    return () => { alive = false; };
  }, [load]);

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
    setState((s) => (s.kind === 'ready' ? { ...s, imported: new Set(s.imported).add(r.id) } : s));
  };

  const close = () => (router.canGoBack() ? router.back() : router.replace('/log'));
  const count = state.kind === 'ready' ? state.imported.size : 0;

  return (
    <Screen variant="sheet" gap={18} footer={<Button secondary label="Done" onPress={close} />}>
      <SheetHandle />
      <View style={{ gap: 8 }}>
        <Title>Import runs</Title>
        {state.kind === 'ready' ? (
          <Body muted small>{`Runs of 2.3 to 2.6 km from the last ${LOOKBACK_DAYS} days in Health Connect, scaled to 2.4 km at the same pace.`}</Body>
        ) : null}
      </View>

      {state.kind === 'checking' ? <Body muted>Checking Health Connect…</Body> : null}

      {state.kind === 'unavailable' ? (
        <Card>
          <Body>Health Connect isn&apos;t available on this phone.</Body>
          <Body muted small>It&apos;s built into Android 14 and later, and can be installed from Google Play on Android 8 to 13. You can still add runs by hand.</Body>
        </Card>
      ) : null}

      {state.kind === 'connect' ? (
        <Card>
          <Body>Bring in 2.4km runs from your watch or any running app that saves to Health Connect.</Body>
          <Body muted small>Chiong Bah only reads your exercise sessions and distance. Nothing leaves your phone.</Body>
          <Button label="Connect Health Connect" onPress={connect} />
        </Card>
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
          {count > 0 ? <Text style={styles.done} accessibilityLiveRegion="polite">{`Imported ${count} ${count === 1 ? 'run' : 'runs'}.`}</Text> : null}
          {state.runs.length === 0 ? <Body muted>No more runs to import.</Body> : null}
          <View style={{ gap: 12 }}>
            {state.runs.map((r) => {
              const done = state.imported.has(r.id);
              const pts = band && currentTable ? stationPoints(currentTable, band.id, 'run', r.runTimeS) : null;
              const meta = [shortDate(r.startedAt), `${(r.distanceM / 1000).toFixed(2)} km in ${formatRunTime(r.durationS)}`, r.sourceApp].filter(Boolean).join(' · ');
              return (
                <View key={r.id} style={styles.run}>
                  <View style={{ flex: 1, gap: 3 }}>
                    <View style={styles.runTop}>
                      <Text style={styles.time} maxFontSizeMultiplier={MAX_FONT_SCALE}>{formatRunTime(r.runTimeS)}</Text>
                      {pts !== null ? <Text style={styles.points}>{`${pts} pts`}</Text> : null}
                    </View>
                    <Text style={styles.meta}>{meta}</Text>
                  </View>
                  {done ? (
                    <View style={styles.imported}>
                      <Icon name="check" size={18} color={colors.muted} strokeWidth={2.4} />
                      <Text style={styles.importedText}>Imported</Text>
                    </View>
                  ) : (
                    <Press accessibilityRole="button" accessibilityLabel={`Import the ${shortDate(r.startedAt)} run`} onPress={() => importRun(r)} ringRadius={20} hitSlop={4} style={styles.importButton}>
                      <Text style={styles.importText}>Import</Text>
                    </Press>
                  )}
                </View>
              );
            })}
          </View>
          <Caption>Scaled times are marked in your log, because GPS distances are rarely exact.</Caption>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  run: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.row, paddingVertical: 14, paddingHorizontal: 16 },
  runTop: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  time: { fontSize: 30, lineHeight: 32, fontFamily: fonts.display, color: colors.text, ...tabular },
  points: { fontFamily: fonts.semibold, fontSize: 15, color: colors.accent, ...tabular },
  meta: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, ...tabular },
  importButton: { height: 40, minWidth: 44, paddingHorizontal: 16, borderRadius: 20, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center' },
  importText: { fontFamily: fonts.semibold, fontSize: 15, color: colors.bg },
  imported: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  importedText: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  done: { fontFamily: fonts.semibold, color: colors.accent, fontSize: 15 },
});
