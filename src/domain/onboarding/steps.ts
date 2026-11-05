import type { Service, ServiceStatus } from '../profile';

/** One onboarding question (redesign spec section 6.2). */
export type OnboardingStep = 'dob' | 'status' | 'service' | 'vocation' | 'ordRod' | 'ippt' | 'goal';

export const ALL_STEPS: OnboardingStep[] = ['dob', 'status', 'service', 'vocation', 'ordRod', 'ippt', 'goal'];

/**
 * The questions this person sees, in order: Commando/Diver/Guards only for SAF,
 * the ORD/ROD date only for NSFs. Everyone else answers the rest.
 */
export function onboardingSteps(answers: { status: ServiceStatus; service: Service }): OnboardingStep[] {
  return ALL_STEPS.filter((step) => {
    if (step === 'vocation') return answers.service === 'saf';
    if (step === 'ordRod') return answers.status === 'nsf';
    return true;
  });
}

/**
 * Progress bar for step `index` (0-based) of `total`: the bar's final fraction, and the scale it
 * animates on from (the previous step's width as a share of this one's). Step 1 grows from 0.
 */
export function stepProgress(index: number, total: number): { fraction: number; from: number } {
  const position = Math.min(index + 1, total);
  return { fraction: position / total, from: index <= 0 ? 0 : index / position };
}
