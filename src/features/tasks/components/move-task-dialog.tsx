import { CornerDownRight, MoveRight } from 'lucide-react';
import { categoryColorStyle } from '@/core/category';
import joinClassNames from '@/core/class-names';
import Button from '@/core/components/atoms/button';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import MoveTarget from '@/features/tasks/entities/move-target';
import Task from '@/features/tasks/entities/task';
import TaskGroup from '@/features/tasks/entities/task-group';

type MoveTaskDialogProps = {
  task: Task;
  taskGroups: TaskGroup[];
  selectedTaskGroupId: TaskGroup['id'];
  moveTargets: MoveTarget[];
  selectedParentTaskId: MoveTarget['id'] | null;
};

const optionClassName =
  'flex cursor-pointer items-center gap-2 rounded-lg text-[13px] transition-colors duration-150 has-checked:bg-primary-soft/70 has-checked:font-medium has-checked:text-foreground has-focus-visible:ring-4 has-focus-visible:ring-primary/15 hover:bg-surface';

const subtaskCountText = (subtaskCount: number) =>
  subtaskCount === 0
    ? 'Choose where it goes.'
    : `Its ${subtaskCount === 1 ? 'subtask moves' : `${subtaskCount} subtasks move`} with it.`;

const MoveTaskDialog = ({
  task,
  taskGroups,
  selectedTaskGroupId,
  moveTargets,
  selectedParentTaskId,
}: MoveTaskDialogProps) => {
  const selectedTaskGroup = taskGroups.find((taskGroup) => taskGroup.id === selectedTaskGroupId);

  return (
    <PopoverPanel id="move-task-dialog" label={`Move ${task.name}`}>
      <form className="grid gap-5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
            <MoveRight className="size-5" />
          </span>
          <div className="grid min-w-0 gap-1">
            <h2 className="text-base font-semibold text-balance text-foreground">
              Move “{task.name}”
            </h2>
            <p className="text-sm text-muted-foreground">{subtaskCountText(task.tasks.length)}</p>
          </div>
        </div>
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-[13px] font-medium text-foreground">Group</legend>
          <div className="flex flex-wrap gap-2">
            {taskGroups.map((taskGroup) => (
              <label
                key={taskGroup.id}
                className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-border px-2.5 text-[13px] font-medium text-foreground transition-colors duration-150 hover:border-border-strong has-checked:border-primary has-checked:bg-primary-soft/60 has-focus-visible:ring-4 has-focus-visible:ring-primary/15"
              >
                <input
                  type="radio"
                  name="move-group"
                  value={taskGroup.id}
                  defaultChecked={taskGroup.id === selectedTaskGroupId}
                  className="sr-only"
                />
                {taskGroup.category ? (
                  <span
                    style={categoryColorStyle(taskGroup.category)}
                    className="category-swatch size-2 rounded-full"
                  />
                ) : (
                  <span className="size-2 rounded-full border border-border-strong" />
                )}
                {taskGroup.name}
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-[13px] font-medium text-foreground">Put it</legend>
          <div className="grid max-h-64 grid-cols-[minmax(0,1fr)] gap-0.5 overflow-y-auto overscroll-contain rounded-xl border border-border p-1.5">
            <label className={joinClassNames(optionClassName, 'h-9 px-2.5 text-foreground')}>
              <input
                type="radio"
                name="move-parent"
                value=""
                defaultChecked={selectedParentTaskId === null}
                className="sr-only"
              />
              At the top of {selectedTaskGroup?.name ?? 'the group'}
            </label>
            {moveTargets.map((moveTarget) => (
              <label
                key={moveTarget.id}
                style={{ paddingLeft: `${0.625 + moveTarget.depth * 1.25}rem` }}
                className={joinClassNames(
                  optionClassName,
                  'h-9 pr-2.5',
                  moveTarget.isDone ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                <input
                  type="radio"
                  name="move-parent"
                  value={moveTarget.id}
                  defaultChecked={moveTarget.id === selectedParentTaskId}
                  className="sr-only"
                />
                <CornerDownRight className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="truncate">Under {moveTarget.name}</span>
                {moveTarget.isDone ? (
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    done · reopens
                  </span>
                ) : null}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" popoverTarget="move-task-dialog" popoverTargetAction="hide">
            Cancel
          </Button>
          <Button type="submit">Move task</Button>
        </div>
      </form>
    </PopoverPanel>
  );
};

export default MoveTaskDialog;
