import { AlarmClock, CalendarClock, ListChecks } from 'lucide-react';
import { useState } from 'react';
import joinClassNames from '@/core/class-names';
import {
  DRAGGED_CARD_DATA_TYPE,
  isDragCarrying,
  isLeavingElement,
} from '@/features/board/components/board-drag';
import OptionChip from '@/features/board/components/option-chip';
import type BoardCard from '@/features/board/entities/board-card';
import type BoardProperty from '@/features/board/entities/board-property';
import { formatCardDue, isCardDueOverdue } from '@/features/board/entities/card-due';
import {
  formatScheduleMoment,
  type ScheduledCardMove,
} from '@/features/board/entities/card-schedule';
import { findChosenOptions } from '@/features/board/entities/chosen-options';

type BoardCardTileProps = {
  card: BoardCard;
  properties: readonly BoardProperty[];
  isPending: boolean;
  now: Date;
  nextMove: ScheduledCardMove | null;
  onOpenCard: (cardId: string) => void;
  onDropCard: (draggedCardId: string) => void;
};

const BoardCardTile = ({
  card,
  properties,
  isPending,
  now,
  nextMove,
  onOpenCard,
  onDropCard,
}: BoardCardTileProps) => {
  const [isDropTarget, setIsDropTarget] = useState(false);
  const chosenOptions = findChosenOptions(properties, card.values);
  const cardDue = card.dueDate === null ? null : { dueDate: card.dueDate, dueTime: card.dueTime };
  const isOverdue = cardDue !== null && isCardDueOverdue(cardDue, now);
  const hasLinkedTasks = card.linkedTaskCount > 0;
  const areLinkedTasksDone = hasLinkedTasks && card.doneLinkedTaskCount === card.linkedTaskCount;

  return (
    <button
      type="button"
      draggable={!isPending}
      aria-disabled={isPending}
      onClick={() => onOpenCard(card.id)}
      onDragStart={(dragEvent) => {
        dragEvent.dataTransfer.setData(DRAGGED_CARD_DATA_TYPE, card.id);
        dragEvent.dataTransfer.effectAllowed = 'move';
      }}
      onDragOver={(dragEvent) => {
        if (!isDragCarrying(dragEvent, DRAGGED_CARD_DATA_TYPE)) return;
        dragEvent.preventDefault();
        dragEvent.stopPropagation();
        dragEvent.dataTransfer.dropEffect = 'move';
        setIsDropTarget(true);
      }}
      onDragLeave={(dragEvent) => {
        if (isLeavingElement(dragEvent)) setIsDropTarget(false);
      }}
      onDrop={(dropEvent) => {
        const draggedCardId = dropEvent.dataTransfer.getData(DRAGGED_CARD_DATA_TYPE);
        if (draggedCardId === '') return;
        dropEvent.preventDefault();
        dropEvent.stopPropagation();
        setIsDropTarget(false);
        onDropCard(draggedCardId);
      }}
      className={joinClassNames(
        'group/tile relative grid w-full cursor-pointer gap-2 rounded-xl border border-border bg-background p-3 text-left shadow-soft transition-[border-color,box-shadow,opacity] duration-150 hover:border-border-strong hover:shadow-lift focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none active:cursor-grabbing',
        isPending && 'cursor-default opacity-60',
        isDropTarget &&
          'before:absolute before:inset-x-1 before:-top-[5px] before:h-0.5 before:rounded-full before:bg-primary',
      )}
    >
      {chosenOptions.length > 0 ? (
        <span className="flex flex-wrap gap-1">
          {chosenOptions.map((chosenOption) => (
            <OptionChip
              key={chosenOption.option.id}
              propertyName={chosenOption.propertyName}
              option={chosenOption.option}
            />
          ))}
        </span>
      ) : null}
      <span className="text-sm leading-snug font-medium text-pretty text-foreground">
        {card.title}
      </span>
      {cardDue !== null || hasLinkedTasks || nextMove !== null ? (
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground [&_svg]:size-3.5">
          {cardDue !== null ? (
            <span
              className={joinClassNames(
                'inline-flex items-center gap-1 tabular-nums',
                isOverdue && 'rounded-md bg-danger-soft px-1.5 py-0.5 font-medium text-danger',
              )}
            >
              <CalendarClock />
              {isOverdue ? <span className="sr-only">Overdue: </span> : null}
              {formatCardDue(cardDue, now)}
            </span>
          ) : null}
          {hasLinkedTasks ? (
            <span
              className={joinClassNames(
                'inline-flex items-center gap-1 tabular-nums',
                areLinkedTasksDone && 'text-success',
              )}
            >
              <ListChecks />
              <span className="sr-only">Tasks done: </span>
              {card.doneLinkedTaskCount}/{card.linkedTaskCount}
            </span>
          ) : null}
          {nextMove === null ? null : (
            <span className="inline-flex items-center gap-1 tabular-nums">
              <AlarmClock aria-hidden="true" />
              <span className="sr-only">
                Moves to {nextMove.targetListName} {formatScheduleMoment(nextMove.at, now)}
              </span>
              <span
                aria-hidden="true"
                className="hidden group-hover/tile:inline group-focus-visible/tile:inline [@media(hover:none)]:inline"
              >
                {formatScheduleMoment(nextMove.at, now)} → {nextMove.targetListName}
              </span>
            </span>
          )}
        </span>
      ) : null}
    </button>
  );
};

export default BoardCardTile;
