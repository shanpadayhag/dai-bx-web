import {
  ArrowDown,
  ArrowUp,
  Hash,
  ListFilter,
  Pencil,
  Plus,
  Settings2,
  Trash2,
  Type,
  X,
} from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import Badge from '@/core/components/atoms/badge';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import Input from '@/core/components/atoms/input';
import Field from '@/core/components/molecules/field';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import OptionChip from '@/features/board/components/option-chip';
import type Board from '@/features/board/entities/board';
import type BoardProperty from '@/features/board/entities/board-property';
import BoardPropertyKind, {
  boardPropertyKindLabels,
} from '@/features/board/enums/board-property-kind';

export const BOARD_PROPERTIES_MAX = 20;

type BoardSettingsDialogProps = {
  dialogId: string;
  board: Board;
  properties: readonly BoardProperty[];
  newPropertyDialogId: string;
  propertyFormDialogId: string;
  deletePropertyDialogId: string;
  deleteBoardDialogId: string;
  onSubmit: (submitEvent: FormEvent<HTMLFormElement>) => void;
  onStartEditProperty: (propertyId: string) => void;
  onMovePropertyBy: (propertyId: string, positionStep: number) => void;
  onStartDeleteProperty: (propertyId: string) => void;
  columnsSection: ReactNode;
};

const kindIcons = {
  [BoardPropertyKind.Choice]: <ListFilter />,
  [BoardPropertyKind.Text]: <Type />,
  [BoardPropertyKind.Number]: <Hash />,
};

const BoardSettingsDialog = ({
  dialogId,
  board,
  properties,
  newPropertyDialogId,
  propertyFormDialogId,
  deletePropertyDialogId,
  deleteBoardDialogId,
  onSubmit,
  onStartEditProperty,
  onMovePropertyBy,
  onStartDeleteProperty,
  columnsSection,
}: BoardSettingsDialogProps) => {
  const nameInputId = `${dialogId}-name`;
  const isPropertyLimitReached = properties.length >= BOARD_PROPERTIES_MAX;

  return (
    <PopoverPanel id={dialogId} label="Board settings" className="w-[min(560px,calc(100vw-2rem))]">
      <form
        onSubmit={onSubmit}
        className="grid max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]"
      >
        <div className="flex items-start gap-3 p-5 pb-4 sm:px-6 sm:pt-6">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-soft-foreground">
            <Settings2 className="size-5" />
          </span>
          <div className="grid flex-1 gap-1">
            <h2 className="text-base font-semibold text-foreground">Board settings</h2>
            <p className="text-sm text-muted-foreground">
              Properties are this board’s own fields. Every card on it can fill them in.
            </p>
          </div>
          <IconButton
            label="Close board settings"
            popoverTarget={dialogId}
            popoverTargetAction="hide"
          >
            <X />
          </IconButton>
        </div>
        <div className="grid content-start gap-6 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">
          <Field label="Name" htmlFor={nameInputId}>
            <Input
              key={board.name}
              id={nameInputId}
              name="name"
              defaultValue={board.name}
              maxLength={100}
            />
          </Field>
          <section className="grid gap-3" aria-labelledby={`${dialogId}-properties`}>
            <div className="flex items-center justify-between gap-3">
              <h3 id={`${dialogId}-properties`} className="text-[13px] font-medium text-foreground">
                Properties{' '}
                <span className="font-normal text-muted-foreground tabular-nums">
                  {properties.length} of {BOARD_PROPERTIES_MAX}
                </span>
              </h3>
              <Button
                size="sm"
                variant="secondary"
                popoverTarget={newPropertyDialogId}
                disabled={isPropertyLimitReached}
              >
                <Plus />
                Add property
              </Button>
            </div>
            {properties.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border-strong px-4 py-5 text-center text-[13px] text-muted-foreground">
                No properties yet. Add one like Project, with a choice per project.
              </p>
            ) : (
              <ul className="grid divide-y divide-border rounded-xl border border-border">
                {properties.map((property, propertyIndex) => (
                  <li key={property.id} className="grid gap-2 px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground [&_svg]:size-4">
                        {kindIcons[property.kind]}
                      </span>
                      <span className="min-w-0 truncate text-sm font-medium text-foreground">
                        {property.name}
                      </span>
                      <Badge>{boardPropertyKindLabels[property.kind]}</Badge>
                      <span className="ml-auto flex items-center">
                        <IconButton
                          label={`Move ${property.name} up`}
                          disabled={propertyIndex === 0}
                          onClick={() => onMovePropertyBy(property.id, -1)}
                          className="size-7 disabled:opacity-30"
                        >
                          <ArrowUp />
                        </IconButton>
                        <IconButton
                          label={`Move ${property.name} down`}
                          disabled={propertyIndex === properties.length - 1}
                          onClick={() => onMovePropertyBy(property.id, 1)}
                          className="size-7 disabled:opacity-30"
                        >
                          <ArrowDown />
                        </IconButton>
                        <IconButton
                          label={`Edit ${property.name}`}
                          popoverTarget={propertyFormDialogId}
                          onClick={() => onStartEditProperty(property.id)}
                          className="size-7"
                        >
                          <Pencil />
                        </IconButton>
                        <IconButton
                          label={`Delete ${property.name}`}
                          tone="danger"
                          popoverTarget={deletePropertyDialogId}
                          onClick={() => onStartDeleteProperty(property.id)}
                          className="size-7"
                        >
                          <Trash2 />
                        </IconButton>
                      </span>
                    </div>
                    {property.options.length > 0 ? (
                      <div className="flex flex-wrap gap-1 pl-6">
                        {property.options.map((option) => (
                          <OptionChip
                            key={option.id}
                            propertyName={property.name}
                            option={option}
                          />
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
          {columnsSection}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-4 sm:px-6">
          <Button
            variant="ghost"
            popoverTarget={deleteBoardDialogId}
            className="-ml-2 text-danger hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 />
            Delete board
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" popoverTarget={dialogId} popoverTargetAction="hide">
              Cancel
            </Button>
            <Button type="submit">Save name</Button>
          </div>
        </div>
      </form>
    </PopoverPanel>
  );
};

export default BoardSettingsDialog;
