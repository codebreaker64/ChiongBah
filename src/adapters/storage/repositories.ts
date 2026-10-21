import type { GoalTarget } from '@/domain/goals/goals';
import type { Profile } from '@/domain/profile';
import type { StationResults } from '@/domain/scoring/awards';
import type { Station } from '@/domain/scoring/table';
import type { Db } from './db';

export type SessionSource = 'camera_test' | 'camera_practice' | 'manual' | 'health_connect';

export type Session = {
  id: number;
  station: Station;
  source: SessionSource;
  startedAt: string; // ISO 8601
  validCount: number | null;
  noCountForm: number | null;
  noCountUnclear: number | null;
  runTimeS: number | null;
  runDistanceM: number | null;
  adjusted: boolean;
  externalId: string | null;
  ruleConfigVersion: string | null;
  modelVersion: string | null;
};
export type NewSession = Omit<Session, 'id'>;

/** Sources whose results count as a station's latest result (practice sets are untimed). */
const RESULT_SOURCES: SessionSource[] = ['camera_test', 'manual', 'health_connect'];

type ProfileRow = { dob: string; status: Profile['status']; service: Profile['service']; elite_vocation: number; ord_rod_date: string | null; ippt_date: string | null };
type GoalRow = { target_kind: GoalTarget['kind']; target_value: string };
type SessionRow = {
  id: number; station: Station; source: SessionSource; started_at: string; valid_count: number | null; no_count_form: number | null;
  no_count_unclear: number | null; run_time_s: number | null; run_distance_m: number | null; adjusted: number; external_id: string | null;
  rule_config_version: string | null; model_version: string | null;
};

export function profileRepo(db: Db) {
  return {
    get(): Profile | null {
      const r = db.get<ProfileRow>('SELECT * FROM profile WHERE id = 1');
      if (!r) return null;
      return { dob: r.dob, status: r.status, service: r.service, eliteVocation: r.elite_vocation === 1, ordRodDate: r.ord_rod_date, ipptDate: r.ippt_date };
    },
    save(p: Profile): void {
      db.run(
        `INSERT OR REPLACE INTO profile (id, dob, status, service, elite_vocation, ord_rod_date, ippt_date) VALUES (1, ?, ?, ?, ?, ?, ?)`,
        [p.dob, p.status, p.service, p.eliteVocation ? 1 : 0, p.ordRodDate, p.ipptDate],
      );
    },
  };
}

export function goalRepo(db: Db) {
  return {
    get(): GoalTarget | null {
      const r = db.get<GoalRow>('SELECT target_kind, target_value FROM goal WHERE id = 1');
      if (!r) return null;
      return r.target_kind === 'score'
        ? { kind: 'score', points: Number(r.target_value) }
        : { kind: 'award', award: r.target_value as Extract<GoalTarget, { kind: 'award' }>['award'] };
    },
    save(t: GoalTarget, createdAt: string): void {
      const value = t.kind === 'score' ? String(t.points) : t.award;
      db.run('INSERT OR REPLACE INTO goal (id, target_kind, target_value, created_at) VALUES (1, ?, ?, ?)', [t.kind, value, createdAt]);
    },
    clear(): void {
      db.run('DELETE FROM goal');
    },
  };
}

function toSession(r: SessionRow): Session {
  return {
    id: r.id, station: r.station, source: r.source, startedAt: r.started_at, validCount: r.valid_count, noCountForm: r.no_count_form,
    noCountUnclear: r.no_count_unclear, runTimeS: r.run_time_s, runDistanceM: r.run_distance_m, adjusted: r.adjusted === 1,
    externalId: r.external_id, ruleConfigVersion: r.rule_config_version, modelVersion: r.model_version,
  };
}

export function sessionRepo(db: Db) {
  return {
    add(s: NewSession): number {
      return db.run(
        `INSERT INTO sessions (station, source, started_at, valid_count, no_count_form, no_count_unclear, run_time_s, run_distance_m,
          adjusted, external_id, rule_config_version, model_version) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.station, s.source, s.startedAt, s.validCount, s.noCountForm, s.noCountUnclear, s.runTimeS, s.runDistanceM,
          s.adjusted ? 1 : 0, s.externalId, s.ruleConfigVersion, s.modelVersion],
      ).lastInsertRowId;
    },
    list(limit = 200): Session[] {
      return db.all<SessionRow>('SELECT * FROM sessions ORDER BY started_at DESC, id DESC LIMIT ?', [limit]).map(toSession);
    },
    remove(id: number): void {
      db.run('DELETE FROM sessions WHERE id = ?', [id]);
    },
    /** External IDs of sessions already imported from `source`, so the same run isn't imported twice. */
    importedIds(source: SessionSource): Set<string> {
      const rows = db.all<{ external_id: string }>('SELECT external_id FROM sessions WHERE source = ? AND external_id IS NOT NULL', [source]);
      return new Set(rows.map((r) => r.external_id));
    },
    latestResults(): StationResults {
      const placeholders = RESULT_SOURCES.map(() => '?').join(', ');
      const latest = (station: Station) => db.get<SessionRow>(
        `SELECT * FROM sessions WHERE station = ? AND source IN (${placeholders}) ORDER BY started_at DESC, id DESC LIMIT 1`,
        [station, ...RESULT_SOURCES],
      );
      const reps = (station: Station) => latest(station)?.valid_count ?? null;
      return { pushup: reps('pushup'), situp: reps('situp'), run: latest('run')?.run_time_s ?? null };
    },
  };
}

export type Repositories = {
  profile: ReturnType<typeof profileRepo>;
  goal: ReturnType<typeof goalRepo>;
  sessions: ReturnType<typeof sessionRepo>;
};

export function createRepositories(db: Db): Repositories {
  return { profile: profileRepo(db), goal: goalRepo(db), sessions: sessionRepo(db) };
}
