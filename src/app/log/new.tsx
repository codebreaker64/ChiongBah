import { now } from '@/app-state/clock';
import { useRepositories } from '@/app-state/RepositoriesContext';
import { parseRunTime, validateReps } from '@/domain/entries/validate';
import type { Station } from '@/domain/scoring/table';
import { Body, Button, Chip, ChipRow, Field, Screen, Title } from '@/ui/kit';
import { STATION_LABEL } from '@/ui/labels';
import { router } from 'expo-router';
import { useState } from 'react';

const ERRORS = {
  reps: { format: 'Enter a whole number of reps.', range: 'Reps must be between 0 and 100.' },
  run: { format: 'Enter the time as m:ss, e.g. 9:45.', range: 'Time must be between 7:00 and 25:00.' },
};

export default function NewEntry() {
  const repos = useRepositories();
  const [station, setStation] = useState<Station>('pushup');
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();
  const isRun = station === 'run';

  const close = () => (router.canGoBack() ? router.back() : router.replace('/log'));

  const save = () => {
    const parsed = isRun ? parseRunTime(text) : validateReps(text);
    if (!parsed.ok) {
      setError(ERRORS[isRun ? 'run' : 'reps'][parsed.error]);
      return;
    }
    repos.sessions.add({
      station, source: 'manual', startedAt: now().toISOString(),
      validCount: isRun ? null : parsed.value, runTimeS: isRun ? parsed.value : null,
      noCountForm: null, noCountUnclear: null, runDistanceM: null, adjusted: false,
      externalId: null, ruleConfigVersion: null, modelVersion: null,
    });
    close();
  };

  return (
    <Screen>
      <Title>Add result</Title>
      <Body muted>Station</Body>
      <ChipRow>
        {(['pushup', 'situp', 'run'] as Station[]).map((s) => (
          <Chip key={s} label={STATION_LABEL[s]} selected={station === s} onPress={() => { setStation(s); setError(undefined); }} />
        ))}
      </ChipRow>
      <Field
        label={isRun ? 'Time (m:ss)' : 'Reps'}
        value={text}
        onChangeText={(t) => { setText(t); setError(undefined); }}
        error={error}
        placeholder={isRun ? '9:45' : '40'}
        keyboardType={isRun ? 'numbers-and-punctuation' : 'number-pad'}
      />
      <Button label="Save" onPress={save} />
      <Button label="Cancel" secondary onPress={close} />
    </Screen>
  );
}
