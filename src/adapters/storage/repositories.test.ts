import type { Profile } from '@/domain/profile';
import type { Station } from '@/domain/scoring/table';
import { migrate } from './db';
import { createRepositories, NewSession, Repositories } from './repositories';
import { openTestDb } from './testDb';

const manual = (station: Station, startedAt: string, v: number): NewSession => ({ station, source: 'manual', startedAt,
  validCount: station === 'run' ? null : v, runTimeS: station === 'run' ? v : null, noCountForm: null, noCountUnclear: null,
  runDistanceM: null, adjusted: false, externalId: null, ruleConfigVersion: null, modelVersion: null });

let repos: Repositories;
beforeEach(() => { const db = openTestDb(); migrate(db); repos = createRepositories(db); });

test('profile round trip', () => {
  expect(repos.profile.get()).toBeNull();
  const p: Profile = { dob: '2004-05-01', status: 'nsf', service: 'spf', eliteVocation: true, ordRodDate: '2026-12-01', ipptDate: null };
  repos.profile.save(p); repos.profile.save({ ...p, ipptDate: '2026-11-15' });
  expect(repos.profile.get()).toEqual({ ...p, ipptDate: '2026-11-15' });
});

test('goal round trip for both kinds', () => {
  expect(repos.goal.get()).toBeNull();
  repos.goal.save({ kind: 'award', award: 'silver' }, '2026-10-21T02:00:00Z');
  expect(repos.goal.get()).toEqual({ kind: 'award', award: 'silver' });
  repos.goal.save({ kind: 'score', points: 70 }, '2026-10-21T02:00:00Z');
  expect(repos.goal.get()).toEqual({ kind: 'score', points: 70 });
  repos.goal.clear();
  expect(repos.goal.get()).toBeNull();
});

test('latestResults ignores practice and falls back after delete', () => {
  repos.sessions.add(manual('pushup', '2026-10-01T10:00:00Z', 30));
  const newer = repos.sessions.add(manual('pushup', '2026-10-10T10:00:00Z', 35));
  repos.sessions.add({ ...manual('pushup', '2026-10-15T10:00:00Z', 50), source: 'camera_practice' });
  repos.sessions.add(manual('run', '2026-10-05T10:00:00Z', 660));
  expect(repos.sessions.latestResults()).toEqual({ pushup: 35, situp: null, run: 660 });
  repos.sessions.remove(newer);
  expect(repos.sessions.latestResults().pushup).toBe(30);
  expect(repos.sessions.list().map(s => s.startedAt)[0]).toBe('2026-10-15T10:00:00Z');
});

test('session round trip keeps every field', () => {
  const s: NewSession = { ...manual('run', '2026-10-05T10:00:00Z', 660), source: 'health_connect', runDistanceM: 2450, adjusted: true, externalId: 'hc-1' };
  const id = repos.sessions.add(s);
  expect(repos.sessions.list()).toEqual([{ ...s, id }]);
});
