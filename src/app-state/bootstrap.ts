import { migrate } from '@/adapters/storage/db';
import { openExpoDb } from '@/adapters/storage/expoDb';
import { createRepositories, Repositories } from '@/adapters/storage/repositories';

/** Opens the on-device database, brings its schema up to date and returns the repositories. */
export function createAppRepositories(): Repositories {
  const db = openExpoDb();
  migrate(db);
  return createRepositories(db);
}
