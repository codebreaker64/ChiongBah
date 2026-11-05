import type { Session } from '@/adapters/storage/repositories';
import { useRepositories } from '@/app-state/RepositoriesContext';
import { useAppData } from '@/app-state/useAppData';
import { LocalDate, todayInSingapore } from '@/domain/dates';
import { scoringAge } from '@/domain/profile';
import { bandForAge, stationPoints } from '@/domain/scoring/table';
import { currentTable } from '@/domain/scoring/tables';
import { Emblem } from '@/ui/Emblem';
import { Body, Header, HeaderAction, ListRow, Press, RowGroup, Screen, SectionTitle } from '@/ui/kit';
import { dayHeading, formatValue, sourceDetail, STATION_LABEL } from '@/ui/labels';
import { colors, fonts, MAX_FONT_SCALE, tabular } from '@/ui/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

const dayOf = (s: Session) => todayInSingapore(new Date(s.startedAt));

/** Sessions (already newest first) split into runs of the same day. */
function byDay(sessions: Session[]): { day: LocalDate; sessions: Session[] }[] {
  const groups: { day: LocalDate; sessions: Session[] }[] = [];
  for (const s of sessions) {
    const day = dayOf(s);
    const last = groups[groups.length - 1];
    if (last?.day === day) last.sessions.push(s);
    else groups.push({ day, sessions: [s] });
  }
  return groups;
}

/** The calendar day before `day`. */
const dayBefore = (day: LocalDate): LocalDate => new Date(Date.parse(`${day}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);

export default function Log() {
  const repos = useRepositories();
  const { today, profile, sessions, refresh } = useAppData();
  const [open, setOpen] = useState<number | null>(null);
  const [confirming, setConfirming] = useState<number | null>(null);
  const band = profile && currentTable ? bandForAge(currentTable, scoringAge(profile, today)) : null;
  const yesterday = dayBefore(today);

  const points = (s: Session): number | null => {
    const value = s.station === 'run' ? s.runTimeS : s.validCount;
    if (!band || !currentTable || value === null) return null;
    return stationPoints(currentTable, band.id, s.station, value);
  };

  return (
    <Screen variant="tab" onRefresh={refresh}>
      <Header title="Log" action={<HeaderAction label="Add result" onPress={() => router.push('/log/new')} />} />
      <RowGroup>
        <ListRow first icon="download" label="Import runs from Health Connect" onPress={() => router.push('/log/import')} />
      </RowGroup>

      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Emblem size={96} />
          <Body muted style={{ textAlign: 'center' }}>No results yet. Add one after your next training session.</Body>
        </View>
      ) : null}

      {byDay(sessions).map((group) => (
        <View key={group.day} style={styles.group}>
          <SectionTitle>{dayHeading(group.day, today, yesterday)}</SectionTitle>
          <RowGroup>
            {group.sessions.map((s, i) => {
              const value = s.station === 'run' ? s.runTimeS : s.validCount;
              const pts = points(s);
              const expanded = open === s.id;
              return (
                <View key={s.id} style={i > 0 && styles.divider}>
                  <Press
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    accessibilityHint={expanded ? 'Hides the delete option' : 'Shows the delete option'}
                    onPress={() => { setOpen(expanded ? null : s.id); setConfirming(null); }}
                    style={styles.row}
                  >
                    <Text testID="session-value" style={styles.value} maxFontSizeMultiplier={MAX_FONT_SCALE}>{value === null ? '—' : formatValue(s.station, value)}</Text>
                    <View style={styles.rowText}>
                      <Text style={styles.station}>{STATION_LABEL[s.station]}</Text>
                      <Text style={styles.source}>{sourceDetail(s)}</Text>
                    </View>
                    {pts !== null ? <Text style={styles.points}>{`${pts} pts`}</Text> : null}
                  </Press>
                  {expanded ? (
                    <View style={styles.actions}>
                      {confirming === s.id ? (
                        <>
                          <Text style={styles.ask}>Delete this result?</Text>
                          <Press accessibilityRole="button" hitSlop={12} onPress={() => { repos.sessions.remove(s.id); setOpen(null); setConfirming(null); refresh(); }}>
                            <Text style={styles.danger}>Yes, delete</Text>
                          </Press>
                          <Press accessibilityRole="button" hitSlop={12} onPress={() => setConfirming(null)}>
                            <Text style={styles.link}>Cancel</Text>
                          </Press>
                        </>
                      ) : (
                        <Press accessibilityRole="button" hitSlop={12} onPress={() => setConfirming(s.id)}>
                          <Text style={styles.danger}>Delete</Text>
                        </Press>
                      )}
                    </View>
                  ) : null}
                </View>
              );
            })}
          </RowGroup>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  empty: { alignItems: 'center', gap: 20, paddingVertical: 40 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, minHeight: 56 },
  value: { width: 64, fontSize: 30, lineHeight: 32, fontFamily: fonts.display, color: colors.text, ...tabular },
  rowText: { flex: 1, gap: 2 },
  station: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  source: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  points: { fontFamily: fonts.semibold, fontSize: 15, color: colors.accent, ...tabular },
  actions: { flexDirection: 'row', gap: 20, alignItems: 'center', flexWrap: 'wrap', paddingHorizontal: 16, paddingBottom: 14, minHeight: 44 },
  ask: { fontFamily: fonts.body, fontSize: 15, color: colors.text },
  danger: { fontFamily: fonts.semibold, color: colors.danger, fontSize: 15 },
  link: { fontFamily: fonts.semibold, color: colors.accent, fontSize: 15 },
});
