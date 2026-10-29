import { Trash2 } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import type TaskGroup from '@/features/tasks/entities/task-group';

type DeleteGroupDialogProps = {
  dialogId: string;
  taskGroup: TaskGroup | null;
  isSubmitting: boolean;
  onConfirm: () => void;
};

const describeTaskCount = (taskCount: number) => {
  if (taskCount === 0) return 'It has no tasks.';
  if (taskCount === 1) return 'Its 1 task is deleted with it, done or not.';
  return `All ${taskCount} of its tasks are deleted with it, done or not.`;
};

const DeleteGroupDialog = ({
  dialogId,
  taskGroup,
  isSubmitting,
  onConfirm,
}: DeleteGroupDialogProps) => (
  <PopoverPanel id={dialogId} label="Delete group" className="w-[min(400px,calc(100vw-2rem))]">
    <div className="grid gap-4 p-5">
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-danger-soft text-danger">
        <Trash2 className="size-5" />
      </span>
      <div className="grid gap-1">
        <h2 className="text-base font-semibold text-foreground">
          Delete the “{taskGroup?.name ?? 'this'}” group?
        </h2>
        <p className="text-sm text-muted-foreground">
          {describeTaskCount(taskGroup?.taskCount ?? 0)} This can’t be undone.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" popoverTarget={dialogId} popoverTargetAction="hide">
          Cancel
        </Button>
        <Button variant="danger" disabled={isSubmitting || taskGroup === null} onClick={onConfirm}>
          Delete group and tasks
        </Button>
      </div>
    </div>
  </PopoverPanel>
);

export default DeleteGroupDialog;
