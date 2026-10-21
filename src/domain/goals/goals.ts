import { Award, AwardRules, scoreIppt, StationResults, Who } from '../scoring/awards';
import { bandForAge, RepRow, RunRow, ScoringTable, Station, stationPoints, STATIONS } from '../scoring/table';

export type GoalTarget = { kind: 'award'; award: Exclude<Award, 'fail'> } | { kind: 'score'; points: number };

/** One way to gain points: reach `target` (reps, or seconds for the run). */
export type ImprovementStep = { target: number; gain: number; pointsAfter: number; improvementPct: number };

export type StationGap = { station: Station; current: number | null; currentPoints: number | null; next: ImprovementStep[] };

export type GoalProgress = {
  targetPoints: number;
  total: number | null;
  pointsNeeded: number | null;
  met: boolean;
  stations: StationGap[];
  cheapest: Station[];
};

const STEP_SIZES = [1, 3, 5];
const round1 = (n: number) => Math.round(n * 10) / 10;

export function targetPoints(target: GoalTarget, who: Who, rules: AwardRules): number {
  if (target.kind === 'score') return target.points;
  switch (target.award) {
    case 'gold': return who.eliteVocation ? rules.eliteGold : rules.gold;
    case 'silver': return who.eliteVocation ? rules.eliteSilver : rules.silver;
    case 'pass_incentive': return rules.passWithIncentive;
    case 'pass': return who.status === 'nsf' ? rules.nsfPass : rules.nsmanPass;
  }
}

export function stationGap(table: ScoringTable, bandId: string, station: Station, current: number | null): StationGap {
  if (current === null) return { station, current, currentPoints: null, next: [] };
  const currentPoints = stationPoints(table, bandId, station, current);
  const rows: (RepRow | RunRow)[] = table[station][bandId];
  const next: ImprovementStep[] = [];

  for (const size of STEP_SIZES) {
    // Easiest row (worst performance) that still reaches currentPoints + size.
    const row = [...rows].reverse().find((r) => r.points >= currentPoints + size);
    if (!row) break;
    const target = station === 'run' ? (row as RunRow).maxSeconds : (row as RepRow).minReps;
    if (next.some((step) => step.target === target)) continue;
    const gain = station === 'run' ? current - target : target - current;
    next.push({ target, gain, pointsAfter: row.points, improvementPct: round1((gain / Math.max(current, 1)) * 100) });
  }
  return { station, current, currentPoints, next };
}

/** Stations ordered by the smallest % improvement per point for their next step. */
export function rankCheapest(gaps: StationGap[]): Station[] {
  const cost = (g: StationGap) => g.next[0].improvementPct / (g.next[0].pointsAfter - (g.currentPoints ?? 0));
  return gaps.filter((g) => g.next.length > 0).sort((a, b) => cost(a) - cost(b)).map((g) => g.station);
}

export function goalProgress(
  target: GoalTarget,
  results: StationResults,
  age: number,
  table: ScoringTable,
  who: Who,
  rules: AwardRules,
): GoalProgress | { error: 'no_age_band' } {
  const band = bandForAge(table, age);
  const score = scoreIppt(results, age, table, who, rules);
  if (!band || 'error' in score) return { error: 'no_age_band' };

  const goal = targetPoints(target, who, rules);
  const stations = STATIONS.map((s) => stationGap(table, band.id, s, results[s]));
  const total = score.total;
  const everyStationScores = STATIONS.every((s) => (score.points[s] ?? 0) >= 1);
  return {
    targetPoints: goal,
    total,
    pointsNeeded: total === null ? null : Math.max(0, goal - total),
    met: total !== null && total >= goal && everyStationScores,
    stations,
    cheapest: rankCheapest(stations),
  };
}
