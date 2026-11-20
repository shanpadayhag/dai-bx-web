import type { PlanChoice } from '@/features/planning/entities/plan';

const PLAN_CHOICE_KEY = 'daibx:plan-choice';

const DEFAULT_PLAN_CHOICE: PlanChoice = { dayCount: 1, groupIds: null };

const isStringList = (storedValue: unknown): storedValue is string[] =>
  Array.isArray(storedValue) && storedValue.every((listItem) => typeof listItem === 'string');

const readPlanChoice = (storedText: string | null): PlanChoice => {
  if (storedText === null) return DEFAULT_PLAN_CHOICE;
  try {
    const storedChoice: unknown = JSON.parse(storedText);
    if (typeof storedChoice !== 'object' || storedChoice === null) return DEFAULT_PLAN_CHOICE;
    const { dayCount, groupIds } = storedChoice as Record<string, unknown>;
    return {
      dayCount: dayCount === 7 ? 7 : 1,
      groupIds: isStringList(groupIds) ? groupIds : null,
    };
  } catch {
    return DEFAULT_PLAN_CHOICE;
  }
};

const localStoragePlanChoiceSource = {
  find: (): PlanChoice => {
    try {
      return readPlanChoice(window.localStorage.getItem(PLAN_CHOICE_KEY));
    } catch {
      return DEFAULT_PLAN_CHOICE;
    }
  },
  save: (planChoice: PlanChoice) => {
    try {
      window.localStorage.setItem(PLAN_CHOICE_KEY, JSON.stringify(planChoice));
    } catch {
      return;
    }
  },
};

export default localStoragePlanChoiceSource;
