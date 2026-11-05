import { setupTestApp } from '@/app-state/testing';
import type { Profile } from '@/domain/profile';
import { validateProfileForm } from '@/ui/ProfileForm';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

const APP = './src/app';
const NOW = '2026-10-21T02:00:00Z';
const P: Profile = { dob: '2005-03-01', status: 'nsf', service: 'saf', eliteVocation: false, ordRodDate: '2026-12-01', ipptDate: null };

afterEach(() => jest.restoreAllMocks());

test('first launch shows both disclaimers, records acceptance, then asks the first question', async () => {
  const repos = setupTestApp({ now: NOW });
  await renderRouter(APP);
  expect(await screen.findByText('Train for your next IPPT')).toBeTruthy();
  expect(screen.getByText('Not affiliated with MINDEF/SAF/SPF/SCDF; scores are practice estimates.')).toBeTruthy();
  expect(screen.getByText('Consult a doctor if you have medical conditions.')).toBeTruthy();
  await fireEvent.press(screen.getByText('I understand'));
  expect(await screen.findByLabelText('Date of birth')).toBeTruthy();
  expect(screen.getByText('1 of 7')).toBeTruthy();
  expect(repos.consent.acceptedOn()).toBe('2026-10-21');
});

test('onboarding rejects an impossible date, and waits for a ROD date', async () => {
  setupTestApp({ now: NOW });
  await renderRouter(APP, { initialUrl: '/onboarding/dob' });
  await fireEvent.changeText(await screen.findByLabelText('Date of birth'), '2005-02-30');
  await fireEvent.press(screen.getByText('Continue'));
  expect(await screen.findByText('Enter a real date as YYYY-MM-DD.')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Date of birth'), '2005-03-01');
  await fireEvent.press(screen.getByText('Continue'));
  await fireEvent.press(await screen.findByText('Continue')); // NSF
  await fireEvent.press(await screen.findByText('SPF'));
  await fireEvent.press(screen.getByText('Continue'));
  // ROD date left blank: Continue stays disabled until it is answered.
  expect(await screen.findByLabelText('ROD date')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Continue' }).props.accessibilityState).toMatchObject({ disabled: true });
  await fireEvent.changeText(screen.getByLabelText('ROD date'), '2026-02-30');
  await fireEvent.press(screen.getByText('Continue'));
  expect(await screen.findByText('Enter a real date as YYYY-MM-DD.')).toBeTruthy();
});

test('onboarding walks through each question and saves the profile and goal', async () => {
  const repos = setupTestApp({ now: NOW });
  await renderRouter(APP, { initialUrl: '/onboarding/dob' });
  await fireEvent.changeText(await screen.findByLabelText('Date of birth'), '2005-03-01');
  expect(screen.getByText('21')).toBeTruthy();
  expect(screen.getByText('years old')).toBeTruthy();
  await fireEvent.press(screen.getByText('Continue'));
  expect(await screen.findByText('Which describes you?')).toBeTruthy();
  await fireEvent.press(screen.getByText('Continue'));
  expect(await screen.findByText('Which service?')).toBeTruthy();
  await fireEvent.press(screen.getByText('Continue'));
  expect(await screen.findByText('Commando, Diver or Guards?')).toBeTruthy();
  await fireEvent.press(screen.getByText('Continue'));
  await fireEvent.changeText(await screen.findByLabelText('ORD date'), '2026-12-01');
  expect(screen.getByLabelText('41 days to go')).toBeTruthy();
  await fireEvent.press(screen.getByText('Continue'));
  expect(await screen.findByText('When is your next IPPT?')).toBeTruthy();
  expect(screen.getByText('6 of 7')).toBeTruthy();
  await fireEvent.press(screen.getByText('Continue'));
  expect(await screen.findByText('7 of 7')).toBeTruthy();
  expect(screen.queryByText('Pass with Incentive')).toBeNull(); // NSFs only see Gold, Silver and Pass
  await fireEvent.press(screen.getByText('Gold'));
  await fireEvent.press(screen.getByText('Start training'));
  expect(await screen.findByText('Home')).toBeTruthy();
  expect(repos.profile.get()).toEqual(P);
  expect(repos.goal.get()).toEqual({ kind: 'award', award: 'gold' });
});

test('SPF reservists skip the vocation and ROD questions', async () => {
  const repos = setupTestApp({ now: NOW });
  await renderRouter(APP, { initialUrl: '/onboarding/dob' });
  await fireEvent.changeText(await screen.findByLabelText('Date of birth'), '2003-03-01');
  await fireEvent.press(screen.getByText('Continue'));
  await fireEvent.press(await screen.findByText('Reservist'));
  await fireEvent.press(screen.getByText('Continue'));
  await fireEvent.press(await screen.findByText('SPF'));
  await fireEvent.press(screen.getByText('Continue'));
  expect(await screen.findByText('When is your next IPPT?')).toBeTruthy();
  expect(screen.getByText('4 of 5')).toBeTruthy();
  await fireEvent.press(screen.getByText('Skip for now'));
  expect(await screen.findByText('5 of 5')).toBeTruthy();
  expect(screen.getByText('Pass with Incentive')).toBeTruthy();
  await fireEvent.press(screen.getByText('Decide later'));
  expect(await screen.findByText('Home')).toBeTruthy();
  expect(repos.profile.get()).toMatchObject({ status: 'nsman', service: 'spf', eliteVocation: false, ordRodDate: null });
  expect(repos.goal.get()).toBeNull();
});

test('a saved profile skips onboarding', async () => {
  setupTestApp({ now: NOW, profile: P });
  await renderRouter(APP);
  expect(await screen.findByText('Home')).toBeTruthy();
});

test('settings opens a step as an editor and saves it', async () => {
  const repos = setupTestApp({ now: NOW, profile: P });
  await renderRouter(APP, { initialUrl: '/settings' });
  expect(await screen.findByText('1 Mar 2005')).toBeTruthy();
  await fireEvent.press(screen.getByText('Next IPPT'));
  await fireEvent.changeText(await screen.findByLabelText('Next IPPT date (optional)'), '2026-11-15');
  await fireEvent.press(screen.getByText('Save'));
  expect(await screen.findByText('15 Nov 2026')).toBeTruthy();
  expect(repos.profile.get()?.ipptDate).toBe('2026-11-15');
});

test('switching a reservist to NSF in settings asks for the ORD date before saving', async () => {
  const repos = setupTestApp({ now: NOW, profile: { ...P, status: 'nsman', ordRodDate: null } });
  await renderRouter(APP, { initialUrl: '/settings' });
  await fireEvent.press(await screen.findByText('Status'));
  await fireEvent.press(await screen.findByText('NSF'));
  await fireEvent.press(screen.getByText('Save'));
  await fireEvent.changeText(await screen.findByLabelText('ORD date'), '2027-01-15');
  await fireEvent.press(screen.getByText('Save'));
  expect(await screen.findByText('15 Jan 2027')).toBeTruthy();
  expect(repos.profile.get()).toMatchObject({ status: 'nsf', ordRodDate: '2027-01-15' });
});

test('validateProfileForm refuses a future date of birth and an age outside the table', () => {
  setupTestApp({ now: NOW });
  const base = { dob: '', status: 'nsman' as const, service: 'saf' as const, eliteVocation: false, ordRodDate: '', ipptDate: '' };
  expect(validateProfileForm({ ...base, dob: '2027-01-01' }, '2026-10-21').dob).toBe("Date of birth can't be in the future.");
  expect(validateProfileForm({ ...base, dob: '1965-01-01' }, '2026-10-21').dob).toBe("We can't score your age group yet.");
  expect(validateProfileForm({ ...base, dob: '2005-03-01' }, '2026-10-21')).toEqual({});
});

test('settings links to help, terms and privacy', async () => {
  setupTestApp({ now: NOW, profile: P });
  await renderRouter(APP, { initialUrl: '/settings' });
  await fireEvent.press(await screen.findByText('Privacy Policy'));
  expect(await screen.findByText('What the app stores')).toBeTruthy();
});
