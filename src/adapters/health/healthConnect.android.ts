import type { ExternalRun } from '@/domain/imports/runs';
import {
  aggregateRecord,
  ExerciseType,
  getGrantedPermissions,
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  readRecords,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
import type { HealthImporter } from './importer';

const PERMISSIONS = [
  { accessType: 'read', recordType: 'ExerciseSession' },
  { accessType: 'read', recordType: 'Distance' },
] as const;

const RUN_TYPES = new Set<number>([ExerciseType.RUNNING, ExerciseType.RUNNING_TREADMILL]);

let ready: Promise<boolean> | null = null;
const init = () => (ready ??= initialize().catch(() => false));

const hasAll = (granted: object[]) =>
  PERMISSIONS.every((p) => granted.some((g) => 'recordType' in g && g.recordType === p.recordType && 'accessType' in g && g.accessType === p.accessType));

/** Health Connect on Android, read only: running sessions and the distance recorded during them. */
export const healthImporter: HealthImporter = {
  async isAvailable() {
    try {
      return (await getSdkStatus()) === SdkAvailabilityStatus.SDK_AVAILABLE;
    } catch {
      return false;
    }
  },

  async requestAccess() {
    if (!(await init())) return false;
    const already = await getGrantedPermissions();
    if (hasAll(already)) return true;
    return hasAll(await requestPermission([...PERMISSIONS]));
  },

  async runsSince(since) {
    if (!(await init())) return [];
    const runs: ExternalRun[] = [];
    let pageToken: string | undefined;
    do {
      const page = await readRecords('ExerciseSession', { timeRangeFilter: { operator: 'after', startTime: since }, pageToken });
      for (const s of page.records) {
        if (!RUN_TYPES.has(s.exerciseType) || !s.metadata?.id) continue;
        // Distance comes from separate records; count only the ones written by the app that logged the run.
        const distance = await aggregateRecord({
          recordType: 'Distance',
          timeRangeFilter: { operator: 'between', startTime: s.startTime, endTime: s.endTime },
          dataOriginFilter: s.metadata.dataOrigin ? [s.metadata.dataOrigin] : undefined,
        });
        runs.push({
          id: s.metadata.id,
          startedAt: s.startTime,
          distanceM: distance.DISTANCE?.inMeters ?? 0,
          durationS: Math.round((Date.parse(s.endTime) - Date.parse(s.startTime)) / 1000),
        });
      }
      pageToken = page.pageToken || undefined;
    } while (pageToken);
    return runs;
  },

  openSettings: () => openHealthConnectSettings(),
};
