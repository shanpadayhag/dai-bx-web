import { CalendarClock, Check, MoveRight, Pencil, Trash2, X } from 'lucide-react';
import joinClassNames from '@/core/class-names';
import Link from 'next/link';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import Input from '@/core/components/atoms/input';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import CardNotes from '@/features/board/components/card-notes';
import CardPropertyField from '@/features/board/components/card-property-field';
import type Board from '@/features/board/entities/board';
import type BoardProperty from '@/features/board/entities/board-property';
import type CardDetail from '@/features/board/entities/card-detail';
import { isCardDueOverdue } from '@/features/board/entities/card-due';

type CardDetailDialogProps = {
  dialogId: string;
  board: Board;
  properties: readonly BoardProperty[];
  cardDetail: CardDetail;
  moveCardDialogId: string;
  deleteCardDialogId: string;
  now: Date;
};

const CardDetailDialog = ({
  dialogId,
  board,
  properties,
  cardDetail,
  moveCardDialogId,
  deleteCardDialogId,
  now,
}: CardDetailDialogProps) => {
  const { card, listName, notes, linkedTasks } = cardDetail;
  const valuesByPropertyId = new Map(card.values.map((value) => [value.propertyId, value]));
  const doneLinkedTaskCount = linkedTasks.filter((linkedTask) => linkedTask.isDone).length;
  const donePercentage =
    linkedTasks.length === 0 ? 0 : Math.round((doneLinkedTaskCount / linkedTasks.length) * 100);
  const isOverdue =
    card.dueDate !== null &&
    isCardDueOverdue({ dueDate: card.dueDate, dueTime: card.dueTime }, now);

  return (
    <PopoverPanel id={dialogId} label="Card details" className="w-[min(640px,calc(100vw-2rem))]">
      <div className="grid max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)_auto]">
        <div className="flex items-start gap-3 p-5 pb-4 sm:px-6 sm:pt-6">
          <div className="grid min-w-0 flex-1 gap-1.5">
            <p className="truncate text-xs text-muted-foreground">
              {board.name} · <span className="text-foreground">{listName}</span>
            </p>
            <label htmlFor="card-title" className="sr-only">
              Card title
            </label>
            <textarea
              id="card-title"
              rows={1}
              maxLength={500}
              defaultValue={card.title}
              className="-mx-1.5 field-sizing-content resize-none rounded-lg px-1.5 py-0.5 text-xl font-semibold tracking-[-0.01em] text-balance text-foreground transition-colors duration-150 hover:bg-surface focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none"
            />
          </div>
          <IconButton label="Close card" popoverTarget={dialogId} popoverTargetAction="hide">
            <X />
          </IconButton>
        </div>
        <div className="grid content-start gap-6 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">
          <section className="grid gap-3 sm:gap-2" aria-label="Properties">
            {properties.map((property) => (
              <CardPropertyField
                key={property.id}
                property={property}
                value={valuesByPropertyId.get(property.id)}
              />
            ))}
            <div className="grid gap-1.5 sm:grid-cols-[minmax(0,7rem)_minmax(0,1fr)] sm:items-center sm:gap-3">
              <label
                htmlFor="card-due-date"
                className="flex items-center gap-1.5 text-[13px] text-muted-foreground"
              >
                <CalendarClock className="size-3.5" />
                Due
              </label>
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                <Input
                  id="card-due-date"
                  type="date"
                  defaultValue={card.dueDate ?? ''}
                  aria-invalid={isOverdue}
                  className="h-9 min-w-32 flex-1 tabular-nums aria-invalid:border-danger aria-invalid:text-danger"
                />
                <label htmlFor="card-due-time" className="sr-only">
                  Due time, optional
                </label>
                <Input
                  id="card-due-time"
                  type="time"
                  defaultValue={card.dueTime ?? ''}
                  isFullWidth={false}
                  className="h-9 w-30 tabular-nums sm:w-34"
                />
                <IconButton label="Clear due date" className="size-9">
                  <X />
                </IconButton>
              </div>
            </div>
            {isOverdue ? (
              <p className="text-xs font-medium text-danger sm:pl-[calc(7rem+0.75rem)]">Overdue</p>
            ) : null}
          </section>
          <section className="grid gap-2" aria-labelledby="card-notes-heading">
            <div className="flex items-center justify-between">
              <h3 id="card-notes-heading" className="text-[13px] font-semibold text-foreground">
                Notes
              </h3>
              <Button variant="ghost" size="sm">
                <Pencil />
                Edit
              </Button>
            </div>
            <div className="rounded-xl bg-surface px-4 py-3.5">
              <CardNotes notes={notes} />
            </div>
          </section>
          <section className="grid gap-3" aria-labelledby="card-tasks-heading">
            <div className="flex items-center justify-between">
              <h3 id="card-tasks-heading" className="text-[13px] font-semibold text-foreground">
                Tasks
              </h3>
              <span className="text-xs text-muted-foreground tabular-nums">
                {doneLinkedTaskCount} of {linkedTasks.length} done
              </span>
            </div>
            {linkedTasks.length === 0 ? (
              <p className="text-[13px] text-muted-foreground">
                No tasks yet. Tasks made from this card in the daily plan show up here.
              </p>
            ) : (
              <>
                <div
                  role="progressbar"
                  aria-label="Tasks done"
                  aria-valuenow={donePercentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="h-1.5 overflow-hidden rounded-full bg-surface-strong"
                >
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${donePercentage}%` }}
                  />
                </div>
                <ul className="grid gap-0.5">
                  {linkedTasks.map((linkedTask) => (
                    <li key={linkedTask.id}>
                      <Link
                        href={`/tasks?group=${linkedTask.groupId}`}
                        className="flex items-center gap-3 rounded-lg px-1.5 py-1.5 transition-colors duration-150 hover:bg-surface"
                      >
                        <span
                          aria-hidden="true"
                          className={joinClassNames(
                            'inline-flex size-4 shrink-0 items-center justify-center rounded-full border-[1.5px]',
                            linkedTask.isDone
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border-strong text-transparent',
                          )}
                        >
                          <Check className="size-3" strokeWidth={3} />
                        </span>
                        <span className="sr-only">{linkedTask.isDone ? 'Done: ' : 'Open: '}</span>
                        <span
                          className={
                            linkedTask.isDone
                              ? 'min-w-0 flex-1 truncate text-sm text-muted-foreground line-through'
                              : 'min-w-0 flex-1 truncate text-sm text-foreground'
                          }
                        >
                          {linkedTask.name}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {linkedTask.groupName}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-4 sm:px-6">
          <Button
            variant="ghost"
            size="sm"
            popoverTarget={deleteCardDialogId}
            className="-ml-2 text-danger hover:bg-danger-soft hover:text-danger"
          >
            <Trash2 />
            Delete card
          </Button>
          <Button variant="secondary" size="sm" popoverTarget={moveCardDialogId}>
            <MoveRight />
            Move to…
          </Button>
        </div>
      </div>
    </PopoverPanel>
  );
};

export default CardDetailDialog;
