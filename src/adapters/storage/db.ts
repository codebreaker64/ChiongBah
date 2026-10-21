import { migrations as defaultMigrations } from './migrations';

export type SqlParam = string | number | null;

/** The small slice of SQLite the app uses, so repositories run on expo-sqlite and on better-sqlite3 in tests. */
export interface Db {
  exec(sql: string): void;
  run(sql: string, params?: SqlParam[]): { lastInsertRowId: number };
  all<T>(sql: string, params?: SqlParam[]): T[];
  get<T>(sql: string, params?: SqlParam[]): T | undefined;
}

function schemaVersion(db: Db): number {
  db.exec('CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  const row = db.get<{ value: string }>("SELECT value FROM meta WHERE key = 'schema_version'");
  return row ? Number(row.value) : 0;
}

/** Runs pending migrations, each in its own transaction together with its version bump. */
export function migrate(db: Db, migrations: string[] = defaultMigrations): void {
  for (let version = schemaVersion(db); version < migrations.length; version++) {
    db.exec('BEGIN');
    try {
      db.exec(migrations[version]);
      db.run("INSERT OR REPLACE INTO meta (key, value) VALUES ('schema_version', ?)", [String(version + 1)]);
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
}
