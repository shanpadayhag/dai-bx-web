import { useCallback, useRef, type FormEvent } from 'react';
import AppError from '@/core/app-error';
import hidePopover from '@/core/popover';
import reportAppError from '@/core/report-app-error';
import type { EventTimes } from '@/features/calendar/entities/calendar-drag';
import acceptPlanBlocks from '@/features/planning/actions/accept-plan-blocks';
import { savePlanChoice } from '@/features/planning/actions/plan-choice';
import proposePlan from '@/features/planning/actions/propose-plan';
import {
  pinnedBlocksOf,
  planFromProposal,
  proposalRequestOf,
  withPinnedBlock,
  withoutBlocks,
  type PlanChoice,
  type ProposedBlock,
} from '@/features/planning/entities/plan';
import type usePlanStates from '@/features/planning/states/use-plan-states';

export const PLAN_POPOVER_ID = 'plan-popover';
export const PLAN_DAYS_FIELD = 'planDays';
export const PLAN_GROUP_FIELD = 'planGroupId';

type PlanCallbacks = {
  allGroupIds: readonly string[];
  onShowPlanDays: (dayCount: PlanChoice['dayCount']) => void;
  onPlanAccepted: () => void;
};

const readPlanChoice = (planForm: FormData, allGroupIds: readonly string[]): PlanChoice => {
  const chosenGroupIds = planForm
    .getAll(PLAN_GROUP_FIELD)
    .filter((groupId): groupId is string => typeof groupId === 'string');
  if (chosenGroupIds.length === 0) {
    throw new AppError('Pick a group', 'Plan needs at least one group to take tasks from.');
  }
  return {
    dayCount: planForm.get(PLAN_DAYS_FIELD) === '7' ? 7 : 1,
    groupIds: allGroupIds.every((groupId) => chosenGroupIds.includes(groupId))
      ? null
      : chosenGroupIds,
  };
};

const usePlanEvents = (
  states: ReturnType<typeof usePlanStates>,
  { allGroupIds, onShowPlanDays, onPlanAccepted }: PlanCallbacks,
) => {
  const { plan, setPlan, setPlanChoice, setIsAskingPlan, setIsAcceptingPlan } = states;
  const lastAskIdRef = useRef(0);

  const askPlan = useCallback(
    async (
      planChoice: PlanChoice,
      pinnedBlocks: readonly ProposedBlock[],
      excludedTaskIds: readonly string[],
    ) => {
      lastAskIdRef.current += 1;
      const askId = lastAskIdRef.current;
      setIsAskingPlan(true);
      try {
        const proposalRecord = await proposePlan(
          proposalRequestOf(planChoice, pinnedBlocks, excludedTaskIds),
        );
        if (askId !== lastAskIdRef.current) return;
        setPlan(planFromProposal(proposalRecord, planChoice, pinnedBlocks, excludedTaskIds));
      } catch (planError) {
        reportAppError(planError);
      } finally {
        if (askId === lastAskIdRef.current) setIsAskingPlan(false);
      }
    },
    [setIsAskingPlan, setPlan],
  );

  const handleMakePlan = useCallback(
    (submitEvent: FormEvent<HTMLFormElement>) => {
      submitEvent.preventDefault();
      try {
        const planChoice = readPlanChoice(new FormData(submitEvent.currentTarget), allGroupIds);
        savePlanChoice(planChoice);
        setPlanChoice(planChoice);
        hidePopover(PLAN_POPOVER_ID);
        onShowPlanDays(planChoice.dayCount);
        void askPlan(planChoice, [], []);
      } catch (choiceError) {
        reportAppError(choiceError);
      }
    },
    [allGroupIds, askPlan, onShowPlanDays, setPlanChoice],
  );

  const handlePinBlock = useCallback(
    (taskId: string, blockTimes: EventTimes) => {
      setPlan((currentPlan) =>
        currentPlan === null ? currentPlan : withPinnedBlock(currentPlan, taskId, blockTimes),
      );
    },
    [setPlan],
  );

  const handleRejectBlock = useCallback(
    (taskId: string) => {
      if (plan === null) return;
      const excludedTaskIds = [...plan.excludedTaskIds, taskId];
      const pinnedBlocks = pinnedBlocksOf(plan).filter(
        (proposedBlock) => proposedBlock.taskId !== taskId,
      );
      setPlan(withoutBlocks(plan, [taskId]));
      void askPlan(plan, pinnedBlocks, excludedTaskIds);
    },
    [askPlan, plan, setPlan],
  );

  const acceptBlocks = useCallback(
    async (acceptedBlocks: readonly ProposedBlock[]) => {
      if (plan === null || acceptedBlocks.length === 0) return;
      setIsAcceptingPlan(true);
      try {
        await acceptPlanBlocks(acceptedBlocks);
        const acceptedTaskIds = acceptedBlocks.map((proposedBlock) => proposedBlock.taskId);
        setPlan((currentPlan) => {
          if (currentPlan === null) return currentPlan;
          const remainingPlan = withoutBlocks(currentPlan, acceptedTaskIds);
          return remainingPlan.blocks.length === 0 ? null : remainingPlan;
        });
        onPlanAccepted();
      } catch (acceptError) {
        reportAppError(acceptError);
      } finally {
        setIsAcceptingPlan(false);
      }
    },
    [onPlanAccepted, plan, setIsAcceptingPlan, setPlan],
  );

  const handleAcceptBlock = useCallback(
    (taskId: string) =>
      void acceptBlocks(
        plan?.blocks.filter((proposedBlock) => proposedBlock.taskId === taskId) ?? [],
      ),
    [acceptBlocks, plan],
  );

  const handleAcceptAll = useCallback(
    () => void acceptBlocks(plan?.blocks ?? []),
    [acceptBlocks, plan],
  );

  const handleDiscardPlan = useCallback(() => {
    lastAskIdRef.current += 1;
    setIsAskingPlan(false);
    setPlan(null);
  }, [setIsAskingPlan, setPlan]);

  return {
    handleMakePlan,
    handlePinBlock,
    handleRejectBlock,
    handleAcceptBlock,
    handleAcceptAll,
    handleDiscardPlan,
  };
};

export default usePlanEvents;
