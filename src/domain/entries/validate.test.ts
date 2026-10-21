import { formatRunTime, parseRunTime, validateReps } from './validate';

test('validateReps', () => {
  expect(validateReps('0')).toEqual({ ok: true, value: 0 });
  expect(validateReps(' 100 ')).toEqual({ ok: true, value: 100 });
  expect(validateReps('101')).toEqual({ ok: false, error: 'range' });
  for (const bad of ['-1', '12.5', 'abc', '']) expect(validateReps(bad)).toEqual({ ok: false, error: 'format' });
});

test('parseRunTime', () => {
  expect(parseRunTime('9:45')).toEqual({ ok: true, value: 585 });
  expect(parseRunTime('09:45')).toEqual({ ok: true, value: 585 });
  expect(parseRunTime('7:00')).toEqual({ ok: true, value: 420 });
  expect(parseRunTime('25:00')).toEqual({ ok: true, value: 1500 });
  expect(parseRunTime('6:59')).toEqual({ ok: false, error: 'range' });
  expect(parseRunTime('25:01')).toEqual({ ok: false, error: 'range' });
  for (const bad of ['9:75', '9.45', '945', '', '9:5']) expect(parseRunTime(bad)).toEqual({ ok: false, error: 'format' });
});

test('formatRunTime', () => expect(formatRunTime(585)).toBe('9:45'));
