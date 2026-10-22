import { Trash2 } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import PopoverPanel from '@/core/components/molecules/popover-panel';

const DeleteTaskDialog = () => (
  <PopoverPanel
    id="delete-task-dialog"
    label="Delete task"
    className="w-[min(400px,calc(100vw-2rem))]"
  >
    <div className="grid gap-4 p-5">
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-danger-soft text-danger">
        <Trash2 className="size-5" />
      </span>
      <div className="grid gap-1">
        <h2 className="text-base font-semibold text-foreground">
          Delete “Plan the backend on Lambda”?
        </h2>
        <p className="text-sm text-muted-foreground">
          Its 2 subtasks are deleted with it. Calendar events it already tracked stay on your
          calendar.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" popoverTarget="delete-task-dialog" popoverTargetAction="hide">
          Cancel
        </Button>
        <Button variant="danger">Delete task and subtasks</Button>
      </div>
    </div>
  </PopoverPanel>
);

export default DeleteTaskDialog;
