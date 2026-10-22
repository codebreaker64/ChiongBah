import type { ExternalRun } from '@/domain/imports/runs';

/** Where imported runs come from. */
export interface HealthImporter {
  /** False when the source isn't installed or supported on this phone. */
  isAvailable(): Promise<boolean>;
  /** Asks for read access to exercise sessions and distance; true when granted. */
  requestAccess(): Promise<boolean>;
  /** Running sessions since `since` (ISO time). */
  runsSince(since: string): Promise<ExternalRun[]>;
  /** Opens the source's own settings so the user can change access. */
  openSettings(): void;
}
