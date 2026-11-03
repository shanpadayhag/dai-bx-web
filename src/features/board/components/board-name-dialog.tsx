import { useEffect, type FormEvent, type ReactNode } from 'react';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import PopoverPanel from '@/core/components/molecules/popover-panel';

type BoardNameDialogProps = {
  dialogId: string;
  icon: ReactNode;
  title: string;
  description: string;
  nameLabel: string;
  namePlaceholder: string;
  initialName: string;
  submitLabel: string;
  submittingLabel?: string;
  isSubmitting?: boolean;
  onSubmit: (submitEvent: FormEvent<HTMLFormElement>) => void;
};

const BoardNameDialog = ({
  dialogId,
  icon,
  title,
  description,
  nameLabel,
  namePlaceholder,
  initialName,
  submitLabel,
  submittingLabel = submitLabel,
  isSubmitting = false,
  onSubmit,
}: BoardNameDialogProps) => {
  const nameInputId = `${dialogId}-name`;

  useEffect(() => {
    const dialogElement = document.getElementById(dialogId);
    if (dialogElement === null) return;
    const focusNameOnOpen = (toggleEvent: Event) => {
      if ((toggleEvent as ToggleEvent).newState === 'open') {
        document.getElementById(nameInputId)?.focus();
      }
    };
    dialogElement.addEventListener('toggle', focusNameOnOpen);
    return () => dialogElement.removeEventListener('toggle', focusNameOnOpen);
  }, [dialogId, nameInputId]);

  return (
    <PopoverPanel id={dialogId} label={title}>
      <form className="grid gap-5 p-5 sm:p-6" onSubmit={onSubmit}>
        <div className="flex items-start gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground [&_svg]:size-5">
            {icon}
          </span>
          <div className="grid gap-1">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Field label={nameLabel} htmlFor={nameInputId}>
          <Input
            key={initialName}
            id={nameInputId}
            name="name"
            defaultValue={initialName}
            maxLength={100}
            placeholder={namePlaceholder}
          />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" popoverTarget={dialogId} popoverTargetAction="hide">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
        </div>
      </form>
    </PopoverPanel>
  );
};

export default BoardNameDialog;
