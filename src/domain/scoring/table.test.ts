import { miniTable } from './__fixtures__/miniTable';
import { bandForAge, stationPoints, validateTable } from './table';

test('mini table is valid', () => expect(validateTable(miniTable)).toEqual([]));

test('validateTable catches a non-max top row and an overlapping band', () => {
  const bad = { ...miniTable, ageBands: [{ id: 'lt22', minAge: 0, maxAge: 22 }, { id: '22-24', minAge: 22, maxAge: 24 }],
    pushup: { ...miniTable.pushup, lt22: miniTable.pushup.lt22.slice(1) } };
  expect(validateTable(bad).length).toBeGreaterThanOrEqual(2);
});

test('bandForAge', () => {
  expect(bandForAge(miniTable, 21)?.id).toBe('lt22');
  expect(bandForAge(miniTable, 22)?.id).toBe('22-24');
  expect(bandForAge(miniTable, 25)).toBeNull();
});

test('rep points, including above best and below worst', () => {
  const p = (r: number) => stationPoints(miniTable, 'lt22', 'pushup', r);
  expect([p(75), p(60), p(59), p(50), p(5), p(4), p(0)]).toEqual([25, 25, 21, 21, 1, 0, 0]);
});

test('run points, including faster than best and slower than worst', () => {
  const p = (s: number) => stationPoints(miniTable, 'lt22', 'run', s);
  expect([p(480), p(510), p(511), p(1000), p(1001)]).toEqual([50, 50, 44, 1, 0]);
});
