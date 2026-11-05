import { onboardingSteps, stepProgress } from './steps';

describe('onboardingSteps', () => {
  test('SAF NSF sees all seven questions', () => {
    expect(onboardingSteps({ status: 'nsf', service: 'saf' })).toEqual(['dob', 'status', 'service', 'vocation', 'ordRod', 'ippt', 'goal']);
  });
  test('SPF NSF skips the vocation question and keeps the ROD date', () => {
    expect(onboardingSteps({ status: 'nsf', service: 'spf' })).toEqual(['dob', 'status', 'service', 'ordRod', 'ippt', 'goal']);
  });
  test('SAF reservist keeps the vocation question and skips the ORD date', () => {
    expect(onboardingSteps({ status: 'nsman', service: 'saf' })).toEqual(['dob', 'status', 'service', 'vocation', 'ippt', 'goal']);
  });
  test('SCDF reservist sees five questions', () => {
    expect(onboardingSteps({ status: 'nsman', service: 'scdf' })).toEqual(['dob', 'status', 'service', 'ippt', 'goal']);
  });
});

describe('stepProgress', () => {
  test('the bar grows from the previous step to this one', () => {
    expect(stepProgress(0, 7)).toEqual({ fraction: 1 / 7, from: 0 });
    expect(stepProgress(1, 7)).toEqual({ fraction: 2 / 7, from: 0.5 });
    expect(stepProgress(6, 7).fraction).toBe(1);
    expect(stepProgress(6, 7).from).toBeCloseTo(0.857, 3);
  });
  test('a five-step route ends full', () => {
    expect(stepProgress(4, 5)).toEqual({ fraction: 1, from: 0.8 });
  });
});
