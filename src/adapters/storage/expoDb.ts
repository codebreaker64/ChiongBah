import { openDatabaseSync } from 'expo-sqlite';
import type { Db, SqlParam } from './db';

/** The app's on-device database. Checked on a real phone (plan Task 14). */
export function openExpoDb(name = 'ippt.db'): Db {
  const sqlite = openDatabaseSync(name);
  return {
    exec: (sql) => sqlite.execSync(sql),
    run: (sql, params: SqlParam[] = []) => ({ lastInsertRowId: sqlite.runSync(sql, params).lastInsertRowId }),
    all: <T,>(sql: string, params: SqlParam[] = []) => sqlite.getAllSync<T>(sql, params),
    get: <T,>(sql: string, params: SqlParam[] = []) => sqlite.getFirstSync<T>(sql, params) ?? undefined,
  };
}
