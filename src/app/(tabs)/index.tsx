import { useRepositories } from '@/app-state/RepositoriesContext';
import { useAppData } from '@/app-state/useAppData';
import { homeCountdowns } from '@/domain/countdowns/countdowns';
import { scoringAge } from '@/domain/profile';
import { awardRules, scoreIppt } from '@/domain/scoring/awards';
import { STATIONS } from '@/domain/scoring/table';
import { currentTable } from '@/domain/scoring/tables';
import { Body, Button, Card, colors, Screen, Title } from '@/ui/kit';
import { AWARD_LABEL, formatResult, joinWithAnd, plural, STATION_LABEL, STATION_NOUN } from '@/ui/labels';
import { PracticeEstimateLabel } from '@/ui/PracticeEstimateLabel';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

function Big({ children }: { children: string }) {
  return <Text style={{ fontSize: 22, fontWeight: '600', color: colors.text }}>{children}</Text>;
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

  return (
    <Screen>
      <Title>Chiong Bah</Title>

      {ordRod ? (
        <Card>
          {ordRod.countdown.kind === 'upcoming' ? <Big>{`${plural(ordRod.countdown.days, 'day')} to ${ordRod.label}`}</Big> : null}
          {ordRod.countdown.kind === 'today' ? <Big>{`${ordRod.label} today!`}</Big> : null}
          {ordRod.countdown.kind === 'not_set' ? <Button secondary label={`Set your ${ordRod.label} date`} onPress={() => router.push('/settings')} /> : null}
          {ordRod.countdown.kind === 'passed' ? (
            <>
              <Big>{`Congratulations on your ${ordRod.label}!`}</Big>
              <Button
                label="Switch to NSman"
                onPress={() => {
                  repos.profile.save({ ...profile, status: 'nsman', ordRodDate: null });
                  refresh();
                }}
              />
            </>
          ) : null}
        </Card>
      ) : null}

      <Card>
        {ippt.kind === 'upcoming' ? <Big>{`${plural(ippt.days, 'day')} to IPPT`}</Big> : null}
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

      <Card>
        <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>Latest results</Text>
        {STATIONS.map((s) => {
          const value = latest[s];
          const points = score && !('error' in score) ? score.points[s] : null;
          return (
            <View key={s} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Body>{STATION_LABEL[s]}</Body>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Body>{value === null ? '—' : formatResult(s, value)}</Body>
                {points !== null ? <Body muted>{`${points} pts`}</Body> : null}
              </View>
            </View>
          );
        })}
        {!currentTable ? <Body muted>Scoring tables not added yet.</Body> : null}
        {score && 'error' in score ? <Body muted>{"We can't score your age group yet."}</Body> : null}
        {score && !('error' in score) && score.total === null ? (
          <Body muted>{`Log ${joinWithAnd(missing.map((s) => STATION_NOUN[s]))} to see your total.`}</Body>
        ) : null}
        {score && !('error' in score) && score.total !== null && score.award ? (
          <View style={{ gap: 2 }}>
            <Big>{`Total ${score.total}/100`}</Big>
            <Text style={{ fontSize: 18, color: colors.accent, fontWeight: '600' }}>{AWARD_LABEL[score.award]}</Text>
            <PracticeEstimateLabel />
          </View>
        ) : null}
      </Card>
    </Screen>
  );
}
