import { useState } from 'react';
import { findPlanChoice } from '@/features/planning/actions/plan-choice';
import type { Plan, PlanChoice } from '@/features/planning/entities/plan';

const usePlanStates = () => {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [planChoice, setPlanChoice] = useState<PlanChoice>(() => findPlanChoice());
  const [isAskingPlan, setIsAskingPlan] = useState(false);
  const [isAcceptingPlan, setIsAcceptingPlan] = useState(false);

  return {
    plan,
    setPlan,
    planChoice,
    setPlanChoice,
    isAskingPlan,
    setIsAskingPlan,
    isAcceptingPlan,
    setIsAcceptingPlan,
  };
};

export default usePlanStates;
