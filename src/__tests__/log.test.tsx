import { manualSession, setupTestApp } from '@/app-state/testing';
import type { Profile } from '@/domain/profile';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

const APP = './src/app';
const NOW = '2026-10-21T02:00:00Z';
const P: Profile = { dob: '2005-03-01', status: 'nsf', service: 'saf', eliteVocation: false, ordRodDate: '2026-12-01', ipptDate: null };

afterEach(() => jest.restoreAllMocks());

test('rejects a bad run time and saves a good one', async () => {
  const repos = setupTestApp({ now: NOW, profile: P });
  await renderRouter(APP, { initialUrl: '/log/new' });
  await fireEvent.press(await screen.findByText('2.4km run'));
  await fireEvent.changeText(screen.getByLabelText('Time (m:ss)'), '9.45');
  await fireEvent.press(screen.getByText('Save'));
  expect(await screen.findByText('Enter the time as m:ss, e.g. 9:45.')).toBeTruthy();
  expect(repos.sessions.list()).toEqual([]);
  await fireEvent.changeText(screen.getByLabelText('Time (m:ss)'), '9:45');
  await fireEvent.press(screen.getByText('Save'));
  expect(await screen.findByTestId('session-value')).toBeTruthy(); // back on the Log list
  expect(repos.sessions.list()[0]).toMatchObject({ station: 'run', source: 'manual', runTimeS: 585, startedAt: '2026-10-21T02:00:00.000Z' });
});

test('rejects 101 reps and a non-number', async () => {
  const repos = setupTestApp({ now: NOW, profile: P });
  await renderRouter(APP, { initialUrl: '/log/new' });
  await fireEvent.changeText(await screen.findByLabelText('Reps'), '101');
  await fireEvent.press(screen.getByText('Save'));
  expect(await screen.findByText('Reps must be between 0 and 100.')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Reps'), '3o');
  await fireEvent.press(screen.getByText('Save'));
  expect(await screen.findByText('Enter a whole number of reps.')).toBeTruthy();
  expect(repos.sessions.list()).toEqual([]);
});

test('log lists results newest first with source and date', async () => {
  setupTestApp({ now: NOW, profile: P, sessions: [
    manualSession('pushup', '2026-10-01T10:00:00Z', 30),
    manualSession('run', '2026-10-10T10:00:00Z', 660),
  ] });
  await renderRouter(APP, { initialUrl: '/log' });
  const values = (await screen.findAllByTestId('session-value')).map((n) => n.props.children);
  expect(values).toEqual(['11:00', '30']);
  expect(screen.getByText('10 Oct 2026')).toBeTruthy();
  expect(screen.getByText('1 Oct 2026')).toBeTruthy();
  expect(screen.getAllByText('Typed in')).toHaveLength(2);
  expect(screen.getByText('13 pts')).toBeTruthy();
});

test('delete removes the result at once and Undo puts it back', async () => {
  const repos = setupTestApp({ now: NOW, profile: P, sessions: [manualSession('pushup', '2026-10-01T10:00:00Z', 30)] });
  await renderRouter(APP, { initialUrl: '/log' });
  await fireEvent.press(await screen.findByTestId('session-value'));
  await fireEvent.press(screen.getByText('Delete'));
  expect(repos.sessions.list()).toHaveLength(0);
  expect(await screen.findByText('No results yet. Add one after your next training session.')).toBeTruthy();
  expect(screen.getByText('Push-ups result deleted')).toBeTruthy();
  await fireEvent.press(screen.getByText('Undo'));
  expect(repos.sessions.list()).toHaveLength(1);
  expect(repos.sessions.list()[0]).toMatchObject({ station: 'pushup', validCount: 30, startedAt: '2026-10-01T10:00:00Z' });
});

test('screen readers can delete a result with the Delete action', async () => {
  const repos = setupTestApp({ now: NOW, profile: P, sessions: [manualSession('pushup', '2026-10-01T10:00:00Z', 30)] });
  await renderRouter(APP, { initialUrl: '/log' });
  const row = await screen.findByRole('button', { name: /Push-ups/ });
  await fireEvent(row, 'accessibilityAction', { nativeEvent: { actionName: 'delete' } });
  expect(repos.sessions.list()).toHaveLength(0);
});

test('a station with more than one result marks its best', async () => {
  setupTestApp({ now: NOW, profile: P, sessions: [
    manualSession('pushup', '2026-10-01T10:00:00Z', 30),
    manualSession('pushup', '2026-10-05T10:00:00Z', 36),
    manualSession('situp', '2026-10-05T10:00:00Z', 40),
  ] });
  await renderRouter(APP, { initialUrl: '/log' });
  expect(await screen.findAllByLabelText('Personal best')).toHaveLength(1);
});

test("today's results are headed 'Today' and the hint shows what a result is worth", async () => {
  setupTestApp({ now: NOW, profile: P, sessions: [manualSession('pushup', '2026-10-21T01:00:00Z', 42)] });
  await renderRouter(APP, { initialUrl: '/log' });
  expect(await screen.findByText('Today, 21 Oct')).toBeTruthy();
  await fireEvent.press(screen.getByText('Add result'));
  await fireEvent.changeText(await screen.findByLabelText('Reps'), '50');
  expect(screen.getByText('8 more than your best')).toBeTruthy();
  expect(screen.getByText('21 pts')).toBeTruthy();
});

test('Add result can be opened with a station already picked', async () => {
  setupTestApp({ now: NOW, profile: P });
  await renderRouter(APP, { initialUrl: '/log/new?station=situp' });
  expect(await screen.findByLabelText('Reps')).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Sit-ups' }).props.accessibilityState).toMatchObject({ selected: true });
  await fireEvent.press(screen.getByText('2.4km run'));
  expect(screen.queryByText('Count with camera instead')).toBeNull();
});
