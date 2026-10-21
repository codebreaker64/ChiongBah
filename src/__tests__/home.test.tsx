import { manualSession, setupTestApp, TestAppOptions } from '@/app-state/testing';
import type { Profile } from '@/domain/profile';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

const APP = './src/app';
const NOW = '2026-10-21T02:00:00Z'; // 21 Oct in Singapore
const P: Profile = { dob: '2005-03-01', status: 'nsf', service: 'saf', eliteVocation: false, ordRodDate: '2026-12-01', ipptDate: '2026-11-15' };
const home = async (opts: TestAppOptions) => {
  const repos = setupTestApp({ now: NOW, ...opts });
  await renderRouter(APP);
  return repos;
};

afterEach(() => jest.restoreAllMocks());

test('NSF sees ORD and IPPT countdowns', async () => {
  await home({ profile: P });
  expect(await screen.findByLabelText('41 days to ORD')).toBeTruthy();
  expect(screen.getByLabelText('25 days to IPPT')).toBeTruthy();
});

test('SCDF NSF sees ROD', async () => {
  await home({ profile: { ...P, service: 'scdf' } });
  expect(await screen.findByLabelText('41 days to ROD')).toBeTruthy();
});

test('NSman sees no ORD card', async () => {
  await home({ profile: { ...P, status: 'nsman', ordRodDate: null } });
  expect(await screen.findByLabelText('25 days to IPPT')).toBeTruthy();
  expect(screen.queryByLabelText(/to ORD/)).toBeNull();
});

test('ORD passed offers switch to NSman', async () => {
  const repos = await home({ profile: { ...P, ordRodDate: '2026-10-01' } });
  expect(await screen.findByText('Congratulations on your ORD!')).toBeTruthy();
  await fireEvent.press(screen.getByText('Switch to reservist'));
  expect(repos.profile.get()).toMatchObject({ status: 'nsman', ordRodDate: null });
  expect(screen.queryByText('Congratulations on your ORD!')).toBeNull();
});

test('ORD today', async () => {
  await home({ profile: { ...P, ordRodDate: '2026-10-21' } });
  expect(await screen.findByText('ORD today!')).toBeTruthy();
});

test('IPPT not set links to settings', async () => {
  await home({ profile: { ...P, ipptDate: null } });
  expect(await screen.findByText('Set your IPPT date')).toBeTruthy();
});

test('IPPT passed prompts to log and set next date', async () => {
  await home({ profile: { ...P, ipptDate: '2026-10-20' } });
  expect(await screen.findByText('Your IPPT date has passed. Log your result and set your next date.')).toBeTruthy();
  expect(screen.getByText('Log result')).toBeTruthy();
  expect(screen.getByText('Set next date')).toBeTruthy();
});

test('missing run shows no total', async () => {
  await home({ profile: P, sessions: [manualSession('pushup', '2026-10-01T10:00:00Z', 50), manualSession('situp', '2026-10-01T10:00:00Z', 40)] });
  expect(await screen.findByText('Log 2.4km run to see your total.')).toBeTruthy();
  expect(screen.getByText('21 pts')).toBeTruthy();
  expect(screen.queryByLabelText(/^Total/)).toBeNull();
});

test('full results show total, award and practice label', async () => {
  await home({ profile: P, sessions: [
    manualSession('pushup', '2026-10-01T10:00:00Z', 50),
    manualSession('situp', '2026-10-01T10:00:00Z', 40),
    manualSession('run', '2026-10-01T10:00:00Z', 600),
  ] });
  expect(await screen.findByLabelText('Total 82/100')).toBeTruthy();
  expect(screen.getByText('Silver')).toBeTruthy();
  expect(screen.getByText('Practice estimate')).toBeTruthy();
});

test('header action opens the add result form', async () => {
  await home({ profile: P });
  await fireEvent.press(await screen.findByText('Add result'));
  expect(await screen.findByLabelText('Reps')).toBeTruthy();
});

test('no official table yet', async () => {
  await home({ profile: P, table: null, sessions: [manualSession('pushup', '2026-10-01T10:00:00Z', 50)] });
  expect(await screen.findByText('Scoring tables not added yet.')).toBeTruthy();
  expect(screen.getByText('50 reps')).toBeTruthy();
});

test('age outside the table', async () => {
  await home({ profile: { ...P, dob: '1960-01-01' }, sessions: [manualSession('pushup', '2026-10-01T10:00:00Z', 50)] });
  expect(await screen.findByText("We can't score your age group yet.")).toBeTruthy();
});

test('deleting the newest push-up result falls back to the previous one on Home', async () => {
  await home({ profile: P, sessions: [manualSession('pushup', '2026-10-01T10:00:00Z', 30), manualSession('pushup', '2026-10-10T10:00:00Z', 35)] });
  expect(await screen.findByText('35 reps')).toBeTruthy();
  await fireEvent.press(screen.getByText('Log'));
  const deletes = await screen.findAllByText('Delete');
  await fireEvent.press(deletes[0]); // newest first
  await fireEvent.press(screen.getByText('Yes, delete'));
  await fireEvent.press(screen.getByText('Home'));
  expect(await screen.findByText('30 reps')).toBeTruthy();
  expect(screen.queryByText('35 reps')).toBeNull();
});

test('countdown updates when the app returns from the background on a new day', async () => {
  const clock = jest.requireActual('@/app-state/clock');
  const { AppState } = jest.requireActual('react-native');
  const listen = jest.spyOn(AppState, 'addEventListener');
  await home({ profile: P });
  expect(await screen.findByLabelText('41 days to ORD')).toBeTruthy();
  jest.spyOn(clock, 'now').mockImplementation(() => new Date('2026-10-22T01:00:00Z'));
  const handlers = listen.mock.calls.filter(([type]) => type === 'change').map(([, h]) => h as (s: string) => void);
  expect(handlers.length).toBeGreaterThan(0);
  const { act } = jest.requireActual('expo-router/testing-library');
  await act(async () => handlers.forEach((h) => h('active')));
  expect(await screen.findByLabelText('40 days to ORD')).toBeTruthy();
});
