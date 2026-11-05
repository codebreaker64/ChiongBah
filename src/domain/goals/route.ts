import type { StationResults } from '../scoring/awards';
import { RepRow, RunRow, ScoringTable, Station, stationPoints, STATIONS } from '../scoring/table';

/** One station's part of a route: improve from `from` to `to` (reps, or seconds for the run). */
export type RouteStep = { station: Station; from: number; to: number; pointsGained: number; pointsAfter: number; effortPct: number };

export type Route = { steps: RouteStep[]; pointsGained: number };

/** The easiest result at this station worth at least `points`, or null if the table tops out first. */
function easiestFor(table: ScoringTable, bandId: string, station: Station, points: number): number | null {
  const rows: (RepRow | RunRow)[] = table[station][bandId];
  const row = [...rows].reverse().find((r) => r.points >= points);
  if (!row) return null;
  return station === 'run' ? (row as RunRow).maxSeconds : (row as RepRow).minReps;
}

/**
 * The least total improvement (summed as % of each current result) that gains at least
 * `pointsNeeded` points across the stations. Tries every split of the points between stations,
 * which is small: at most (need + 1)³ combinations. Steps come back easiest first.
 * Null when a station has no result yet or the points can't be reached.
 */
export function easiestRoute(pointsNeeded: number, results: StationResults, table: ScoringTable, bandId: string): Route | null {
  if (pointsNeeded <= 0) return { steps: [], pointsGained: 0 };
  if (STATIONS.some((s) => results[s] === null)) return null;

  // options[s][g] = the step that gains exactly g more points (0 = stay as is), or null.
  const options = STATIONS.map((station) => {
    const from = results[station] as number;
    const now = stationPoints(table, bandId, station, from);
    const list: (RouteStep | null)[] = [{ station, from, to: from, pointsGained: 0, pointsAfter: now, effortPct: 0 }];
    for (let g = 1; g <= pointsNeeded; g++) {
      const to = easiestFor(table, bandId, station, now + g);
      if (to === null) { list.push(null); continue; }
      const pointsAfter = stationPoints(table, bandId, station, to);
      const change = station === 'run' ? from - to : to - from;
      list.push({ station, from, to, pointsGained: pointsAfter - now, pointsAfter, effortPct: (change / Math.max(from, 1)) * 100 });
    }
    return list;
  });

  let best: { steps: RouteStep[]; effort: number; gained: number } | null = null;
  const [a, b, c] = options;
  for (const x of a) for (const y of b) for (const z of c) {
    if (!x || !y || !z) continue;
    const gained = x.pointsGained + y.pointsGained + z.pointsGained;
    if (gained < pointsNeeded) continue;
    const effort = x.effortPct + y.effortPct + z.effortPct;
    if (!best || effort < best.effort - 1e-9 || (Math.abs(effort - best.effort) < 1e-9 && gained < best.gained)) {
      best = { steps: [x, y, z], effort, gained };
    }
  }
  if (!best) return null;
  const steps = best.steps
    .filter((s) => s.pointsGained > 0)
    .sort((p, q) => p.effortPct / p.pointsGained - q.effortPct / q.pointsGained);
  return { steps, pointsGained: best.gained };
}
