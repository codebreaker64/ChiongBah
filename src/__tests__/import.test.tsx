import { healthImporter } from '@/adapters/health/healthConnect';
import { manualSession, setupTestApp } from '@/app-state/testing';
import type { Profile } from '@/domain/profile';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

const APP = './src/app';
const NOW = '2026-10-21T02:00:00Z';
const P: Profile = { dob: '2005-03-01', status: 'nsf', service: 'saf', eliteVocation: false, ordRodDate: '2026-12-01', ipptDate: null };

afterEach(() => jest.restoreAllMocks());

const fakeHealth = (granted: boolean) => {
  jest.spyOn(healthImporter, 'isAvailable').mockResolvedValue(true);
  jest.spyOn(healthImporter, 'requestAccess').mockResolvedValue(granted);
  jest.spyOn(healthImporter, 'runsSince').mockResolvedValue([
    { id: 'hc-1', startedAt: '2026-10-15T23:00:00Z', distanceM: 2500, durationS: 625 },
    { id: 'hc-2', startedAt: '2026-10-12T23:00:00Z', distanceM: 5000, durationS: 1500 },
    { id: 'hc-old', startedAt: '2026-10-05T23:00:00Z', distanceM: 2400, durationS: 640 },
  ]);
};

test('unavailable explains and still lets you close', async () => {
  setupTestApp({ now: NOW, profile: P });
  await renderRouter(APP, { initialUrl: '/log/import' });
  expect(await screen.findByText("Health Connect isn't available on this phone.")).toBeTruthy();
});

test('connect lists 2.4km candidates and imports one as an adjusted run', async () => {
  fakeHealth(true);
  const already = { ...manualSession('run', '2026-10-05T23:00:00Z', 640), source: 'health_connect' as const, externalId: 'hc-old' };
  const repos = setupTestApp({ now: NOW, profile: P, sessions: [already] });
  await renderRouter(APP, { initialUrl: '/log/import' });
  await fireEvent.press(await screen.findByText('Connect Health Connect'));
  expect(await screen.findByText('2.50 km in 10:25')).toBeTruthy();
  expect(screen.queryByText(/5\.00 km/)).toBeNull();
  expect(screen.getAllByText('Import')).toHaveLength(1);
  await fireEvent.press(screen.getByText('Import'));
  expect(await screen.findByText('Imported 1 run.')).toBeTruthy();
  expect(repos.sessions.list()[0]).toMatchObject({ source: 'health_connect', runTimeS: 600, runDistanceM: 2500, adjusted: true, externalId: 'hc-1' });
});

test('refused access offers settings', async () => {
  fakeHealth(false);
  setupTestApp({ now: NOW, profile: P });
  await renderRouter(APP, { initialUrl: '/log/import' });
  await fireEvent.press(await screen.findByText('Connect Health Connect'));
  expect(await screen.findByText('Open Health Connect settings')).toBeTruthy();
});
