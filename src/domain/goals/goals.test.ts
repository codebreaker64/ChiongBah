import { miniTable } from '../scoring/__fixtures__/miniTable';
import { awardRules, Who } from '../scoring/awards';
import { goalProgress, rankCheapest, stationGap, targetPoints } from './goals';

test('stationGap steps for push-ups, deduplicated', () => {
  expect(stationGap(miniTable, 'lt22', 'pushup', 45)).toEqual({ station: 'pushup', current: 45, currentPoints: 17, next: [
    { target: 50, gain: 5, pointsAfter: 21, improvementPct: 11.1 },
    { target: 60, gain: 15, pointsAfter: 25, improvementPct: 33.3 },
  ] });
});

test('stationGap for the run counts seconds faster', () => {
  expect(stationGap(miniTable, 'lt22', 'run', 650).next).toEqual([{ target: 600, gain: 50, pointsAfter: 44, improvementPct: 7.7 }]);
});

test('no steps at max or with no result', () => {
  expect(stationGap(miniTable, 'lt22', 'pushup', 60).next).toEqual([]);
  expect(stationGap(miniTable, 'lt22', 'situp', null)).toEqual({ station: 'situp', current: null, currentPoints: null, next: [] });
});

test('a zero-point result gets steps up to the first scoring row', () => {
  expect(stationGap(miniTable, 'lt22', 'run', 1100).next[0]).toEqual({ target: 1000, gain: 100, pointsAfter: 1, improvementPct: 9.1 });
});

test('cheapest points ranks by % per point', () => {
  const gaps = [stationGap(miniTable, 'lt22', 'pushup', 45), stationGap(miniTable, 'lt22', 'run', 650)];
  expect(rankCheapest(gaps)).toEqual(['run', 'pushup']);
});

test('targetPoints', () => {
  expect(targetPoints({ kind: 'award', award: 'gold' }, { status: 'nsman', eliteVocation: true }, awardRules)).toBe(90);
  expect(targetPoints({ kind: 'award', award: 'pass' }, { status: 'nsf', eliteVocation: false }, awardRules)).toBe(61);
  expect(targetPoints({ kind: 'score', points: 70 }, { status: 'nsman', eliteVocation: false }, awardRules)).toBe(70);
});

test('goalProgress with all results and with one missing', () => {
  const who: Who = { status: 'nsman', eliteVocation: false };
  expect(goalProgress({ kind: 'award', award: 'gold' }, { pushup: 45, situp: 40, run: 650 }, 21, miniTable, who, awardRules))
    .toMatchObject({ targetPoints: 85, total: 69, pointsNeeded: 16, met: false });
  expect(goalProgress({ kind: 'award', award: 'gold' }, { pushup: 45, situp: null, run: 650 }, 21, miniTable, who, awardRules))
    .toMatchObject({ total: null, pointsNeeded: null, met: false });
});

test('goal is not met when a station scores zero, even if the total reaches the target', () => {
  const who: Who = { status: 'nsman', eliteVocation: false };
  expect(goalProgress({ kind: 'score', points: 70 }, { pushup: 4, situp: 60, run: 510 }, 21, miniTable, who, awardRules))
    .toMatchObject({ total: 75, pointsNeeded: 0, met: false });
});
