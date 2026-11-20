import { CalendarClock } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import type { FormEvent } from 'react';
import {
  NO_TASK_PLANNING,
  TASK_PRIORITY_LABELS,
  type TaskPlanning,
  type TaskPriority,
} from '@/features/tasks/entities/task-planning';

type TaskPlanningDialogProps = {
  dialogId: string;
  taskName: string;
  taskId: string | null;
  taskPlanning: TaskPlanning | null;
  onSubmit: (submitEvent: FormEvent<HTMLFormElement>) => void;
};

const PRIORITY_ORDER: readonly TaskPriority[] = ['high', 'normal', 'low'];

const TaskPlanningDialog = ({
  dialogId,
  taskName,
  taskId,
  taskPlanning,
  onSubmit,
}: TaskPlanningDialogProps) => {
  const shownPlanning = taskPlanning ?? NO_TASK_PLANNING;
  const formKey = JSON.stringify([
    taskId,
    shownPlanning.priority,
    shownPlanning.due,
    shownPlanning.planBetween,
  ]);

  return (
    <PopoverPanel id={dialogId} label={`Planning for ${taskName}`}>
      <form key={formKey} className="grid gap-5 p-5 sm:p-6" onSubmit={onSubmit}>
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
            <CalendarClock className="size-5" />
          </span>
          <div className="grid min-w-0 gap-1">
            <h2 className="text-base font-semibold text-balance text-foreground">
              Planning for “{taskName}”
            </h2>
            <p className="text-sm text-muted-foreground">
              Plan uses these to order the task and find it a time.
            </p>
          </div>
        </div>
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-[13px] font-medium text-foreground">Priority</legend>
          <div className="flex flex-wrap gap-2">
            {PRIORITY_ORDER.map((priority) => (
              <label
                key={priority}
                className="inline-flex h-8 cursor-pointer items-center rounded-lg border border-border px-3 text-[13px] font-medium text-foreground transition-colors duration-150 hover:border-border-strong has-checked:border-primary has-checked:bg-primary-soft/60 has-focus-visible:ring-4 has-focus-visible:ring-primary/15"
              >
                <input
                  type="radio"
                  name="priority"
                  value={priority}
                  defaultChecked={priority === shownPlanning.priority}
                  className="sr-only"
                />
                {TASK_PRIORITY_LABELS[priority]}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-3">
          <Field
            label="Due"
            htmlFor="task-due-date"
            hint="Without a time, it’s due by the end of the day."
          >
            <Input
              id="task-due-date"
              name="dueDate"
              type="date"
              defaultValue={shownPlanning.due?.date ?? ''}
            />
          </Field>
          <Field label="Time" htmlFor="task-due-time">
            <Input
              id="task-due-time"
              name="dueTime"
              type="time"
              defaultValue={shownPlanning.due?.time ?? ''}
            />
          </Field>
        </div>
        <fieldset className="grid gap-1.5">
          <legend className="mb-1.5 text-[13px] font-medium text-foreground">Plan between</legend>
          <div className="flex items-center gap-2">
            <Input
              aria-label="Plan between start"
              name="windowStart"
              type="time"
              defaultValue={shownPlanning.planBetween?.start ?? ''}
            />
            <span className="text-sm text-muted-foreground">to</span>
            <Input
              aria-label="Plan between end"
              name="windowEnd"
              type="time"
              defaultValue={shownPlanning.planBetween?.end ?? ''}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Empty uses your planning hours. An end before the start runs past midnight.
          </p>
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" popoverTarget={dialogId} popoverTargetAction="hide">
            Cancel
          </Button>
          <Button type="submit">Save</Button>
        </div>
      </form>
    </PopoverPanel>
  );
};

export default TaskPlanningDialog;
