import { FormFault, RepRecord, SET_MS } from './types';

export const BUCKET_MS = 10_000;
export const BUCKETS = SET_MS / BUCKET_MS;

/**
 * Valid reps in each 10 s of a 1-minute set, for the result screen's pacing bars.
 * A rep counts in the bucket where it finished. Reps after the minute land in the last bucket.
 */
export function repsPer10s(reps: RepRecord[]): number[] {
  const counts = new Array<number>(BUCKETS).fill(0);
  for (const r of reps) {
    if (r.outcome.kind !== 'valid') continue;
    const i = Math.min(BUCKETS - 1, Math.max(0, Math.floor(r.endMs / BUCKET_MS)));
    counts[i] += 1;
  }
  return counts;
}

/** Each bucket's height as a share of the busiest bucket (0 when there were no reps). */
export function barHeights(counts: number[]): number[] {
  const max = Math.max(0, ...counts);
  return counts.map((c) => (max === 0 ? 0 : c / max));
}

export type NoCountSummary = {
  total: number;
  /** Form faults by primary reason, most common first; ties keep first-seen order. */
  byFault: { fault: FormFault; count: number }[];
  /** No-counts with no reason: unclear to the camera, or marked by hand. */
  other: number;
};

export function summariseNoCounts(reps: RepRecord[]): NoCountSummary {
  const tally = new Map<FormFault, number>();
  let other = 0;
  let total = 0;
  for (const r of reps) {
    if (r.outcome.kind === 'valid') continue;
    total += 1;
    const primary = r.outcome.kind === 'no_count_form' ? r.outcome.reasons[0] : undefined;
    if (primary) tally.set(primary, (tally.get(primary) ?? 0) + 1);
    else other += 1;
  }
  const byFault = [...tally.entries()].map(([fault, count]) => ({ fault, count })).sort((a, b) => b.count - a.count);
  return { total, byFault, other };
}

export function validCount(reps: RepRecord[]): number {
  return reps.filter((r) => r.outcome.kind === 'valid').length;
}
