import { Trash2 } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import PopoverPanel from '@/core/components/molecules/popover-panel';

type DeleteTaskDialogProps = {
  dialogId: string;
  taskName: string | null;
  subtaskCount: number;
  onConfirm: () => void;
};

const describeSubtasks = (subtaskCount: number) => {
  if (subtaskCount === 0) return '';
  if (subtaskCount === 1) return 'Its 1 subtask is deleted with it. ';
  return `Its ${subtaskCount} subtasks are deleted with it. `;
};

const DeleteTaskDialog = ({
  dialogId,
  taskName,
  subtaskCount,
  onConfirm,
}: DeleteTaskDialogProps) => (
  <PopoverPanel id={dialogId} label="Delete task" className="w-[min(400px,calc(100vw-2rem))]">
    <div className="grid gap-4 p-5">
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-danger-soft text-danger">
        <Trash2 className="size-5" />
      </span>
      <div className="grid gap-1">
        <h2 className="text-base font-semibold text-foreground">
          Delete “{taskName ?? 'this task'}”?
        </h2>
        <p className="text-sm text-muted-foreground">
          {describeSubtasks(subtaskCount)}This can’t be undone.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" popoverTarget={dialogId} popoverTargetAction="hide">
          Cancel
        </Button>
        <Button variant="danger" disabled={taskName === null} onClick={onConfirm}>
          {subtaskCount === 0 ? 'Delete task' : 'Delete task and subtasks'}
        </Button>
      </div>
    </div>
  </PopoverPanel>
);

export default DeleteTaskDialog;
