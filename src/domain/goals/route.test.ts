import { miniTable } from '../scoring/__fixtures__/miniTable';
import { easiestRoute } from './route';

// miniTable reps: 60→25, 50→21, 40→17, 30→13, 20→8 … run: 510→50, 600→44, 700→35, 800→20.

test('nothing needed is an empty route', () => {
  expect(easiestRoute(0, { pushup: 40, situp: 40, run: 700 }, miniTable, '22-24')).toEqual({ steps: [], pointsGained: 0 });
});

test('a missing station result gives no route', () => {
  expect(easiestRoute(5, { pushup: 40, situp: null, run: 700 }, miniTable, '22-24')).toBeNull();
});

test('picks the smallest total improvement that reaches the points', () => {
  // Need 4: push-ups 40 → 50 is +25 % for +4; the run 700 → 600 is −14 % for +9. The run is easier.
  const route = easiestRoute(4, { pushup: 40, situp: 40, run: 700 }, miniTable, '22-24');
  expect(route?.steps).toEqual([{ station: 'run', from: 700, to: 600, pointsGained: 9, pointsAfter: 44, effortPct: (100 / 700) * 100 }]);
  expect(route?.pointsGained).toBe(9);
});

test('splits the points across stations when that is easier', () => {
  // Need 10: the run tops out at +6 (600 → 510, 15 %), so add sit-ups 35 → 40 (+4, 14 %).
  const route = easiestRoute(10, { pushup: 30, situp: 35, run: 600 }, miniTable, '22-24');
  expect(route?.pointsGained).toBe(10);
  // Easiest per point first: the run (2.5 % a point) before sit-ups (3.6 % a point).
  expect(route?.steps.map((s) => [s.station, s.to])).toEqual([['run', 510], ['situp', 40]]);
});

test('null when even maximum points fall short', () => {
  expect(easiestRoute(80, { pushup: 60, situp: 60, run: 500 }, miniTable, '22-24')).toBeNull();
});
