import { barHeights, repsPer10s, summariseNoCounts, validCount } from './pacing';
import { RepOutcome, RepRecord } from './types';

const rep = (endMs: number, outcome: RepOutcome = { kind: 'valid' }, index = 0): RepRecord => ({ index, startMs: endMs - 1500, endMs, outcome, metrics: {} });

describe('repsPer10s', () => {
  test('groups valid reps into six 10 s buckets by when they finished', () => {
    const reps = [rep(500), rep(9_999), rep(10_000), rep(25_000), rep(59_999), rep(42_000, { kind: 'no_count_form', reasons: ['not_deep_enough'] })];
    expect(repsPer10s(reps)).toEqual([2, 1, 1, 0, 0, 1]);
  });

  test('a rep finishing after the minute counts in the last bucket', () => {
    expect(repsPer10s([rep(60_400)])).toEqual([0, 0, 0, 0, 0, 1]);
  });

  test('no reps gives six empty buckets', () => {
    expect(repsPer10s([])).toEqual([0, 0, 0, 0, 0, 0]);
  });
});

test('bar heights are in proportion to the busiest 10 seconds', () => {
  expect(barHeights([9, 8, 8, 7, 6, 6]).map((h) => Math.round(h * 64))).toEqual([64, 57, 57, 50, 43, 43]);
  expect(barHeights([0, 0, 0, 0, 0, 0])).toEqual([0, 0, 0, 0, 0, 0]);
});

test('no-counts are summarised by their primary reason, most common first', () => {
  const s = summariseNoCounts([
    rep(1000, { kind: 'no_count_form', reasons: ['no_lockout'] }),
    rep(2000, { kind: 'no_count_form', reasons: ['not_deep_enough', 'hips_sagging'] }),
    rep(3000, { kind: 'no_count_form', reasons: ['not_deep_enough'] }),
    rep(4000, { kind: 'no_count_form', reasons: ['not_deep_enough'] }),
    rep(5000, { kind: 'no_count_unclear', missing: ['feet'] }),
    rep(6000, { kind: 'no_count_form', reasons: [] }),
    rep(7000),
  ]);
  expect(s).toEqual({ total: 6, byFault: [{ fault: 'not_deep_enough', count: 3 }, { fault: 'no_lockout', count: 1 }], other: 2 });
});

test('validCount counts only valid reps', () => {
  expect(validCount([rep(1), rep(2, { kind: 'no_count_unclear', missing: [] }), rep(3)])).toBe(2);
});
