// Test-only helpers for screen tests. Never import from app code.
import { migrate } from '@/adapters/storage/db';
import { createRepositories, NewSession, Repositories } from '@/adapters/storage/repositories';
import { openTestDb } from '@/adapters/storage/testDb';
import type { GoalTarget } from '@/domain/goals/goals';
import type { Profile } from '@/domain/profile';
import { miniTable } from '@/domain/scoring/__fixtures__/miniTable';
import type { ScoringTable } from '@/domain/scoring/table';
import * as tables from '@/domain/scoring/tables';
import * as bootstrap from './bootstrap';
import * as clock from './clock';

export type TestAppOptions = {
  now?: string;
  profile?: Profile;
  sessions?: NewSession[];
  goal?: GoalTarget;
  /** Scoring table the screens see; defaults to the mini test table. Pass null for "no official table yet". */
  table?: ScoringTable | null;
};

/** Points the app at a fresh in-memory database and a fixed clock. Call before renderRouter. */
export function setupTestApp(opts: TestAppOptions = {}): Repositories {
  const db = openTestDb();
  migrate(db);
  const repos = createRepositories(db);
  if (opts.profile) repos.profile.save(opts.profile);
  for (const s of opts.sessions ?? []) repos.sessions.add(s);
  if (opts.goal) repos.goal.save(opts.goal, opts.now ?? '2026-10-21T02:00:00Z');

  jest.spyOn(bootstrap, 'createAppRepositories').mockReturnValue(repos);
  jest.spyOn(clock, 'now').mockImplementation(() => new Date(opts.now ?? '2026-10-21T02:00:00Z'));
  jest.replaceProperty(tables, 'currentTable', opts.table === undefined ? miniTable : opts.table);
  return repos;
}

export function manualSession(station: NewSession['station'], startedAt: string, value: number): NewSession {
  return {
    station, source: 'manual', startedAt,
    validCount: station === 'run' ? null : value, runTimeS: station === 'run' ? value : null,
    noCountForm: null, noCountUnclear: null, runDistanceM: null, adjusted: false, externalId: null,
    ruleConfigVersion: null, modelVersion: null,
  };
}
