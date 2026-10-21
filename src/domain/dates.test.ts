import { ageOn, daysBetween, formatLocalDate, parseLocalDate, todayInSingapore } from './dates';

test('parseLocalDate accepts real dates only', () => {
  expect(parseLocalDate('2028-02-29')).toBe('2028-02-29');
  expect(parseLocalDate('2026-02-30')).toBeNull();
  expect(parseLocalDate('26-1-1')).toBeNull();
  expect(parseLocalDate('')).toBeNull();
});

test('todayInSingapore uses UTC+8', () => {
  expect(todayInSingapore(new Date('2026-10-21T15:59:59Z'))).toBe('2026-10-21');
  expect(todayInSingapore(new Date('2026-10-21T16:00:00Z'))).toBe('2026-10-22');
});

test('daysBetween counts calendar days', () => {
  expect(daysBetween('2026-10-21', '2026-12-01')).toBe(41);
  expect(daysBetween('2026-10-21', '2026-10-01')).toBe(-20);
});

test('ageOn handles birthdays and 29 Feb', () => {
  expect(ageOn('2004-10-22', '2026-10-21')).toBe(21);
  expect(ageOn('2004-10-21', '2026-10-21')).toBe(22);
  expect(ageOn('2004-02-29', '2026-02-28')).toBe(21);
  expect(ageOn('2004-02-29', '2026-03-01')).toBe(22);
});

test('formatLocalDate', () => {
  expect(formatLocalDate('2026-10-01')).toBe('1 Oct 2026');
});
