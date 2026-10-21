import { AgeBand, ScoringTable, Station, stationPoints } from './table';

export type Heatmap = {
  /** Age bands, youngest first: the columns. */
  bands: AgeBand[];
  /** Results that change the points in some band, best first: the rows (reps, or seconds for the run). */
  results: number[];
  /** points[row][column]. */
  points: number[][];
};

/** Points for every age band at every result threshold in the table, for one station. */
export function heatmap(table: ScoringTable, station: Station): Heatmap {
  const bands = [...table.ageBands].sort((a, b) => a.minAge - b.minAge);
  const thresholds = new Set<number>();
  for (const band of bands) {
    for (const row of table[station][band.id] ?? []) thresholds.add('maxSeconds' in row ? row.maxSeconds : row.minReps);
  }
  const results = [...thresholds].sort((a, b) => (station === 'run' ? a - b : b - a));
  const points = results.map((r) => bands.map((band) => stationPoints(table, band.id, station, r)));
  return { bands, results, points };
}
