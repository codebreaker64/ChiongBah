import type { Session } from '@/adapters/storage/repositories';
import { useRepositories } from '@/app-state/RepositoriesContext';
import { useAppData } from '@/app-state/useAppData';
import { Body, colors, Eyebrow, Header, HeaderAction, Screen } from '@/ui/kit';
import { SOURCE_LABEL, sessionDate, sessionValue, STATION_LABEL } from '@/ui/labels';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

/** Sessions (already newest first) split into runs of the same day. */
function byDay(sessions: Session[]): { day: string; sessions: Session[] }[] {
  const groups: { day: string; sessions: Session[] }[] = [];
  for (const s of sessions) {
    const day = sessionDate(s);
    const last = groups[groups.length - 1];
    if (last?.day === day) last.sessions.push(s);
    else groups.push({ day, sessions: [s] });
  }
  return groups;
}

export default function Log() {
  const repos = useRepositories();
  const { sessions, refresh } = useAppData();
  const [confirming, setConfirming] = useState<number | null>(null);

  return (
    <Screen>
      <Header title="Log" action={<HeaderAction label="+ Add result" onPress={() => router.push('/log/new')} />} />
      {sessions.length === 0 ? <Body muted>No results yet. Add one after your next training session.</Body> : null}
      {byDay(sessions).map((group) => (
        <View key={group.day} style={styles.group}>
          <Eyebrow>{group.day}</Eyebrow>
          <View style={styles.card}>
            {group.sessions.map((s, i) => (
              <View key={s.id} style={[styles.row, i > 0 && styles.divider]}>
                <View style={styles.rowTop}>
                  <View style={styles.rowText}>
                    <Text style={styles.station}>{STATION_LABEL[s.station]}</Text>
                    <Body muted>{SOURCE_LABEL[s.source]}</Body>
                  </View>
                  <Text testID="session-value" style={styles.value}>{sessionValue(s)}</Text>
                </View>
                {confirming === s.id ? (
                  <View style={styles.actions}>
                    <Body>Delete this result?</Body>
                    <Pressable accessibilityRole="button" hitSlop={8} onPress={() => { repos.sessions.remove(s.id); setConfirming(null); refresh(); }}>
                      <Text style={styles.danger}>Yes, delete</Text>
                    </Pressable>
                    <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setConfirming(null)}>
                      <Text style={styles.link}>Cancel</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setConfirming(s.id)} style={{ alignSelf: 'flex-start' }}>
                    <Text style={styles.danger}>Delete</Text>
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8, marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: 12, paddingHorizontal: 16, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  row: { paddingVertical: 14, gap: 8 },
  divider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowText: { gap: 2 },
  station: { fontSize: 16, fontWeight: '600', color: colors.text },
  value: { fontSize: 24, fontWeight: '700', color: colors.accent, fontVariant: ['tabular-nums'] },
  actions: { flexDirection: 'row', gap: 16, alignItems: 'center', flexWrap: 'wrap' },
  danger: { color: colors.danger, fontSize: 15 },
  link: { color: colors.accent, fontSize: 15 },
});
