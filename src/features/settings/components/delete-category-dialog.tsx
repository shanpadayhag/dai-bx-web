import { Trash2 } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import PopoverPanel from '@/core/components/molecules/popover-panel';

const DeleteCategoryDialog = () => (
  <PopoverPanel
    id="delete-category-dialog"
    label="Delete category"
    className="w-[min(400px,calc(100vw-2rem))]"
  >
    <div className="grid gap-4 p-5">
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-danger-soft text-danger">
        <Trash2 className="size-5" />
      </span>
      <div className="grid gap-1">
        <h2 className="text-base font-semibold text-foreground">Delete “Studies”?</h2>
        <p className="text-sm text-muted-foreground">
          Its 14 groups, cards and events stay where they are, without a category. Past calendar
          events keep their times.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="ghost" popoverTarget="delete-category-dialog" popoverTargetAction="hide">
          Cancel
        </Button>
        <Button variant="danger">Delete category</Button>
      </div>
    </div>
  </PopoverPanel>
);

export default DeleteCategoryDialog;
