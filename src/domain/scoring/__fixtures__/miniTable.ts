import type { RepRow, RunRow, ScoringTable } from '../table';

const reps: RepRow[] = [
  { minReps: 60, points: 25 }, { minReps: 50, points: 21 }, { minReps: 40, points: 17 }, { minReps: 30, points: 13 },
  { minReps: 20, points: 8 }, { minReps: 10, points: 2 }, { minReps: 5, points: 1 },
];
const run: RunRow[] = [
  { maxSeconds: 510, points: 50 }, { maxSeconds: 600, points: 44 }, { maxSeconds: 700, points: 35 },
  { maxSeconds: 800, points: 20 }, { maxSeconds: 900, points: 6 }, { maxSeconds: 1000, points: 1 },
];

/** Small made-up table for tests. Not real IPPT data. */
export const miniTable: ScoringTable = {
  id: 'mini',
  source: 'test fixture',
  retrievedOn: '2026-10-21',
  ageBands: [{ id: 'lt22', minAge: 0, maxAge: 21 }, { id: '22-24', minAge: 22, maxAge: 24 }],
  pushup: { lt22: reps, '22-24': reps },
  situp: { lt22: reps, '22-24': reps },
  run: { lt22: run, '22-24': run },
};
