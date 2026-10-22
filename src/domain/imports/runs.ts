/** A running session as a health source reports it. */
export type ExternalRun = { id: string; startedAt: string; distanceM: number; durationS: number };

/** A run ready to save as a 2.4km result. */
export type RunCandidate = ExternalRun & { runTimeS: number; adjusted: boolean };

export const IMPORT_DISTANCE_M = { min: 2300, max: 2600 };
const TARGET_M = 2400;

/**
 * Runs that can count as a 2.4km result (spec section 9): 2.3–2.6 km, not already imported,
 * with the time scaled to 2.4 km at the same pace. Newest first.
 */
export function runCandidates(runs: ExternalRun[], importedIds: ReadonlySet<string>): RunCandidate[] {
  return runs
    .filter((r) => r.distanceM >= IMPORT_DISTANCE_M.min && r.distanceM <= IMPORT_DISTANCE_M.max)
    .filter((r) => r.durationS > 0 && !importedIds.has(r.id))
    .map((r) => {
      const runTimeS = Math.round((r.durationS * TARGET_M) / r.distanceM);
      return { ...r, runTimeS, adjusted: r.distanceM !== TARGET_M };
    })
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : a.startedAt > b.startedAt ? -1 : 0));
}
