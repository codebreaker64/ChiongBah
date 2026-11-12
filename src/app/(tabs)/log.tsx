import type { Session } from '@/adapters/storage/repositories';
import { useRepositories } from '@/app-state/RepositoriesContext';
import { useAppData } from '@/app-state/useAppData';
import { LocalDate, todayInSingapore } from '@/domain/dates';
import { scoringAge } from '@/domain/profile';
import { bandForAge, stationPoints } from '@/domain/scoring/table';
import { currentTable } from '@/domain/scoring/tables';
import { Emblem } from '@/ui/Emblem';
import { haptic } from '@/ui/haptics';
import { Icon } from '@/ui/Icon';
import { SwipeToDelete, useSnackbar } from '@/ui/interactive';
import { Body, Button, Header, ListRow, Press, RowGroup, Screen, SectionTitle } from '@/ui/kit';
import { enter, leave, reflow, swapIn, swapOut } from '@/ui/motion';
import { dayHeading, formatValue, sourceDetail, STATION_LABEL } from '@/ui/labels';
import { colors, fonts, MAX_FONT_SCALE, tabular } from '@/ui/theme';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

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

/** For each station, the id of its best result, when it has more than one result to beat. */
function bestIds(sessions: Session[]): Set<number> {
  const best = new Map<string, Session>();
  const count = new Map<string, number>();
  for (const s of sessions) {
    const v = s.station === 'run' ? s.runTimeS : s.validCount;
    if (v === null || s.source === 'camera_practice') continue;
    count.set(s.station, (count.get(s.station) ?? 0) + 1);
    const b = best.get(s.station);
    const bv = b ? (b.station === 'run' ? b.runTimeS : b.validCount) : null;
    if (bv === null || (s.station === 'run' ? v < bv : v > bv)) best.set(s.station, s);
  }
  return new Set([...best.entries()].filter(([st]) => (count.get(st) ?? 0) > 1).map(([, s]) => s.id));
}

export default function Log() {
  const repos = useRepositories();
  const snackbar = useSnackbar();
  const { today, profile, sessions, refresh } = useAppData();
  const [open, setOpen] = useState<number | null>(null);
  const band = profile && currentTable ? bandForAge(currentTable, scoringAge(profile, today)) : null;
  const yesterday = dayBefore(today);
  const bests = bestIds(sessions);

  const points = (s: Session): number | null => {
    const value = s.station === 'run' ? s.runTimeS : s.validCount;
    if (!band || !currentTable || value === null) return null;
    return stationPoints(currentTable, band.id, s.station, value);
  };

  /** Deletes at once and offers Undo, which puts the same result back. */
  const remove = (s: Session) => {
    haptic.warn();
    repos.sessions.remove(s.id);
    setOpen(null);
    refresh();
    const { id: _id, ...rest } = s;
    snackbar.show({
      text: `${STATION_LABEL[s.station]} result deleted`,
      action: { label: 'Undo', onPress: () => { repos.sessions.add(rest); refresh(); } },
    });
  };

  let index = 0;
  return (
    <Screen variant="tab" onRefresh={refresh} fab={{ label: 'Add result', onPress: () => router.push('/log/new') }}>
      <Header title="Log" />
      <RowGroup>
        <ListRow first icon="download" label="Import runs from Health Connect" onPress={() => router.push('/log/import')} />
      </RowGroup>

      {sessions.length === 0 ? (
        <Animated.View entering={enter(1)} style={styles.empty}>
          <Emblem size={96} />
          <Body muted style={{ textAlign: 'center' }}>No results yet. Add one after your next training session.</Body>
        </Animated.View>
      ) : (
        <Text style={styles.hint}>Swipe a result left to delete it.</Text>
      )}

      {byDay(sessions).map((group) => (
        <Animated.View key={group.day} layout={reflow} exiting={leave} style={styles.group}>
          <SectionTitle>{dayHeading(group.day, today, yesterday)}</SectionTitle>
          <RowGroup>
            {group.sessions.map((s, i) => {
              const value = s.station === 'run' ? s.runTimeS : s.validCount;
              const pts = points(s);
              const expanded = open === s.id;
              const best = bests.has(s.id);
              return (
                <Animated.View key={s.id} entering={enter(index++)} exiting={leave} layout={reflow} style={i > 0 && styles.divider}>
                  <SwipeToDelete onDelete={() => remove(s)}>
                    <Press
                      accessibilityRole="button"
                      accessibilityState={{ expanded }}
                      accessibilityHint={expanded ? 'Hides the delete option' : 'Shows the delete option'}
                      accessibilityActions={[{ name: 'delete', label: 'Delete' }]}
                      onAccessibilityAction={(e) => { if (e.nativeEvent.actionName === 'delete') remove(s); }}
                      onPress={() => setOpen(expanded ? null : s.id)}
                      scaleTo={1}
                      style={styles.row}
                    >
                      <Text testID="session-value" style={styles.value} numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE}>{value === null ? '—' : formatValue(s.station, value)}</Text>
                      <View style={styles.rowText}>
                        <View style={styles.titleLine}>
                          <Text style={styles.station}>{STATION_LABEL[s.station]}</Text>
                          {best ? (
                            <View style={styles.best} accessibilityLabel="Personal best">
                              <Icon name="medal" size={12} color={colors.gold} strokeWidth={2.4} />
                              <Text style={styles.bestText}>Best</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={styles.source}>{sourceDetail(s)}</Text>
                      </View>
                      {pts !== null ? <Text style={styles.points}>{`${pts} pts`}</Text> : null}
                    </Press>
                    {expanded ? (
                      <Animated.View entering={swapIn} exiting={swapOut} style={styles.actions}>
                        <Button variant="tertiary" icon="trash" label="Delete" onPress={() => remove(s)} />
                      </Animated.View>
                    ) : null}
                  </SwipeToDelete>
                </Animated.View>
              );
            })}
          </RowGroup>
        </Animated.View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  empty: { alignItems: 'center', gap: 20, paddingVertical: 40 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16, minHeight: 56 },
  value: { minWidth: 64, fontSize: 30, lineHeight: 32, fontFamily: fonts.display, color: colors.text, ...tabular },
  rowText: { flex: 1, gap: 2 },
  station: { fontFamily: fonts.medium, fontSize: 16, color: colors.text },
  source: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  points: { fontFamily: fonts.semibold, fontSize: 15, color: colors.accent, ...tabular },
  actions: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 14 },
  hint: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, marginTop: -4 },
  titleLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  best: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, height: 20, borderRadius: 10, backgroundColor: '#2A2416' },
  bestText: { fontFamily: fonts.semibold, fontSize: 11, color: colors.gold },
});
