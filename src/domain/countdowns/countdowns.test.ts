import { Profile, scoringAge } from '../profile';
import { countdownTo, homeCountdowns, ordRodLabel } from './countdowns';

const nsf: Profile = { dob: '2005-03-01', status: 'nsf', service: 'saf', eliteVocation: false, ordRodDate: '2026-12-01', ipptDate: '2026-11-15' };

test('countdownTo', () => {
  expect(countdownTo('2026-12-01', '2026-10-21')).toEqual({ kind: 'upcoming', days: 41 });
  expect(countdownTo('2026-10-21', '2026-10-21')).toEqual({ kind: 'today' });
  expect(countdownTo('2026-10-01', '2026-10-21')).toEqual({ kind: 'passed', daysAgo: 20 });
  expect(countdownTo(null, '2026-10-21')).toEqual({ kind: 'not_set' });
});

test('ROD for SPF and SCDF', () => {
  expect(ordRodLabel('saf')).toBe('ORD');
  expect(ordRodLabel('spf')).toBe('ROD');
  expect(ordRodLabel('scdf')).toBe('ROD');
});

test('NSmen get no ORD countdown', () => {
  expect(homeCountdowns({ ...nsf, status: 'nsman', ordRodDate: null }, '2026-10-21').ordRod).toBeNull();
  expect(homeCountdowns(nsf, '2026-10-21').ordRod).toEqual({ label: 'ORD', countdown: { kind: 'upcoming', days: 41 } });
});

test('scoringAge uses the IPPT date when set', () => {
  expect(scoringAge({ ...nsf, dob: '2004-11-01' }, '2026-10-21')).toBe(22);
  expect(scoringAge({ ...nsf, dob: '2004-11-01', ipptDate: null }, '2026-10-21')).toBe(21);
});
