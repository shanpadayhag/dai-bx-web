import localStoragePlanChoiceSource from '@/features/planning/data_sources/local_storage/plan-choice-source';
import type { PlanChoice } from '@/features/planning/entities/plan';

export const findPlanChoice = (): PlanChoice => localStoragePlanChoiceSource.find();

export const savePlanChoice = (planChoice: PlanChoice) =>
  localStoragePlanChoiceSource.save(planChoice);
