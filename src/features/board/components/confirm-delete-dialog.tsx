import { Trash2 } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import PopoverPanel from '@/core/components/molecules/popover-panel';

type ConfirmDeleteDialogProps = {
  dialogId: string;
  title: string;
  description: string;
  confirmLabel: string;
};

const ConfirmDeleteDialog = ({
  dialogId,
  title,
  description,
  confirmLabel,
}: ConfirmDeleteDialogProps) => (
  <PopoverPanel id={dialogId} label={title} className="w-[min(400px,calc(100vw-2rem))]">
    <div className="grid gap-4 p-5">
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-danger-soft text-danger">
        <Trash2 className="size-5" />
      </span>
      <div className="grid gap-1">
        <h2 className="text-base font-semibold text-balance text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description} This can’t be undone.</p>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="ghost" popoverTarget={dialogId} popoverTargetAction="hide">
          Cancel
        </Button>
        <Button variant="danger">{confirmLabel}</Button>
      </div>
    </div>
  </PopoverPanel>
);

export default ConfirmDeleteDialog;
