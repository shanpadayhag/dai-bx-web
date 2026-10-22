import { CalendarClock, CheckSquare, MessageSquareText, Repeat2 } from 'lucide-react';
import Badge from '@/core/components/atoms/badge';
import CategoryChip from '@/core/components/atoms/category-chip';
import joinClassNames from '@/core/class-names';
import BoardCard from '@/features/board/entities/board-card';

type BoardCardTileProps = {
  card: BoardCard;
};

const BoardCardTile = ({ card }: BoardCardTileProps) => {
  const hasChecklist = card.checklistItemCount !== null && card.checklistDoneCount !== null;
  const isChecklistComplete = hasChecklist && card.checklistDoneCount === card.checklistItemCount;

  return (
    <button
      type="button"
      popoverTarget="card-detail-dialog"
      className="grid w-full gap-2.5 rounded-xl border border-border bg-background p-3 text-left shadow-soft transition-[border-color,box-shadow,transform] duration-150 hover:-translate-y-px hover:border-border-strong hover:shadow-lift"
    >
      <span className="flex flex-wrap gap-1">
        <CategoryChip category={card.category} />
        {card.labels.map((label) => (
          <Badge key={label} tone="warning">
            {label}
          </Badge>
        ))}
      </span>
      <span className="text-sm leading-snug font-medium text-foreground">{card.title}</span>
      <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground [&_svg]:size-3.5">
        {card.recurrenceLabel ? (
          <span className="inline-flex items-center gap-1 text-primary">
            <Repeat2 />
            {card.recurrenceLabel}
          </span>
        ) : null}
        {hasChecklist ? (
          <span
            className={joinClassNames(
              'inline-flex items-center gap-1 tabular-nums',
              isChecklistComplete && 'text-success',
            )}
          >
            <CheckSquare />
            {card.checklistDoneCount}/{card.checklistItemCount}
          </span>
        ) : null}
        {card.dueLabel ? (
          <span className="inline-flex items-center gap-1">
            <CalendarClock />
            {card.dueLabel}
          </span>
        ) : null}
        {card.noteCount > 0 ? (
          <span className="inline-flex items-center gap-1 tabular-nums">
            <MessageSquareText />
            {card.noteCount}
          </span>
        ) : null}
      </span>
    </button>
  );
};

export default BoardCardTile;
