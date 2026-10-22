import { runCandidates } from './runs';

const run = (id: string, distanceM: number, durationS: number, startedAt = '2026-10-10T10:00:00Z') => ({ id, startedAt, distanceM, durationS });

test('keeps only runs between 2.3 and 2.6 km', () => {
  const out = runCandidates([run('a', 2299, 600), run('b', 2300, 600), run('c', 2600, 600), run('d', 2601, 600)], new Set());
  expect(out.map((r) => r.id).sort()).toEqual(['b', 'c']);
});

test('scales the time to 2.4 km at the same pace and marks it adjusted', () => {
  const [r] = runCandidates([run('a', 2500, 625)], new Set());
  expect(r.runTimeS).toBe(600);
  expect(r.adjusted).toBe(true);
});

test('an exact 2.4 km run is not adjusted', () => {
  const [r] = runCandidates([run('a', 2400, 610)], new Set());
  expect(r).toMatchObject({ runTimeS: 610, adjusted: false });
});

test('skips runs already imported and lists newest first', () => {
  const out = runCandidates([
    run('old', 2400, 600, '2026-10-01T10:00:00Z'),
    run('new', 2400, 590, '2026-10-12T10:00:00Z'),
    run('done', 2400, 580, '2026-10-15T10:00:00Z'),
  ], new Set(['done']));
  expect(out.map((r) => r.id)).toEqual(['new', 'old']);
});
