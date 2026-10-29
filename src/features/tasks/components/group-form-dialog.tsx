import { FolderPlus, Settings2, Trash2 } from 'lucide-react';
import { useEffect, type FormEvent } from 'react';
import { categoryColorStyle, type Category } from '@/core/category';
import Button from '@/core/components/atoms/button';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import PopoverPanel from '@/core/components/molecules/popover-panel';

type GroupFormDialogProps = {
  dialogId: string;
  title: string;
  description: string;
  submitLabel: string;
  initialName: string;
  initialCategoryId: string | null;
  categories: readonly Category[];
  isSubmitting: boolean;
  deleteDialogId?: string;
  onSubmit: (submitEvent: FormEvent<HTMLFormElement>) => void;
};

const categoryOptionClassName =
  'inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border border-border px-2.5 text-[13px] font-medium text-foreground transition-colors duration-150 hover:border-border-strong has-checked:border-primary has-checked:bg-primary-soft/60 has-focus-visible:ring-4 has-focus-visible:ring-primary/15';

const GroupFormDialog = ({
  dialogId,
  title,
  description,
  submitLabel,
  initialName,
  initialCategoryId,
  categories,
  isSubmitting,
  deleteDialogId,
  onSubmit,
}: GroupFormDialogProps) => {
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
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
            {deleteDialogId === undefined ? (
              <FolderPlus className="size-5" />
            ) : (
              <Settings2 className="size-5" />
            )}
          </span>
          <div className="grid gap-1">
            <h2 className="text-base font-semibold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Field label="Name" htmlFor={nameInputId}>
          <Input
            id={nameInputId}
            name="groupName"
            defaultValue={initialName}
            maxLength={200}
            placeholder="Like a project or a day"
          />
        </Field>
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-[13px] font-medium text-foreground">Category</legend>
          <div className="flex flex-wrap gap-2">
            <label className={categoryOptionClassName}>
              <input
                type="radio"
                name="groupCategory"
                value=""
                defaultChecked={initialCategoryId === null}
                className="sr-only"
              />
              <span className="size-2 rounded-full border border-border-strong" />
              No category
            </label>
            {categories.map((category) => (
              <label
                key={category.id}
                style={categoryColorStyle(category)}
                className={categoryOptionClassName}
              >
                <input
                  type="radio"
                  name="groupCategory"
                  value={category.id}
                  defaultChecked={initialCategoryId === category.id}
                  className="sr-only"
                />
                <span className="category-swatch size-2 rounded-full" />
                {category.name}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
          {deleteDialogId === undefined ? (
            <span />
          ) : (
            <Button
              variant="ghost"
              popoverTarget={deleteDialogId}
              className="-ml-2 text-danger hover:bg-danger-soft hover:text-danger"
            >
              <Trash2 />
              Delete group
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="ghost" popoverTarget={dialogId} popoverTargetAction="hide">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {submitLabel}
            </Button>
          </div>
        </div>
      </form>
    </PopoverPanel>
  );
};

export default GroupFormDialog;
