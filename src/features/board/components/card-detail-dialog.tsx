import {
  Archive,
  ArchiveRestore,
  CalendarClock,
  Check,
  MoveRight,
  Pencil,
  Play,
  Trash2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useRef, useState, type ReactNode } from 'react';
import joinClassNames from '@/core/class-names';
import Button from '@/core/components/atoms/button';
import IconButton from '@/core/components/atoms/icon-button';
import Input from '@/core/components/atoms/input';
import PopoverPanel from '@/core/components/molecules/popover-panel';
import RenameEventsDialog from '@/core/components/organisms/rename-events-dialog';
import type { RenameEventsAnswer, RenameEventsRequest } from '@/core/rename-events';
import CardNotes from '@/features/board/components/card-notes';
import CardPropertyField from '@/features/board/components/card-property-field';
import { CARD_NOTES_MAX_CHARACTERS } from '@/features/board/actions/update-card-notes';
import type Board from '@/features/board/entities/board';
import type BoardProperty from '@/features/board/entities/board-property';
import type CardArchive from '@/features/board/entities/card-archive';
import { describeCardArchive } from '@/features/board/entities/card-archive';
import type CardDetail from '@/features/board/entities/card-detail';
import { isCardDueOverdue } from '@/features/board/entities/card-due';

type CardDetailDialogProps = {
  dialogId: string;
  board: Board;
  properties: readonly BoardProperty[];
  cardDetail: CardDetail | null;
  areDetailsLoading: boolean;
  moveCardDialogId: string;
  deleteCardDialogId: string;
  now: Date;
  onRenameCard: (cardId: string, cardTitle: string) => void;
  onEnterValue: (cardId: string, propertyId: string, enteredValue: string) => boolean;
  onChangeDue: (cardId: string, dueDate: string | null, dueTime: string | null) => void;
  onSaveNotes: (cardId: string, notes: string) => Promise<boolean>;
  onOpenMoveCard: () => void;
  isCardRunning: boolean;
  runningListId: string;
  onStartCard: (cardId: string) => void;
  renameEventsDialogId: string;
  renameRequest: RenameEventsRequest | null;
  titleResetCount: number;
  onAnswerRename: (renameAnswer: RenameEventsAnswer) => void;
  scheduleSection: ReactNode;
  workflowSection: ReactNode;
  historySection: ReactNode;
  cardArchive: CardArchive | null;
  calendarTimeZone: string;
  onSetArchived: (cardId: string, isArchived: boolean) => void;
};

const COMPLETE_DATE_PATTERN = /^[1-9]\d{3}-\d{2}-\d{2}$/;

const CardDetailDialog = ({
  cardDetail,
  renameEventsDialogId,
  renameRequest,
  onAnswerRename,
  ...contentProps
}: CardDetailDialogProps) => (
  <PopoverPanel
    id={contentProps.dialogId}
    label="Card details"
    className="w-[min(640px,calc(100vw-2rem))]"
  >
    {cardDetail === null ? null : (
      <CardDetailContent key={cardDetail.card.id} cardDetail={cardDetail} {...contentProps} />
    )}
    <RenameEventsDialog
      id={renameEventsDialogId}
      renameRequest={renameRequest}
      onAnswer={onAnswerRename}
    />
  </PopoverPanel>
);

type CardDetailContentProps = Omit<
  CardDetailDialogProps,
  'cardDetail' | 'renameEventsDialogId' | 'renameRequest' | 'onAnswerRename'
> & {
  cardDetail: CardDetail;
};

const CardDetailContent = ({
  dialogId,
  board,
  properties,
  cardDetail,
  areDetailsLoading,
  moveCardDialogId,
  deleteCardDialogId,
  now,
  onRenameCard,
  onEnterValue,
  onChangeDue,
  onSaveNotes,
  onOpenMoveCard,
  isCardRunning,
  runningListId,
  onStartCard,
  titleResetCount,
  scheduleSection,
  workflowSection,
  historySection,
  cardArchive,
  calendarTimeZone,
  onSetArchived,
}: CardDetailContentProps) => {
  const { card, listName, notes, linkedTasks } = cardDetail;
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const notesInputRef = useRef<HTMLTextAreaElement>(null);
  const valuesByPropertyId = new Map(card.values.map((value) => [value.propertyId, value]));
  const doneLinkedTaskCount = linkedTasks.filter((linkedTask) => linkedTask.isDone).length;
  const donePercentage =
    linkedTasks.length === 0 ? 0 : Math.round((doneLinkedTaskCount / linkedTasks.length) * 100);
  const isOverdue =
    card.dueDate !== null &&
    isCardDueOverdue({ dueDate: card.dueDate, dueTime: card.dueTime }, now);

  const finishEditingNotes = async () => {
    const enteredNotes = notesInputRef.current?.value ?? notes;
    if (enteredNotes === notes) {
      setIsEditingNotes(false);
      return;
    }
    setIsSavingNotes(true);
    const isSaved = await onSaveNotes(card.id, enteredNotes);
    setIsSavingNotes(false);
    if (isSaved) setIsEditingNotes(false);
  };

  return (
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
            key={`${card.id}-${card.title}-${titleResetCount}`}
            id="card-title"
            rows={1}
            maxLength={500}
            defaultValue={card.title}
            onKeyDown={(keyEvent) => {
              if (keyEvent.key === 'Enter') {
                keyEvent.preventDefault();
                keyEvent.currentTarget.blur();
              }
            }}
            onBlur={(blurEvent) => {
              const enteredTitle = blurEvent.currentTarget.value;
              if (enteredTitle.trim() === card.title) return;
              if (enteredTitle.trim() === '') {
                blurEvent.currentTarget.value = card.title;
                return;
              }
              onRenameCard(card.id, enteredTitle);
            }}
            className="-mx-1.5 field-sizing-content resize-none rounded-lg px-1.5 py-0.5 text-xl font-semibold tracking-[-0.01em] text-balance text-foreground transition-colors duration-150 hover:bg-surface focus-visible:bg-background focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none"
          />
        </div>
        {isCardRunning ? (
          <Button
            key="running"
            variant="secondary"
            size="sm"
            popoverTarget={runningListId}
            aria-label={`${card.title} is running: show what’s running`}
            className="mt-0.5 text-primary"
          >
            <span className="size-1.5 animate-pulse-dot rounded-full bg-primary" />
            Running
          </Button>
        ) : (
          <Button
            key="start"
            size="sm"
            aria-label={`Start ${card.title}`}
            className="mt-0.5"
            onClick={() => onStartCard(card.id)}
          >
            <Play className="fill-current" />
            Start
          </Button>
        )}
        <IconButton label="Close card" popoverTarget={dialogId} popoverTargetAction="hide">
          <X />
        </IconButton>
      </div>
      <div className="grid grid-cols-1 content-start gap-6 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6">
        {cardArchive === null ? null : (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-surface-strong px-3.5 py-2.5">
            <p className="flex min-w-0 flex-1 items-center gap-2 text-[13px] text-foreground">
              <Archive aria-hidden="true" className="size-4 shrink-0 text-muted-foreground" />
              {describeCardArchive(cardArchive, calendarTimeZone)}
            </p>
            <Button variant="secondary" size="sm" onClick={() => onSetArchived(card.id, false)}>
              <ArchiveRestore />
              Restore
            </Button>
          </div>
        )}
        <section className="grid gap-3 sm:gap-2" aria-label="Properties">
          {properties.map((property) => (
            <CardPropertyField
              key={property.id}
              property={property}
              value={valuesByPropertyId.get(property.id)}
              onEnterValue={(propertyId, enteredValue) =>
                onEnterValue(card.id, propertyId, enteredValue)
              }
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
                key={`date-${card.dueDate ?? ''}`}
                id="card-due-date"
                type="date"
                defaultValue={card.dueDate ?? ''}
                onChange={(changeEvent) => {
                  const enteredDate = changeEvent.currentTarget.value;
                  if (enteredDate === '') {
                    onChangeDue(card.id, null, null);
                    return;
                  }
                  if (!COMPLETE_DATE_PATTERN.test(enteredDate) || enteredDate === card.dueDate) {
                    return;
                  }
                  onChangeDue(card.id, enteredDate, card.dueTime);
                }}
                aria-invalid={isOverdue}
                className="h-9 min-w-32 flex-1 tabular-nums aria-invalid:border-danger aria-invalid:text-danger"
              />
              <label htmlFor="card-due-time" className="sr-only">
                Due time, optional
              </label>
              <Input
                key={`time-${card.dueTime ?? ''}`}
                id="card-due-time"
                type="time"
                defaultValue={card.dueTime ?? ''}
                disabled={card.dueDate === null}
                title={card.dueDate === null ? 'Pick a date first' : undefined}
                onChange={(changeEvent) => {
                  const enteredTime = changeEvent.currentTarget.value;
                  const dueTime = enteredTime === '' ? null : enteredTime;
                  if (dueTime === card.dueTime) return;
                  onChangeDue(card.id, card.dueDate, dueTime);
                }}
                isFullWidth={false}
                className="h-9 w-30 tabular-nums sm:w-34"
              />
              <IconButton
                label="Clear due date"
                disabled={card.dueDate === null}
                onClick={() => onChangeDue(card.id, null, null)}
                className="size-9 disabled:opacity-30"
              >
                <X />
              </IconButton>
            </div>
          </div>
          {isOverdue ? (
            <p className="text-xs font-medium text-danger sm:pl-[calc(7rem+0.75rem)]">Overdue</p>
          ) : null}
        </section>
        <section className="grid grid-cols-1 gap-2" aria-labelledby="card-notes-heading">
          <div className="flex items-center justify-between">
            <h3 id="card-notes-heading" className="text-[13px] font-semibold text-foreground">
              Notes
            </h3>
            {isEditingNotes ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={isSavingNotes}
                onClick={() => void finishEditingNotes()}
              >
                <Check />
                {isSavingNotes ? 'Saving…' : 'Done'}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                disabled={areDetailsLoading}
                onClick={() => setIsEditingNotes(true)}
              >
                <Pencil />
                Edit
              </Button>
            )}
          </div>
          {isEditingNotes ? (
            <>
              <label htmlFor="card-notes" className="sr-only">
                Notes, in Markdown
              </label>
              <textarea
                ref={notesInputRef}
                id="card-notes"
                autoFocus
                defaultValue={notes}
                maxLength={CARD_NOTES_MAX_CHARACTERS}
                placeholder="Write in Markdown: **bold**, - lists, [links](https://…)"
                className="field-sizing-content max-h-[50dvh] min-h-32 resize-none rounded-xl border border-border-strong bg-background px-4 py-3 font-mono text-[13px] leading-relaxed text-foreground shadow-soft transition-[border-color,box-shadow] duration-150 focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none"
              />
            </>
          ) : (
            <div className="rounded-xl bg-surface px-4 py-3.5">
              {areDetailsLoading ? (
                <p role="status" className="text-[13px] text-muted-foreground">
                  Loading notes…
                </p>
              ) : (
                <CardNotes notes={notes} />
              )}
            </div>
          )}
        </section>
        <section className="grid gap-3" aria-labelledby="card-tasks-heading">
          <div className="flex items-center justify-between">
            <h3 id="card-tasks-heading" className="text-[13px] font-semibold text-foreground">
              Tasks
            </h3>
            {areDetailsLoading ? null : (
              <span className="text-xs text-muted-foreground tabular-nums">
                {doneLinkedTaskCount} of {linkedTasks.length} done
              </span>
            )}
          </div>
          {areDetailsLoading ? (
            <p role="status" className="text-[13px] text-muted-foreground">
              Loading tasks…
            </p>
          ) : linkedTasks.length === 0 ? (
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
        {scheduleSection}
        {workflowSection}
        {historySection}
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
        {cardArchive === null ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => onSetArchived(card.id, true)}>
              <Archive />
              Archive
            </Button>
            <Button
              variant="secondary"
              size="sm"
              popoverTarget={moveCardDialogId}
              onClick={onOpenMoveCard}
            >
              <MoveRight />
              Move to…
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default CardDetailDialog;
