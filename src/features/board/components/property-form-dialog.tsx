import { ArrowDown, ArrowUp, ListFilter, Plus, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import SegmentedControl from '@/core/components/molecules/segmented-control';
import readFormText from '@/core/form-text';
import InlineNameInput from '@/features/board/components/inline-name-input';
import OptionColorButton from '@/features/board/components/option-color-button';
import OptionColorMenu from '@/features/board/components/option-color-menu';
import type BoardProperty from '@/features/board/entities/board-property';
import BoardPropertyKind, {
  boardPropertyKindLabels,
} from '@/features/board/enums/board-property-kind';

export const PROPERTY_OPTIONS_MAX = 50;

type PropertyFormDialogProps = {
  dialogId: string;
  property: BoardProperty | null;
  deleteOptionDialogId: string;
  onRenameProperty: (propertyId: string, enteredName: string) => void;
  onAddOption: (propertyId: string, enteredName: string) => Promise<boolean>;
  onRenameOption: (optionId: string, enteredName: string) => void;
  onChooseOptionColor: (optionId: string, color: string | null) => void;
  onMoveOptionBy: (optionId: string, positionStep: number) => void;
  onStartDeleteOption: (optionId: string) => void;
};

const kindLabels = Object.values(boardPropertyKindLabels);

const PropertyFormDialog = ({ dialogId, property, ...contentProps }: PropertyFormDialogProps) => (
  <PopoverPanel
    id={dialogId}
    label={property === null ? 'Edit property' : `Edit ${property.name}`}
    className="w-[min(480px,calc(100vw-2rem))]"
  >
    {property === null ? null : (
      <PropertyFormContent
        key={property.id}
        dialogId={dialogId}
        property={property}
        {...contentProps}
      />
    )}
  </PopoverPanel>
);

type PropertyFormContentProps = Omit<PropertyFormDialogProps, 'property'> & {
  property: BoardProperty;
};

const PropertyFormContent = ({
  dialogId,
  property,
  deleteOptionDialogId,
  onRenameProperty,
  onAddOption,
  onRenameOption,
  onChooseOptionColor,
  onMoveOptionBy,
  onStartDeleteOption,
}: PropertyFormContentProps) => {
  const [colorTargetOptionId, setColorTargetOptionId] = useState<string | null>(null);
  const [isAddingOption, setIsAddingOption] = useState(false);
  const nameInputId = `${dialogId}-name`;
  const colorMenuId = `${dialogId}-color-menu`;
  const colorTargetOption = property.options.find((option) => option.id === colorTargetOptionId);
  const isOptionLimitReached = property.options.length >= PROPERTY_OPTIONS_MAX;

  const submitNewOption = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    const newOptionForm = submitEvent.currentTarget;
    setIsAddingOption(true);
    const isAdded = await onAddOption(
      property.id,
      readFormText(new FormData(newOptionForm), 'optionName'),
    );
    setIsAddingOption(false);
    if (isAdded) newOptionForm.reset();
  };

  return (
    <div className="grid max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]">
      <div className="flex items-start gap-3 p-5 pb-4 sm:px-6 sm:pt-6">
        <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
          <ListFilter className="size-5" />
        </span>
        <div className="grid gap-1">
          <h2 className="text-base font-semibold text-foreground">Edit “{property.name}”</h2>
          <p className="text-sm text-muted-foreground">
            Changes save as you make them. Renaming an option renames it on every card.
          </p>
        </div>
      </div>
      <div className="grid content-start gap-5 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">
        <Field label="Name" htmlFor={nameInputId}>
          <InlineNameInput
            id={nameInputId}
            currentName={property.name}
            maxLength={50}
            placeholder="Like Project or Size"
            onCommitName={(enteredName) => onRenameProperty(property.id, enteredName)}
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
          <section className="grid gap-2" aria-labelledby={`${dialogId}-options`}>
            <h3
              id={`${dialogId}-options`}
              className="flex items-center justify-between text-[13px] font-medium text-foreground"
            >
              Options
              <span className="font-normal text-muted-foreground tabular-nums">
                {property.options.length} of {PROPERTY_OPTIONS_MAX}
              </span>
            </h3>
            <ul className="grid gap-1.5">
              {property.options.map((option, optionIndex) => (
                <li key={option.id} className="flex items-center gap-1.5">
                  <span className="flex flex-col">
                    <IconButton
                      label={`Move ${option.name} up`}
                      disabled={optionIndex === 0}
                      onClick={() => onMoveOptionBy(option.id, -1)}
                      className="h-5 w-7 rounded-md disabled:opacity-30 [&_svg]:size-3.5"
                    >
                      <ArrowUp />
                    </IconButton>
                    <IconButton
                      label={`Move ${option.name} down`}
                      disabled={optionIndex === property.options.length - 1}
                      onClick={() => onMoveOptionBy(option.id, 1)}
                      className="h-5 w-7 rounded-md disabled:opacity-30 [&_svg]:size-3.5"
                    >
                      <ArrowDown />
                    </IconButton>
                  </span>
                  <OptionColorButton
                    colorMenuId={colorMenuId}
                    optionName={option.name}
                    color={option.color}
                    onOpenMenu={() => setColorTargetOptionId(option.id)}
                  />
                  <InlineNameInput
                    aria-label={`Name of option ${option.name}`}
                    currentName={option.name}
                    maxLength={50}
                    onCommitName={(enteredName) => onRenameOption(option.id, enteredName)}
                  />
                  <IconButton
                    label={`Delete option ${option.name}`}
                    tone="danger"
                    popoverTarget={deleteOptionDialogId}
                    onClick={() => onStartDeleteOption(option.id)}
                    className="size-10"
                  >
                    <Trash2 />
                  </IconButton>
                </li>
              ))}
            </ul>
            <form
              className="flex items-center gap-1.5"
              onSubmit={(submitEvent) => void submitNewOption(submitEvent)}
            >
              <label htmlFor={`${dialogId}-new-option`} className="sr-only">
                New option name
              </label>
              <Input
                id={`${dialogId}-new-option`}
                name="optionName"
                maxLength={50}
                placeholder={isOptionLimitReached ? 'This property is full' : 'New option'}
                disabled={isOptionLimitReached || isAddingOption}
              />
              <Button
                type="submit"
                variant="secondary"
                disabled={isOptionLimitReached || isAddingOption}
                className="h-10"
              >
                <Plus />
                {isAddingOption ? 'Adding…' : 'Add option'}
              </Button>
            </form>
            <OptionColorMenu
              menuId={colorMenuId}
              chosenColor={colorTargetOption?.color ?? null}
              onChooseColor={(color) => {
                if (colorTargetOption !== undefined)
                  onChooseOptionColor(colorTargetOption.id, color);
              }}
            />
          </section>
        ) : null}
      </div>
      <div className="flex justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">
        <Button popoverTarget={dialogId} popoverTargetAction="hide">
          Done
        </Button>
      </div>
    </div>
  );
};

export default PropertyFormDialog;
