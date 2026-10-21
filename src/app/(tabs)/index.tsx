import { useRepositories } from '@/app-state/RepositoriesContext';
import { useAppData } from '@/app-state/useAppData';
import { homeCountdowns } from '@/domain/countdowns/countdowns';
import { scoringAge } from '@/domain/profile';
import { awardRules, scoreIppt } from '@/domain/scoring/awards';
import { MAX_POINTS, STATIONS } from '@/domain/scoring/table';
import { currentTable } from '@/domain/scoring/tables';
import { Body, Button, Card, colors, fonts, Header, HeaderAction, ProgressBar, Screen } from '@/ui/kit';
import { AWARD_LABEL, formatResult, joinWithAnd, plural, STATION_LABEL, STATION_NOUN } from '@/ui/labels';
import { useCountUp } from '@/ui/motion';
import { PracticeEstimateLabel } from '@/ui/PracticeEstimateLabel';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/** A number that counts up to its value when it first appears. */
function CountUp({ value, style }: { value: number; style: object }) {
  return <Text style={style}>{String(useCountUp(value))}</Text>;
}

function Big({ children }: { children: string }) {
  return <Text style={styles.big}>{children}</Text>;
}

/** Days left as a large number, e.g. '25' over 'days to IPPT'. Read out as one sentence. */
function CountdownTile({ days, label }: { days: number; label: string }) {
  const caption = `${days === 1 ? 'day' : 'days'} to ${label}`;
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${plural(days, 'day')} to ${label}`}>
      <CountUp value={days} style={styles.tileNumber} />
      <Text style={styles.tileCaption}>{caption}</Text>
    </View>
  );
}

export default function Home() {
  const repos = useRepositories();
  const { today, profile, latest, refresh } = useAppData();
  if (!profile) return null;
  const { ordRod, ippt } = homeCountdowns(profile, today);

  const score = currentTable
    ? scoreIppt(latest, scoringAge(profile, today), currentTable, profile, awardRules)
    : null;
  const missing = STATIONS.filter((s) => latest[s] === null);
  const scored = score && !('error' in score) ? score : null;
  const total = scored?.total ?? null;

  const upcoming: { days: number; label: string }[] = [];
  if (ippt.kind === 'upcoming') upcoming.push({ days: ippt.days, label: 'IPPT' });
  const ordCountdown = ordRod?.countdown;
  if (ordRod && ordCountdown?.kind === 'upcoming') upcoming.push({ days: ordCountdown.days, label: ordRod.label });

  return (
    <Screen onRefresh={refresh}>
      <Header title="Chiong Bah" action={<HeaderAction label="Add result" onPress={() => router.push('/log/new')} />} />

      <Card>
        <Text style={styles.cardTitle}>IPPT score</Text>
        <View style={styles.scoreRow}>
          <View style={styles.scoreValue} accessible accessibilityLabel={total !== null ? `Total ${total}/100` : 'No total yet'}>
            {total !== null ? <CountUp value={total} style={styles.scoreNumber} /> : <Text style={styles.scoreNumber}>—</Text>}
            <Text style={styles.scoreMax}>/100</Text>
          </View>
          {total !== null && scored?.award ? <Text style={styles.award}>{AWARD_LABEL[scored.award]}</Text> : null}
        </View>
        {total !== null ? <PracticeEstimateLabel /> : null}
        {!currentTable ? <Body muted>Scoring tables not added yet.</Body> : null}
        {score && 'error' in score ? <Body muted>{"We can't score your age group yet."}</Body> : null}
        {scored && total === null ? (
          <Body muted>{`Log ${joinWithAnd(missing.map((s) => STATION_NOUN[s]))} to see your total.`}</Body>
        ) : null}

        <View style={styles.stations}>
          {STATIONS.map((s) => {
            const value = latest[s];
            const points = scored ? scored.points[s] : null;
            return (
              <Pressable
                key={s}
                accessibilityRole="button"
                accessibilityHint="Opens Goals"
                onPress={() => router.push('/goals')}
                style={({ pressed }) => [styles.station, pressed && { opacity: 0.7 }]}
              >
                <View style={styles.stationRow}>
                  <Body>{STATION_LABEL[s]}</Body>
                  <View style={styles.stationValues}>
                    <Body>{value === null ? '—' : formatResult(s, value)}</Body>
                    {points !== null ? <Body muted>{`${points} pts`}</Body> : null}
                  </View>
                </View>
                {points !== null ? <ProgressBar value={points} max={MAX_POINTS[s]} /> : null}
              </Pressable>
            );
          })}
        </View>
      </Card>

      {upcoming.length > 0 ? (
        <View style={styles.tiles}>
          {upcoming.map((u) => <CountdownTile key={u.label} days={u.days} label={u.label} />)}
        </View>
      ) : null}

      {ippt.kind !== 'upcoming' ? (
        <Card>
          {ippt.kind === 'today' ? <Big>IPPT today. Good luck!</Big> : null}
          {ippt.kind === 'not_set' ? <Button secondary label="Set your IPPT date" onPress={() => router.push('/settings')} /> : null}
          {ippt.kind === 'passed' ? (
            <>
              <Body>Your IPPT date has passed. Log your result and set your next date.</Body>
              <Button label="Log result" onPress={() => router.push('/log/new')} />
              <Button secondary label="Set next date" onPress={() => router.push('/settings')} />
            </>
          ) : null}
        </Card>
      ) : null}

      {ordRod && ordRod.countdown.kind !== 'upcoming' ? (
        <Card>
          {ordRod.countdown.kind === 'today' ? <Big>{`${ordRod.label} today!`}</Big> : null}
          {ordRod.countdown.kind === 'not_set' ? <Button secondary label={`Set your ${ordRod.label} date`} onPress={() => router.push('/settings')} /> : null}
          {ordRod.countdown.kind === 'passed' ? (
            <>
              <Big>{`Congratulations on your ${ordRod.label}!`}</Big>
              <Button
                label="Switch to reservist"
                onPress={() => {
                  repos.profile.save({ ...profile, status: 'nsman', ordRodDate: null });
                  refresh();
                }}
              />
            </>
          ) : null}
        </Card>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  big: { fontSize: 26, fontFamily: fonts.displaySemi, color: colors.text },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.muted },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  scoreValue: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  scoreNumber: { fontSize: 88, fontFamily: fonts.display, color: colors.text, fontVariant: ['tabular-nums'], lineHeight: 92 },
  scoreMax: { fontSize: 28, fontFamily: fonts.displaySemi, color: colors.muted },
  award: { fontSize: 26, fontFamily: fonts.displaySemi, color: colors.accent, marginBottom: 14 },
  stations: { gap: 14, marginTop: 8, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  station: { gap: 6 },
  stationRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stationValues: { flexDirection: 'row', gap: 12 },
  tiles: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 16, gap: 2, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  tileNumber: { fontSize: 52, fontFamily: fonts.display, color: colors.text, fontVariant: ['tabular-nums'], lineHeight: 56 },
  tileCaption: { fontSize: 14, color: colors.muted },
});
