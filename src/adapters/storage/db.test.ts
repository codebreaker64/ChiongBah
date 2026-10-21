import { migrate } from './db';
import { openTestDb } from './testDb';

test('migrate creates schema version 1 and is idempotent', () => {
  const db = openTestDb();
  migrate(db); migrate(db);
  expect(db.get<{ value: string }>("SELECT value FROM meta WHERE key = 'schema_version'")?.value).toBe('1');
  expect(db.all<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").map(r => r.name))
    .toEqual(expect.arrayContaining(['goal', 'meta', 'profile', 'sessions']));
});

test('a failing migration leaves the database unchanged', () => {
  const db = openTestDb();
  expect(() => migrate(db, ['CREATE TABLE a (x INTEGER); CREATE TABLE a (x INTEGER);'])).toThrow();
  expect(db.all("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'a'")).toEqual([]);
});
