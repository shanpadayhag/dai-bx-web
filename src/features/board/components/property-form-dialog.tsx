import { GripVertical, ListFilter, Plus, Trash2 } from 'lucide-react';
import { categoryColorStyle } from '@/core/category';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import SegmentedControl from '@/core/components/molecules/segmented-control';
import OptionColorMenu from '@/features/board/components/option-color-menu';
import type BoardProperty from '@/features/board/entities/board-property';
import BoardPropertyKind, {
  boardPropertyKindLabels,
} from '@/features/board/enums/board-property-kind';

type PropertyFormDialogProps = {
  dialogId: string;
  property: BoardProperty;
  deleteOptionDialogId: string;
};

const kindLabels = Object.values(boardPropertyKindLabels);

const PropertyFormDialog = ({
  dialogId,
  property,
  deleteOptionDialogId,
}: PropertyFormDialogProps) => {
  const nameInputId = `${dialogId}-name`;
  const colorMenuId = `${dialogId}-color-menu`;

  return (
    <PopoverPanel
      id={dialogId}
      label={`Edit ${property.name}`}
      className="w-[min(480px,calc(100vw-2rem))]"
    >
      <form className="grid max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]">
        <div className="flex items-start gap-3 p-5 pb-4 sm:px-6 sm:pt-6">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
            <ListFilter className="size-5" />
          </span>
          <div className="grid gap-1">
            <h2 className="text-base font-semibold text-foreground">Edit “{property.name}”</h2>
            <p className="text-sm text-muted-foreground">
              Renaming an option renames it on every card that uses it.
            </p>
          </div>
        </div>
        <div className="grid content-start gap-5 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">
          <Field label="Name" htmlFor={nameInputId}>
            <Input
              id={nameInputId}
              name="propertyName"
              defaultValue={property.name}
              maxLength={50}
              placeholder="Like Project or Size"
            />
          </Field>
          <div className="grid gap-1.5">
            <p className="text-[13px] font-medium text-foreground">Type</p>
            <div className="opacity-60">
              <SegmentedControl
                label="Type"
                options={kindLabels}
                selectedOption={boardPropertyKindLabels[property.kind]}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              A property’s type is set when it’s created and can’t change.
            </p>
          </div>
          {property.kind === BoardPropertyKind.Choice ? (
            <fieldset className="grid gap-2">
              <legend className="mb-1.5 flex w-full items-center justify-between text-[13px] font-medium text-foreground">
                Options
                <span className="font-normal text-muted-foreground tabular-nums">
                  {property.options.length} of 50
                </span>
              </legend>
              <ul className="grid gap-1.5">
                {property.options.map((option) => (
                  <li key={option.id} className="flex items-center gap-1.5">
                    <span
                      aria-hidden="true"
                      className="hidden h-10 w-5 cursor-grab items-center justify-center text-muted-foreground sm:inline-flex"
                    >
                      <GripVertical className="size-4" />
                    </span>
                    <button
                      type="button"
                      popoverTarget={colorMenuId}
                      aria-label={`Color for ${option.name}`}
                      style={
                        option.color === null
                          ? undefined
                          : categoryColorStyle({ ...option, color: option.color })
                      }
                      className="inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] border border-border-strong bg-background shadow-soft transition-[border-color] duration-150 hover:border-primary/40"
                    >
                      {option.color === null ? (
                        <span className="size-4 rounded-full border border-dashed border-muted-foreground" />
                      ) : (
                        <span className="category-swatch size-4 rounded-full" />
                      )}
                    </button>
                    <Input
                      aria-label={`Option name, currently ${option.name}`}
                      defaultValue={option.name}
                      maxLength={50}
                    />
                    <IconButton
                      label={`Delete option ${option.name}`}
                      tone="danger"
                      popoverTarget={deleteOptionDialogId}
                      className="size-10"
                    >
                      <Trash2 />
                    </IconButton>
                  </li>
                ))}
              </ul>
              <Button variant="ghost" size="sm" className="justify-self-start">
                <Plus />
                Add option
              </Button>
              <OptionColorMenu menuId={colorMenuId} />
            </fieldset>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">
          <Button variant="ghost" popoverTarget={dialogId} popoverTargetAction="hide">
            Cancel
          </Button>
          <Button type="submit">Save property</Button>
        </div>
      </form>
    </PopoverPanel>
  );
};

export default PropertyFormDialog;
