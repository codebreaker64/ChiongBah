import { manualSession, setupTestApp, TestAppOptions } from '@/app-state/testing';
import type { Profile } from '@/domain/profile';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

const APP = './src/app';
const NOW = '2026-10-21T02:00:00Z';
const P: Profile = { dob: '2005-03-01', status: 'nsman', service: 'saf', eliteVocation: false, ordRodDate: null, ipptDate: '2026-11-15' };
const ALL = [
  manualSession('pushup', '2026-10-01T10:00:00Z', 45),
  manualSession('situp', '2026-10-01T10:00:00Z', 40),
  manualSession('run', '2026-10-01T10:00:00Z', 650),
];
const goals = async (opts: TestAppOptions) => {
  const repos = setupTestApp({ now: NOW, profile: P, ...opts });
  await renderRouter(APP, { initialUrl: '/goals' });
  return repos;
};

afterEach(() => jest.restoreAllMocks());

test('no goal prompts to pick one', async () => {
  await goals({});
  expect(await screen.findByText('Pick a target to see your gap.')).toBeTruthy();
});

test('picking Gold shows target, gap, steps and cheapest station', async () => {
  const repos = await goals({ sessions: ALL });
  await fireEvent.press(await screen.findByText('Gold'));
  expect(await screen.findByText('Target 85 points')).toBeTruthy();
  expect(screen.getByText('16 points to go')).toBeTruthy();
  expect(screen.getByText('IPPT in 25 days')).toBeTruthy();
  expect(screen.getByText('+5 reps → 21 pts (11.1%)')).toBeTruthy();
  expect(screen.getByText('−50 s → 44 pts (7.7%)')).toBeTruthy();
  expect(screen.getAllByText('Cheapest points')).toHaveLength(1);
  expect(repos.goal.get()).toEqual({ kind: 'award', award: 'gold' });
});

test('custom score outside 1–100 is rejected; a valid one is saved', async () => {
  const repos = await goals({ sessions: ALL });
  await fireEvent.press(await screen.findByText('Custom score'));
  for (const bad of ['0', '101', 'abc']) {
    await fireEvent.changeText(screen.getByLabelText('Custom score'), bad);
    await fireEvent.press(screen.getByText('Set target'));
    expect(await screen.findByText('Enter a score from 1 to 100.')).toBeTruthy();
  }
  expect(repos.goal.get()).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Custom score'), '60');
  await fireEvent.press(screen.getByText('Set target'));
  expect(await screen.findByText('Target 60 points')).toBeTruthy();
  expect(screen.getByText('Target met')).toBeTruthy();
  expect(repos.goal.get()).toEqual({ kind: 'score', points: 60 });
});

test('a missing station hides the total gap', async () => {
  await goals({ sessions: ALL.slice(0, 2), goal: { kind: 'award', award: 'silver' } });
  expect(await screen.findByText('Log all three stations to see your gap.')).toBeTruthy();
  expect(screen.getByText('No result yet')).toBeTruthy();
});

test('no official table yet', async () => {
  await goals({ sessions: ALL, goal: { kind: 'award', award: 'silver' }, table: null });
  expect(await screen.findByText('Scoring tables not added yet.')).toBeTruthy();
});
