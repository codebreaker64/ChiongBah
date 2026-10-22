import Database from 'better-sqlite3';
import type { Db, SqlParam } from './db';

/** In-memory SQLite for Jest. Not bundled into the app. */
export function openTestDb(): Db {
  const sqlite = new Database(':memory:');
  return {
    exec: (sql) => { sqlite.exec(sql); },
    run: (sql, params: SqlParam[] = []) => ({ lastInsertRowId: Number(sqlite.prepare(sql).run(...params).lastInsertRowid) }),
    all: <T,>(sql: string, params: SqlParam[] = []) => sqlite.prepare(sql).all(...params) as T[],
    get: <T,>(sql: string, params: SqlParam[] = []) => sqlite.prepare(sql).get(...params) as T | undefined,
  };
}
