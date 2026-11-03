import { Plus, SlidersHorizontal, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import SegmentedControl from '@/core/components/molecules/segmented-control';
import readFormText from '@/core/form-text';
import type {
  NewPropertyEntry,
  PropertyOptionDraft,
} from '@/features/board/actions/create-board-property';
import OptionColorButton from '@/features/board/components/option-color-button';
import OptionColorMenu from '@/features/board/components/option-color-menu';
import { PROPERTY_OPTIONS_MAX } from '@/features/board/components/property-form-dialog';
import BoardPropertyKind, {
  boardPropertyKindLabels,
} from '@/features/board/enums/board-property-kind';

type NewPropertyDialogProps = {
  dialogId: string;
  isSubmitting: boolean;
  onSubmit: (newPropertyEntry: NewPropertyEntry) => Promise<boolean>;
};

type KeyedOptionDraft = PropertyOptionDraft & { draftKey: number };

const kindLabels = Object.values(boardPropertyKindLabels);

const kindDescriptions: Record<BoardPropertyKind, string> = {
  [BoardPropertyKind.Choice]: 'Cards pick one option, shown as a colored chip on the card.',
  [BoardPropertyKind.Text]: 'Cards hold a short text, shown when you open the card.',
  [BoardPropertyKind.Number]: 'Cards hold a number, like hours or points.',
};

const findKindByLabel = (kindLabel: string) =>
  Object.values(BoardPropertyKind).find((kind) => boardPropertyKindLabels[kind] === kindLabel) ??
  BoardPropertyKind.Choice;

const NewPropertyDialog = ({ dialogId, isSubmitting, onSubmit }: NewPropertyDialogProps) => {
  const [kind, setKind] = useState<BoardPropertyKind>(BoardPropertyKind.Choice);
  const [optionDrafts, setOptionDrafts] = useState<KeyedOptionDraft[]>([
    { draftKey: 0, name: '', color: null },
  ]);
  const [colorTargetDraftKey, setColorTargetDraftKey] = useState<number | null>(null);
  const lastDraftKeyRef = useRef(0);
  const nameInputId = `${dialogId}-name`;
  const colorMenuId = `${dialogId}-color-menu`;
  const colorTargetDraft = optionDrafts.find((draft) => draft.draftKey === colorTargetDraftKey);

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

  const changeDraft = (draftKey: number, draftChanges: Partial<PropertyOptionDraft>) =>
    setOptionDrafts((currentDrafts) =>
      currentDrafts.map((draft) =>
        draft.draftKey === draftKey ? { ...draft, ...draftChanges } : draft,
      ),
    );

  const addDraft = () => {
    lastDraftKeyRef.current += 1;
    const draftKey = lastDraftKeyRef.current;
    setOptionDrafts((currentDrafts) => [...currentDrafts, { draftKey, name: '', color: null }]);
  };

  const submitNewProperty = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    const newPropertyForm = submitEvent.currentTarget;
    const isCreated = await onSubmit({
      propertyName: readFormText(new FormData(newPropertyForm), 'propertyName'),
      kind,
      optionDrafts,
    });
    if (!isCreated) return;
    newPropertyForm.reset();
    setKind(BoardPropertyKind.Choice);
    lastDraftKeyRef.current += 1;
    setOptionDrafts([{ draftKey: lastDraftKeyRef.current, name: '', color: null }]);
  };

  return (
    <PopoverPanel id={dialogId} label="New property" className="w-[min(480px,calc(100vw-2rem))]">
      <form
        onSubmit={(submitEvent) => void submitNewProperty(submitEvent)}
        className="grid max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]"
      >
        <div className="flex items-start gap-3 p-5 pb-4 sm:px-6 sm:pt-6">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
            <SlidersHorizontal className="size-5" />
          </span>
          <div className="grid gap-1">
            <h2 className="text-base font-semibold text-foreground">New property</h2>
            <p className="text-sm text-muted-foreground">
              A field every card on this board can fill in.
            </p>
          </div>
        </div>
        <div className="grid content-start gap-5 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">
          <Field label="Name" htmlFor={nameInputId}>
            <Input
              id={nameInputId}
              name="propertyName"
              maxLength={50}
              placeholder="Like Project or Size"
            />
          </Field>
          <div className="grid gap-1.5">
            <p className="text-[13px] font-medium text-foreground">Type</p>
            <SegmentedControl
              label="Type"
              options={kindLabels}
              selectedOption={boardPropertyKindLabels[kind]}
              onSelectOption={(kindLabel) => setKind(findKindByLabel(kindLabel))}
            />
            <p className="text-xs text-muted-foreground">
              {kindDescriptions[kind]} It can’t change later.
            </p>
          </div>
          {kind === BoardPropertyKind.Choice ? (
            <section className="grid gap-2" aria-labelledby={`${dialogId}-options`}>
              <h3
                id={`${dialogId}-options`}
                className="flex items-center justify-between text-[13px] font-medium text-foreground"
              >
                Options
                <span className="font-normal text-muted-foreground tabular-nums">
                  {optionDrafts.length} of {PROPERTY_OPTIONS_MAX}
                </span>
              </h3>
              <ul className="grid gap-1.5">
                {optionDrafts.map((draft, draftIndex) => (
                  <li key={draft.draftKey} className="flex items-center gap-1.5">
                    <OptionColorButton
                      colorMenuId={colorMenuId}
                      optionName={draft.name}
                      color={draft.color}
                      onOpenMenu={() => setColorTargetDraftKey(draft.draftKey)}
                    />
                    <Input
                      aria-label={`Option ${draftIndex + 1} name`}
                      value={draft.name}
                      maxLength={50}
                      placeholder="Like DaiBX or Small"
                      onChange={(changeEvent) =>
                        changeDraft(draft.draftKey, { name: changeEvent.currentTarget.value })
                      }
                    />
                    <IconButton
                      label={`Remove option ${draftIndex + 1}`}
                      tone="danger"
                      disabled={optionDrafts.length === 1}
                      onClick={() =>
                        setOptionDrafts((currentDrafts) =>
                          currentDrafts.filter(
                            (currentDraft) => currentDraft.draftKey !== draft.draftKey,
                          ),
                        )
                      }
                      className="size-10 disabled:opacity-30"
                    >
                      <Trash2 />
                    </IconButton>
                  </li>
                ))}
              </ul>
              <Button
                variant="ghost"
                size="sm"
                className="justify-self-start"
                disabled={optionDrafts.length >= PROPERTY_OPTIONS_MAX}
                onClick={addDraft}
              >
                <Plus />
                Add option
              </Button>
              <OptionColorMenu
                menuId={colorMenuId}
                chosenColor={colorTargetDraft?.color ?? null}
                onChooseColor={(color) => {
                  if (colorTargetDraft !== undefined)
                    changeDraft(colorTargetDraft.draftKey, { color });
                }}
              />
            </section>
          ) : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-4 sm:px-6">
          <Button variant="ghost" popoverTarget={dialogId} popoverTargetAction="hide">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Creating…' : 'Create property'}
          </Button>
        </div>
      </form>
    </PopoverPanel>
  );
};

export default NewPropertyDialog;
