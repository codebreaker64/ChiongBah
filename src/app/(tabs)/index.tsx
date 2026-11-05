import { useRepositories } from '@/app-state/RepositoriesContext';
import { useAppData } from '@/app-state/useAppData';
import { homeCountdowns } from '@/domain/countdowns/countdowns';
import { scoringAge } from '@/domain/profile';
import { awardRules, nextAward, scoreIppt } from '@/domain/scoring/awards';
import { bandForAge, MAX_POINTS, STATIONS } from '@/domain/scoring/table';
import { currentTable } from '@/domain/scoring/tables';
import { Icon } from '@/ui/Icon';
import { Body, Button, Caption, Card, Header, HeaderAction, Press, ProgressBar, Screen } from '@/ui/kit';
import { AWARD_LABEL, formatResult, joinWithAnd, plural, STATION_LABEL, STATION_NOUN } from '@/ui/labels';
import { useCountUp } from '@/ui/motion';
import { colors, fonts, MAX_FONT_SCALE, radius, tabular } from '@/ui/theme';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

/** A number that counts up to its value when it first appears. */
function CountUp({ value, style }: { value: number; style: object }) {
  return <Text style={style} maxFontSizeMultiplier={MAX_FONT_SCALE}>{String(useCountUp(value))}</Text>;
}

/** Days left as a large number over 'days to IPPT'. Read out as one sentence. */
function CountdownTile({ days, label }: { days: number; label: string }) {
  return (
    <View style={styles.tile} accessible accessibilityLabel={`${plural(days, 'day')} to ${label}`}>
      <Text style={styles.tileNumber} maxFontSizeMultiplier={MAX_FONT_SCALE}>{String(days)}</Text>
      <Text style={styles.tileCaption}>{`${days === 1 ? 'day' : 'days'} to ${label}`}</Text>
    </View>
  );
}

function Big({ children }: { children: string }) {
  return <Text style={styles.big}>{children}</Text>;
}

export default function Home() {
  const repos = useRepositories();
  const { today, profile, latest, refresh } = useAppData();
  if (!profile) return null;
  const { ordRod, ippt } = homeCountdowns(profile, today);

  const age = scoringAge(profile, today);
  const band = currentTable ? bandForAge(currentTable, age) : null;
  const score = currentTable ? scoreIppt(latest, age, currentTable, profile, awardRules) : null;
  const missing = STATIONS.filter((s) => latest[s] === null);
  const scored = score && !('error' in score) ? score : null;
  const total = scored?.total ?? null;
  const next = total !== null && scored?.award !== 'fail' ? nextAward(total, profile, awardRules) : null;

  const upcoming: { days: number; label: string }[] = [];
  if (ippt.kind === 'upcoming') upcoming.push({ days: ippt.days, label: 'IPPT' });
  if (ordRod && ordRod.countdown.kind === 'upcoming') upcoming.push({ days: ordRod.countdown.days, label: ordRod.label });

  return (
    <Screen variant="tab" onRefresh={refresh}>
      <Header title="Chiong Bah" action={<HeaderAction label="Add result" onPress={() => router.push('/log/new')} />} />

      <Card style={styles.hero}>
        <View style={styles.scoreRow}>
          <View style={{ gap: 2 }}>
            <Text style={styles.cardTitle}>IPPT score</Text>
            <View style={styles.scoreValue} accessible accessibilityLabel={total !== null ? `Total ${total}/100` : 'No total yet'}>
              {total !== null ? <CountUp value={total} style={styles.scoreNumber} /> : <Text style={styles.scoreNumber}>—</Text>}
              <Text style={styles.scoreMax}>/100</Text>
            </View>
          </View>
          {total !== null && scored?.award ? (
            <View style={styles.awardCol}>
              <Text style={styles.award}>{AWARD_LABEL[scored.award]}</Text>
              {next ? (
                <Press accessibilityRole="link" onPress={() => router.push('/goals')} hitSlop={10}>
                  <Text style={styles.toNext}>{`${plural(next.pointsToGo, 'point')} to ${AWARD_LABEL[next.award]}`}</Text>
                </Press>
              ) : null}
            </View>
          ) : null}
        </View>
        {!currentTable ? <Body muted small>Scoring tables not added yet.</Body> : null}
        {score && 'error' in score ? <Body muted small>{"We can't score your age group yet."}</Body> : null}
        {scored && total === null ? (
          <Body muted small>{`Log ${joinWithAnd(missing.map((s) => STATION_NOUN[s]))} to see your total.`}</Body>
        ) : null}

        <View style={styles.divider} />
        {STATIONS.map((s, i) => {
          const value = latest[s];
          const points = scored ? scored.points[s] : null;
          return (
            <Press key={s} accessibilityRole="button" accessibilityHint="Opens Goals" onPress={() => router.push('/goals')} style={styles.station}>
              <View style={styles.stationRow}>
                <Text style={styles.stationText}>{STATION_LABEL[s]}</Text>
                <View style={styles.stationValues}>
                  <Text style={styles.stationText}>{value === null ? '—' : formatResult(s, value)}</Text>
                  {points !== null ? <Text style={[styles.stationText, styles.points]}>{`${points} pts`}</Text> : null}
                </View>
              </View>
              {points !== null ? <ProgressBar value={points} max={MAX_POINTS[s]} delay={i * 70} /> : null}
            </Press>
          );
        })}
        {total !== null ? <Caption italic>{band ? `Practice estimate · age group ${band.minAge} to ${band.maxAge}` : 'Practice estimate'}</Caption> : null}
      </Card>

      {upcoming.length > 0 ? (
        <View style={styles.tiles}>
          {upcoming.map((u) => <CountdownTile key={u.label} days={u.days} label={u.label} />)}
        </View>
      ) : null}

      {ippt.kind !== 'upcoming' ? (
        <Card>
          {ippt.kind === 'today' ? <Big>IPPT today. Good luck!</Big> : null}
          {ippt.kind === 'not_set' ? <Button secondary label="Set your IPPT date" onPress={() => router.push({ pathname: '/onboarding/[step]', params: { step: 'ippt', edit: '1' } })} /> : null}
          {ippt.kind === 'passed' ? (
            <>
              <Body>Your IPPT date has passed. Log your result and set your next date.</Body>
              <Button label="Log result" onPress={() => router.push('/log/new')} />
              <Button secondary label="Set next date" onPress={() => router.push({ pathname: '/onboarding/[step]', params: { step: 'ippt', edit: '1' } })} />
            </>
          ) : null}
        </Card>
      ) : null}

      {ordRod && ordRod.countdown.kind !== 'upcoming' ? (
        <Card>
          {ordRod.countdown.kind === 'today' ? <Big>{`${ordRod.label} today!`}</Big> : null}
          {ordRod.countdown.kind === 'not_set' ? <Button secondary label={`Set your ${ordRod.label} date`} onPress={() => router.push({ pathname: '/onboarding/[step]', params: { step: 'ordRod', edit: '1' } })} /> : null}
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

      <Press accessibilityRole="button" onPress={() => router.push('/camera')} style={styles.cameraCard}>
        <View style={styles.cameraIcon}><Icon name="camera" color={colors.accent} /></View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.cameraTitle}>Count reps with camera</Text>
          <Text style={styles.cameraDetail}>Push-ups or sit-ups, timed for 1 minute</Text>
        </View>
        <Icon name="chevron" size={20} color={colors.muted} />
      </Press>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { borderRadius: 18, padding: 18, gap: 14 },
  big: { fontSize: 26, fontFamily: fonts.displaySemi, color: colors.text },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 15, color: colors.muted },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  scoreValue: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  scoreNumber: { fontSize: 84, lineHeight: 84, fontFamily: fonts.display, color: colors.text, ...tabular },
  scoreMax: { fontSize: 26, fontFamily: fonts.displaySemi, color: colors.muted },
  awardCol: { alignItems: 'flex-end', gap: 4, paddingBottom: 8 },
  award: { fontSize: 30, lineHeight: 32, fontFamily: fonts.display, color: colors.accent },
  toNext: { fontFamily: fonts.medium, fontSize: 14, color: colors.text, ...tabular },
  divider: { height: 1, backgroundColor: colors.border },
  station: { gap: 8 },
  stationRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stationText: { fontFamily: fonts.body, fontSize: 15, color: colors.text, ...tabular },
  stationValues: { flexDirection: 'row', gap: 10 },
  points: { color: colors.muted },
  tiles: { flexDirection: 'row', gap: 12 },
  tile: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.card, paddingVertical: 14, paddingHorizontal: 16, gap: 2, borderWidth: 1, borderColor: colors.border },
  tileNumber: { fontSize: 44, lineHeight: 46, fontFamily: fonts.display, color: colors.text, ...tabular },
  tileCaption: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  cameraCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.card, paddingVertical: 14, paddingHorizontal: 16 },
  cameraIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.chip, alignItems: 'center', justifyContent: 'center' },
  cameraTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.text },
  cameraDetail: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
});
