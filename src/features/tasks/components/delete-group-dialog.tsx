import { Trash2 } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import TaskGroup from '@/features/tasks/entities/task-group';

type DeleteGroupDialogProps = {
  taskGroup: TaskGroup;
};

const taskCountText = (taskCount: number) =>
  taskCount === 1 ? 'Its 1 task is' : `All ${taskCount} of its tasks are`;

const DeleteGroupDialog = ({ taskGroup }: DeleteGroupDialogProps) => (
  <PopoverPanel
    id="delete-group-dialog"
    label="Delete group"
    className="w-[min(400px,calc(100vw-2rem))]"
  >
    <div className="grid gap-4 p-5">
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-danger-soft text-danger">
        <Trash2 className="size-5" />
      </span>
      <div className="grid gap-1">
        <h2 className="text-base font-semibold text-foreground">
          Delete the “{taskGroup.name}” group?
        </h2>
        <p className="text-sm text-muted-foreground">
          {taskGroup.taskCount === 0
            ? 'It has no tasks.'
            : `${taskCountText(taskGroup.taskCount)} deleted with it, done or not.`}{' '}
          This can’t be undone.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" popoverTarget="delete-group-dialog" popoverTargetAction="hide">
          Cancel
        </Button>
        <Button variant="danger">Delete group and tasks</Button>
      </div>
    </div>
  </PopoverPanel>
);

export default DeleteGroupDialog;
