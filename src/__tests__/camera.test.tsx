import { manualSession, setupTestApp } from '@/app-state/testing';
import type { Profile } from '@/domain/profile';
import { act, fireEvent, renderRouter, screen } from 'expo-router/testing-library';

const mockPermission = { granted: false, canAskAgain: true };
const mockRequest = jest.fn(async () => ({ granted: true, canAskAgain: true }));

jest.mock('expo-camera', () => {
  const { View } = jest.requireActual('react-native');
  return {
    CameraView: (props: object) => <View testID="camera-view" {...props} />,
    useCameraPermissions: () => [mockPermission, mockRequest],
  };
});

const APP = './src/app';
const NOW = '2026-10-21T02:00:00Z';
const P: Profile = { dob: '2005-03-01', status: 'nsf', service: 'saf', eliteVocation: false, ordRodDate: '2026-12-01', ipptDate: '2026-11-15' };
const COUNTDOWN = { timeout: 8000 };

beforeEach(() => {
  mockPermission.granted = false;
  mockPermission.canAskAgain = true;
  mockRequest.mockClear();
});
afterEach(() => jest.restoreAllMocks());

/** Through "Start anyway" and the spoken 3-2-1 to the live set. */
async function startSet() {
  await fireEvent.press(await screen.findByText('Start anyway'));
  expect(await screen.findByText('Stop', {}, COUNTDOWN)).toBeTruthy();
}

test('sit-ups from start to saved: allow camera, count by tap, a no-count, stop, correct and save', async () => {
  const repos = setupTestApp({ now: NOW, profile: P, sessions: [manualSession('situp', '2026-10-01T10:00:00Z', 38)] });
  await renderRouter(APP, { initialUrl: '/camera' });

  await fireEvent.press(await screen.findByText('Sit-ups'));
  expect(screen.getByText('Best 38')).toBeTruthy();
  expect(screen.getByText('Knees bent, feet flat or held by a buddy.')).toBeTruthy();
  expect(screen.getByLabelText(/doing sit-ups$/)).toBeTruthy();
  await fireEvent.press(screen.getByText('Continue'));

  expect(await screen.findByText('Allow camera access')).toBeTruthy();
  await fireEvent.press(screen.getByText('Allow camera'));
  expect(mockRequest).toHaveBeenCalledTimes(1);

  expect(await screen.findByText('Sit-ups · 1:00')).toBeTruthy();
  expect(screen.getByLabelText('Knees bent: not checked')).toBeTruthy();
  await startSet();

  for (let i = 0; i < 3; i++) await fireEvent.press(screen.getByLabelText('Count a rep'));
  await act(async () => { fireEvent(screen.getByLabelText('Count a rep'), 'longPress'); });
  expect(screen.getByLabelText('3 reps')).toBeTruthy();
  expect(screen.getByText('1 not counted')).toBeTruthy();
  expect(screen.getByText("That one didn't count")).toBeTruthy();
  expect(screen.getByText('Best so far: 38')).toBeTruthy();
  await fireEvent.press(screen.getByText('Stop'));

  expect(await screen.findByText('Sit-ups in 1 minute')).toBeTruthy();
  expect(screen.getByLabelText('3 reps, 0 points')).toBeTruthy();
  expect(screen.getByText('Your best is 38 (13 pts).')).toBeTruthy();
  expect(screen.getByText('1 not counted.')).toBeTruthy();
  expect(screen.getByText('Camera count · practice estimate')).toBeTruthy();
  expect(screen.queryByText('New best')).toBeNull();

  await fireEvent.press(screen.getByLabelText('One more rep'));
  expect(screen.getByLabelText('4 reps, 0 points')).toBeTruthy();
  expect(screen.getByText('Corrected from 3')).toBeTruthy();
  await fireEvent.press(screen.getByText('Save to log'));

  expect(await screen.findByText('Camera count, corrected')).toBeTruthy();
  expect(repos.sessions.list()[0]).toMatchObject({ station: 'situp', source: 'camera_test', validCount: 4, adjusted: true, noCountForm: 1, ruleConfigVersion: expect.stringMatching(/^situp-/) });
}, 30000);

test('push-ups with permission already granted skip the access screen; try again, then discard', async () => {
  mockPermission.granted = true;
  const repos = setupTestApp({ now: NOW, profile: P });
  await renderRouter(APP, { initialUrl: '/camera' });
  expect(await screen.findByText('Good light and a plain background help.')).toBeTruthy();
  await fireEvent.press(screen.getByText('Continue'));

  expect(await screen.findByText('Push-ups · 1:00')).toBeTruthy();
  expect(screen.queryByText('Allow camera access')).toBeNull();
  expect(screen.getByLabelText('In push-up position: not checked')).toBeTruthy();
  await startSet();
  await fireEvent.press(screen.getByLabelText('Count a rep'));
  await fireEvent.press(screen.getByText('Stop'));

  expect(await screen.findByText('Push-ups in 1 minute')).toBeTruthy();
  expect(screen.getByText('Your first result for this station.')).toBeTruthy();
  await fireEvent.press(screen.getByText('Try again'));
  expect(await screen.findByText('Push-ups · 1:00')).toBeTruthy();
  await startSet();
  await fireEvent.press(screen.getByText('Stop'));
  expect(await screen.findByText('Push-ups in 1 minute')).toBeTruthy();
  await fireEvent.press(screen.getByText('Discard'));

  expect(await screen.findByText('Count reps with camera')).toBeTruthy();
  expect(repos.sessions.list()).toEqual([]);
  expect(mockRequest).not.toHaveBeenCalled();
}, 30000);

test('a new best shows the badge and the total it would give', async () => {
  mockPermission.granted = true;
  setupTestApp({ now: NOW, profile: P, sessions: [
    manualSession('pushup', '2026-10-01T10:00:00Z', 1),
    manualSession('situp', '2026-10-01T10:00:00Z', 40),
    manualSession('run', '2026-10-01T10:00:00Z', 600),
  ] });
  await renderRouter(APP, { initialUrl: '/camera' });
  await fireEvent.press(await screen.findByText('Continue'));
  await startSet();
  for (let i = 0; i < 5; i++) await fireEvent.press(screen.getByLabelText('Count a rep'));
  await fireEvent.press(screen.getByText('Stop'));
  expect(await screen.findByText('New best')).toBeTruthy();
  // 5 push-ups is 1 point in the test table: 1 + 17 + 44.
  expect(screen.getByText('Up from 1 (0 pts). Your total would be 62.')).toBeTruthy();
}, 30000);

test('"Type my reps instead" opens Add result on the chosen station', async () => {
  setupTestApp({ now: NOW, profile: P });
  await renderRouter(APP, { initialUrl: '/camera' });
  await fireEvent.press(await screen.findByText('Sit-ups'));
  await fireEvent.press(screen.getByText('Continue'));
  await fireEvent.press(await screen.findByText('Type my reps instead'));
  expect(await screen.findByLabelText('Reps')).toBeTruthy();
  expect(screen.getByRole('radio', { name: 'Sit-ups' }).props.accessibilityState).toMatchObject({ selected: true });
});

test('a permanently refused permission offers Android settings', async () => {
  mockPermission.canAskAgain = false;
  setupTestApp({ now: NOW, profile: P });
  await renderRouter(APP, { initialUrl: '/camera/access' });
  expect(await screen.findByText('Open settings')).toBeTruthy();
});

test('Add result links to the camera for push-ups and sit-ups only', async () => {
  setupTestApp({ now: NOW, profile: P });
  await renderRouter(APP, { initialUrl: '/log/new' });
  await fireEvent.press(await screen.findByText('Count with camera instead'));
  expect(await screen.findByText('Count with camera')).toBeTruthy();
});
