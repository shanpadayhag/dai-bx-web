import { CalendarClock, ListChecks } from 'lucide-react';
import joinClassNames from '@/core/class-names';
import OptionChip from '@/features/board/components/option-chip';
import type BoardCard from '@/features/board/entities/board-card';
import type BoardProperty from '@/features/board/entities/board-property';
import { formatCardDue, isCardDueOverdue } from '@/features/board/entities/card-due';
import { findChosenOptions } from '@/features/board/entities/chosen-options';

type BoardCardTileProps = {
  card: BoardCard;
  properties: readonly BoardProperty[];
  cardDetailDialogId: string;
  now: Date;
};

const BoardCardTile = ({ card, properties, cardDetailDialogId, now }: BoardCardTileProps) => {
  const chosenOptions = findChosenOptions(properties, card.values);
  const cardDue = card.dueDate === null ? null : { dueDate: card.dueDate, dueTime: card.dueTime };
  const isOverdue = cardDue !== null && isCardDueOverdue(cardDue, now);
  const hasLinkedTasks = card.linkedTaskCount > 0;
  const areLinkedTasksDone = hasLinkedTasks && card.doneLinkedTaskCount === card.linkedTaskCount;

  return (
    <button
      type="button"
      popoverTarget={cardDetailDialogId}
      className="relative grid w-full gap-2 rounded-xl border border-border bg-background p-3 text-left shadow-soft transition-[border-color,box-shadow] duration-150 hover:border-border-strong hover:shadow-lift focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none"
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
      {cardDue !== null || hasLinkedTasks ? (
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
        </span>
      ) : null}
    </button>
  );
};

export default BoardCardTile;
