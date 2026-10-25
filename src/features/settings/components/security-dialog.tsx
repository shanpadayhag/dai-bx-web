import type { FormEvent, ReactNode } from 'react';
import joinClassNames from '@/core/class-names';
import Button from '@/core/components/atoms/button';
import PopoverPanel from '@/core/components/molecules/popover-panel';

type SecurityDialogProps = {
  id: string;
  title: string;
  description: ReactNode;
  icon: ReactNode;
  isDestructive?: boolean;
  confirmLabel: string;
  isSubmitting?: boolean;
  onSubmit: (submitEvent: FormEvent<HTMLFormElement>) => void;
  completedContent?: ReactNode;
  children?: ReactNode;
};

const SecurityDialog = ({
  id,
  title,
  description,
  icon,
  isDestructive = false,
  confirmLabel,
  isSubmitting = false,
  onSubmit,
  completedContent,
  children,
}: SecurityDialogProps) => (
  <PopoverPanel id={id} label={title}>
    <div className="grid gap-5 p-5 sm:p-6">
      <span
        className={joinClassNames(
          'inline-flex size-10 items-center justify-center rounded-xl [&_svg]:size-5',
          isDestructive
            ? 'bg-danger-soft text-danger'
            : 'bg-primary-soft text-primary-soft-foreground',
        )}
      >
        {icon}
      </span>
      <div className="grid gap-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {completedContent ?? (
        <form className="grid gap-5" onSubmit={onSubmit}>
          {children ? <div className="grid gap-4">{children}</div> : null}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" popoverTarget={id} popoverTargetAction="hide">
              Cancel
            </Button>
            <Button
              type="submit"
              variant={isDestructive ? 'danger' : 'primary'}
              disabled={isSubmitting}
            >
              {confirmLabel}
            </Button>
          </div>
        </form>
      )}
    </div>
  </PopoverPanel>
);

export default SecurityDialog;
