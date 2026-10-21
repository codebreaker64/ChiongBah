import type { Session } from '@/adapters/storage/repositories';
import { LocalDate, todayInSingapore } from '@/domain/dates';
import type { GoalTarget } from '@/domain/goals/goals';
import type { Profile } from '@/domain/profile';
import type { StationResults } from '@/domain/scoring/awards';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { now } from './clock';
import { useRepositories } from './RepositoriesContext';

export type AppData = {
  today: LocalDate;
  profile: Profile | null;
  goal: GoalTarget | null;
  latest: StationResults;
  sessions: Session[];
  refresh(): void;
};

/** Everything the screens show, re-read when the screen gains focus, the app returns to the foreground, or refresh() is called. */
export function useAppData(): AppData {
  const repos = useRepositories();
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  useFocusEffect(refresh);
  // Re-read when the app comes back to the foreground, so countdowns roll over to a new day.
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const data = useMemo(() => ({
    today: todayInSingapore(now()),
    profile: repos.profile.get(),
    goal: repos.goal.get(),
    latest: repos.sessions.latestResults(),
    sessions: repos.sessions.list(),
  // eslint-disable-next-line react-hooks/exhaustive-deps -- version forces a re-read
  }), [repos, version]);

  return { ...data, refresh };
}
