import { useRepositories } from '@/app-state/RepositoriesContext';
import { useAppData } from '@/app-state/useAppData';
import { Body, Button, Card, colors, Screen, Title } from '@/ui/kit';
import { SOURCE_LABEL, sessionDate, sessionValue, STATION_LABEL } from '@/ui/labels';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export default function Log() {
  const repos = useRepositories();
  const { sessions, refresh } = useAppData();
  const [confirming, setConfirming] = useState<number | null>(null);

  return (
    <Screen>
      <Title>Log</Title>
      <Button label="Add result" onPress={() => router.push('/log/new')} />
      {sessions.length === 0 ? <Body muted>No results yet. Add one after your next training session.</Body> : null}
      {sessions.map((s) => (
        <Card key={s.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: colors.text }}>{STATION_LABEL[s.station]}</Text>
            <Text testID="session-value" style={{ fontSize: 18, color: colors.text }}>{sessionValue(s)}</Text>
          </View>
          <Body muted>{`${sessionDate(s)} · ${SOURCE_LABEL[s.source]}`}</Body>
          {confirming === s.id ? (
            <View style={{ gap: 8 }}>
              <Body>Delete this result?</Body>
              <View style={{ flexDirection: 'row', gap: 16 }}>
                <Pressable accessibilityRole="button" onPress={() => { repos.sessions.remove(s.id); setConfirming(null); refresh(); }}>
                  <Text style={{ color: colors.danger, fontSize: 15 }}>Yes, delete</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => setConfirming(null)}>
                  <Text style={{ color: colors.accent, fontSize: 15 }}>Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => setConfirming(s.id)} style={{ alignSelf: 'flex-start' }}>
              <Text style={{ color: colors.danger, fontSize: 15 }}>Delete</Text>
            </Pressable>
          )}
        </Card>
      ))}
    </Screen>
  );
}
