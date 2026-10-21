import { miniTable } from './__fixtures__/miniTable';
import { heatmap } from './heatmap';
import { ScoringTable } from './table';

test('rows are the rep thresholds, best first, scored per band', () => {
  const h = heatmap(miniTable, 'pushup');
  expect(h.bands.map((b) => b.id)).toEqual(['lt22', '22-24']);
  expect(h.results).toEqual([60, 50, 40, 30, 20, 10, 5]);
  expect(h.points[0]).toEqual([25, 25]);
  expect(h.points[6]).toEqual([1, 1]);
});

test('run rows are fastest first', () => {
  const h = heatmap(miniTable, 'run');
  expect(h.results[0]).toBe(510);
  expect(h.points[0]).toEqual([50, 50]);
  expect(h.results[h.results.length - 1]).toBe(1000);
});

test('thresholds from every band are merged', () => {
  const t: ScoringTable = { ...miniTable, pushup: { lt22: [{ minReps: 40, points: 25 }, { minReps: 20, points: 1 }], '22-24': [{ minReps: 36, points: 25 }, { minReps: 18, points: 1 }] } };
  const h = heatmap(t, 'pushup');
  expect(h.results).toEqual([40, 36, 20, 18]);
  expect(h.points).toEqual([[25, 25], [1, 25], [1, 1], [0, 1]]);
});
