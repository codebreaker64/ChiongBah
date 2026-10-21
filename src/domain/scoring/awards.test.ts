import { miniTable } from './__fixtures__/miniTable';
import { awardRules, scoreIppt, Who } from './awards';

const nsman: Who = { status: 'nsman', eliteVocation: false };
const s = (pushup: number | null, situp: number | null, run: number | null) =>
  scoreIppt({ pushup, situp, run }, 21, miniTable, nsman, awardRules);

test('totals and awards for NSmen', () => {
  expect(s(60, 60, 600)).toMatchObject({ total: 94, award: 'gold' });
  expect(s(50, 40, 600)).toMatchObject({ total: 82, award: 'silver' });
  expect(s(40, 30, 700)).toMatchObject({ total: 65, award: 'pass_incentive' });
  expect(s(40, 20, 700)).toMatchObject({ total: 60, award: 'pass' });
  expect(s(30, 30, 800)).toMatchObject({ total: 46, award: 'fail' });
});

test('a zero station fails regardless of total', () => {
  expect(s(4, 60, 510)).toMatchObject({ total: 75, award: 'fail' });
});

test('NSF needs 61 to pass; elite needs 90 for gold', () => {
  expect(scoreIppt({ pushup: 40, situp: 20, run: 700 }, 21, miniTable, { status: 'nsf', eliteVocation: false }, awardRules)).toMatchObject({ award: 'fail' });
  expect(scoreIppt({ pushup: 60, situp: 50, run: 600 }, 21, miniTable, { status: 'nsman', eliteVocation: true }, awardRules)).toMatchObject({ total: 90, award: 'gold' });
  expect(scoreIppt({ pushup: 60, situp: 40, run: 600 }, 21, miniTable, { status: 'nsman', eliteVocation: true }, awardRules)).toMatchObject({ total: 86, award: 'silver' });
});

test('missing result gives station points but no total', () => {
  expect(s(50, 40, null)).toEqual({ points: { pushup: 21, situp: 17, run: null }, total: null, award: null });
});

test('age outside the table', () => {
  expect(scoreIppt({ pushup: 50, situp: 40, run: 600 }, 61, miniTable, nsman, awardRules)).toEqual({ error: 'no_age_band' });
});
