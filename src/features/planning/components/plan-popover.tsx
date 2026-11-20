import { Sparkles } from 'lucide-react';
import type { FormEvent } from 'react';
import Button from '@/core/components/atoms/button';
import Checkbox from '@/core/components/atoms/checkbox';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import type { PlanChoice } from '@/features/planning/entities/plan';
import { PLAN_DAYS_FIELD, PLAN_GROUP_FIELD } from '@/features/planning/events/use-plan-events';

type PlanGroupChoice = {
  id: string;
  name: string;
};

type PlanPopoverProps = {
  popoverId: string;
  planChoice: PlanChoice;
  taskGroups: readonly PlanGroupChoice[] | null;
  isAskingPlan: boolean;
  onOpen: () => void;
  onMakePlan: (submitEvent: FormEvent<HTMLFormElement>) => void;
};

const DAY_COUNT_OPTIONS = [
  { dayCount: 1, label: 'Today' },
  { dayCount: 7, label: 'Next 7 days' },
] as const;

const PlanPopover = ({
  popoverId,
  planChoice,
  taskGroups,
  isAskingPlan,
  onOpen,
  onMakePlan,
}: PlanPopoverProps) => (
  <>
    <Button variant="secondary" popoverTarget={popoverId} disabled={isAskingPlan} onClick={onOpen}>
      <Sparkles />
      {isAskingPlan ? 'Planning…' : 'Plan'}
    </Button>
    <PopoverPanel id={popoverId} label="Make a plan" className="w-[min(380px,calc(100vw-2rem))]">
      <form
        key={`${JSON.stringify(planChoice)}-${taskGroups === null ? 'loading' : taskGroups.length}`}
        className="grid gap-5 p-5"
        onSubmit={onMakePlan}
      >
        <div className="grid gap-1">
          <h2 className="text-base font-semibold text-foreground">Make a plan</h2>
          <p className="text-sm text-muted-foreground">
            Puts tasks with estimates into free time in your planning hours. Nothing is saved until
            you accept.
          </p>
        </div>
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-[13px] font-medium text-foreground">Plan for</legend>
          <div className="grid grid-cols-2 gap-2">
            {DAY_COUNT_OPTIONS.map((dayCountOption) => (
              <label
                key={dayCountOption.dayCount}
                className="inline-flex h-9 cursor-pointer items-center justify-center rounded-lg border border-border text-[13px] font-medium text-foreground transition-colors duration-150 hover:border-border-strong has-checked:border-primary has-checked:bg-primary-soft/60 has-focus-visible:ring-4 has-focus-visible:ring-primary/15"
              >
                <input
                  type="radio"
                  name={PLAN_DAYS_FIELD}
                  value={dayCountOption.dayCount}
                  defaultChecked={dayCountOption.dayCount === planChoice.dayCount}
                  className="sr-only"
                />
                {dayCountOption.label}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-[13px] font-medium text-foreground">Groups</legend>
          {taskGroups === null ? (
            <p role="status" className="text-sm text-muted-foreground">
              Loading groups…
            </p>
          ) : (
            <div className="grid max-h-56 gap-2 overflow-y-auto">
              {taskGroups.map((taskGroup) => (
                <Checkbox
                  key={taskGroup.id}
                  id={`plan-group-${taskGroup.id}`}
                  name={PLAN_GROUP_FIELD}
                  value={taskGroup.id}
                  label={taskGroup.name}
                  defaultChecked={
                    planChoice.groupIds === null || planChoice.groupIds.includes(taskGroup.id)
                  }
                />
              ))}
            </div>
          )}
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" popoverTarget={popoverId} popoverTargetAction="hide">
            Cancel
          </Button>
          <Button type="submit" disabled={taskGroups === null || taskGroups.length === 0}>
            Make plan
          </Button>
        </div>
      </form>
    </PopoverPanel>
  </>
);

export default PlanPopover;
