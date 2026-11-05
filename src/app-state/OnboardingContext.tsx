import type { GoalTarget } from '@/domain/goals/goals';
import type { Award } from '@/domain/scoring/awards';
import { ProfileFormValues, toValues } from '@/ui/ProfileForm';
import { createContext, ReactNode, useContext, useState } from 'react';
import { useRepositories } from './RepositoriesContext';

export type GoalChoice = Exclude<Award, 'fail'> | null;

type Onboarding = {
  values: ProfileFormValues;
  set<K extends keyof ProfileFormValues>(key: K, value: ProfileFormValues[K]): void;
  goal: GoalChoice;
  setGoal(goal: GoalChoice): void;
};

const Ctx = createContext<Onboarding | null>(null);

const goalChoice = (g: GoalTarget | null): GoalChoice => (g?.kind === 'award' ? g.award : null);

/** Answers shared by the onboarding steps. Starts from the saved profile, so Settings can reuse the steps as editors. */
export function OnboardingProvider({ children }: { children: ReactNode }) {
  const repos = useRepositories();
  const [values, setValues] = useState<ProfileFormValues>(() => toValues(repos.profile.get() ?? undefined));
  const [goal, setGoal] = useState<GoalChoice>(() => goalChoice(repos.goal.get()));
  const set: Onboarding['set'] = (key, value) => setValues((old) => ({ ...old, [key]: value }));
  return <Ctx.Provider value={{ values, set, goal, setGoal }}>{children}</Ctx.Provider>;
}

export function useOnboarding(): Onboarding {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return ctx;
}
