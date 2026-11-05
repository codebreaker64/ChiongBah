import type { ServiceStatus } from '../profile';
import rulesJson from './awardRules.json';
import { bandForAge, ScoringTable, Station, stationPoints, STATIONS } from './table';

export type Award = 'fail' | 'pass' | 'pass_incentive' | 'silver' | 'gold';

export type AwardRules = {
  nsmanPass: number;
  nsfPass: number;
  passWithIncentive: number;
  silver: number;
  gold: number;
  eliteSilver: number;
  eliteGold: number;
};

/** Thresholds from awardRules.json. nsfPass and eliteSilver are unverified (spec section 13). */
export const awardRules: AwardRules = rulesJson;

export type Who = { status: ServiceStatus; eliteVocation: boolean };

/** Reps for push-ups and sit-ups, seconds for the run; null when not logged. */
export type StationResults = { pushup: number | null; situp: number | null; run: number | null };

export type ScoreResult = { points: Record<Station, number | null>; total: number | null; award: Award | null };

export function awardFor(points: Record<Station, number>, who: Who, rules: AwardRules): Award {
  if (STATIONS.some((s) => points[s] < 1)) return 'fail';
  const total = points.pushup + points.situp + points.run;
  if (total >= (who.eliteVocation ? rules.eliteGold : rules.gold)) return 'gold';
  if (total >= (who.eliteVocation ? rules.eliteSilver : rules.silver)) return 'silver';
  if (total >= rules.passWithIncentive) return 'pass_incentive';
  if (total >= (who.status === 'nsf' ? rules.nsfPass : rules.nsmanPass)) return 'pass';
  return 'fail';
}

export function scoreIppt(
  results: StationResults,
  age: number,
  table: ScoringTable,
  who: Who,
  rules: AwardRules,
): ScoreResult | { error: 'no_age_band' } {
  const band = bandForAge(table, age);
  if (!band) return { error: 'no_age_band' };
  const points = {} as Record<Station, number | null>;
  for (const s of STATIONS) {
    const result = results[s];
    points[s] = result === null ? null : stationPoints(table, band.id, s, result);
  }
  if (STATIONS.some((s) => points[s] === null)) return { points, total: null, award: null };
  const full = points as Record<Station, number>;
  return { points, total: full.pushup + full.situp + full.run, award: awardFor(full, who, rules) };
}

/** Points each award needs for this person, lowest first. Pass with Incentive is for reservists only. */
export function awardLadder(who: Who, rules: AwardRules): { award: Exclude<Award, 'fail'>; points: number }[] {
  const ladder: { award: Exclude<Award, 'fail'>; points: number }[] = [
    { award: 'pass', points: who.status === 'nsf' ? rules.nsfPass : rules.nsmanPass },
  ];
  if (who.status === 'nsman') ladder.push({ award: 'pass_incentive', points: rules.passWithIncentive });
  ladder.push({ award: 'silver', points: who.eliteVocation ? rules.eliteSilver : rules.silver });
  ladder.push({ award: 'gold', points: who.eliteVocation ? rules.eliteGold : rules.gold });
  return ladder;
}

/** The next award above `total`, and how many points it still needs; null at Gold. */
export function nextAward(total: number, who: Who, rules: AwardRules): { award: Exclude<Award, 'fail'>; pointsToGo: number } | null {
  const next = awardLadder(who, rules).find((a) => a.points > total);
  return next ? { award: next.award, pointsToGo: next.points - total } : null;
}
