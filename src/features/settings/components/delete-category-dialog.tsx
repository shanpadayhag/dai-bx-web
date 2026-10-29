import { Trash2 } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import PopoverPanel from '@/core/components/molecules/popover-panel';

export const DELETE_CATEGORY_DIALOG_ID = 'delete-category-dialog';

type DeleteCategoryDialogProps = {
  categoryName: string | null;
  isSubmitting: boolean;
  onConfirm: () => void;
};

const DeleteCategoryDialog = ({
  categoryName,
  isSubmitting,
  onConfirm,
}: DeleteCategoryDialogProps) => (
  <PopoverPanel
    id={DELETE_CATEGORY_DIALOG_ID}
    label="Delete category"
    className="w-[min(400px,calc(100vw-2rem))]"
  >
    <div className="grid gap-4 p-5">
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-danger-soft text-danger">
        <Trash2 className="size-5" />
      </span>
      <div className="grid gap-1">
        <h2 className="text-base font-semibold text-foreground">
          Delete “{categoryName ?? 'this category'}”?
        </h2>
        <p className="text-sm text-muted-foreground">
          Groups that use it stay where they are, with no category.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          popoverTarget={DELETE_CATEGORY_DIALOG_ID}
          popoverTargetAction="hide"
        >
          Cancel
        </Button>
        <Button
          variant="danger"
          disabled={isSubmitting || categoryName === null}
          onClick={onConfirm}
        >
          Delete category
        </Button>
      </div>
    </div>
  </PopoverPanel>
);

export default DeleteCategoryDialog;
