import type { HealthImporter } from './importer';

/** Health Connect is Android only; everywhere else (iOS, web, tests) the import is unavailable. */
export const healthImporter: HealthImporter = {
  isAvailable: async () => false,
  requestAccess: async () => false,
  runsSince: async () => [],
  openSettings: () => {},
};
