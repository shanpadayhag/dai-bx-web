import {
  Archive,
  ArchiveRestore,
  ArrowRight,
  CalendarClock,
  ChevronRight,
  CircleCheck,
  Hand,
  Play,
} from 'lucide-react';
import type { ReactNode } from 'react';
import Button from '@/core/components/atoms/button';
import { formatClock, formatScheduleDay } from '@/features/board/entities/card-schedule';
import type CardHistoryPage from '@/features/board/entities/card-history-page';
import type CardMove from '@/features/board/entities/card-move';
import { describeCardMoveReason, type CardMoveReason } from '@/features/board/entities/card-move';

const reasonIcons: Record<CardMoveReason, ReactNode> = {
  byHand: <Hand />,
  schedule: <CalendarClock />,
  started: <Play />,
  finished: <CircleCheck />,
  archivedIdle: <Archive />,
  archivedByHand: <Archive />,
  restored: <ArchiveRestore />,
};

type CardHistorySectionProps = {
  historyPage: CardHistoryPage | null;
  calendarTimeZone: string;
  onLoadHistory: (olderThanMoveId: string | null) => void;
};

const MoveColumns = ({ cardMove }: { cardMove: CardMove }) => {
  if (cardMove.toListName === null) {
    return <span className="truncate">Left {cardMove.fromListName ?? 'a deleted column'}</span>;
  }
  if (cardMove.fromListName === null) {
    return <span className="truncate">Back in {cardMove.toListName}</span>;
  }
  return (
    <span className="flex min-w-0 items-center gap-1">
      <span className="truncate">{cardMove.fromListName}</span>
      <ArrowRight aria-label="to" className="size-3 shrink-0 text-muted-foreground" />
      <span className="truncate">{cardMove.toListName}</span>
    </span>
  );
};

const CardHistorySection = ({
  historyPage,
  calendarTimeZone,
  onLoadHistory,
}: CardHistorySectionProps) => {
  const moves = historyPage?.moves ?? [];
  const oldestMove = moves.at(-1);
  return (
    <details
      className="group/history"
      onToggle={(toggleEvent) => {
        if (toggleEvent.currentTarget.open && historyPage === null) onLoadHistory(null);
      }}
    >
      <summary className="flex w-fit cursor-pointer list-none items-center gap-1 rounded-md text-[13px] font-semibold text-foreground focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
        <ChevronRight
          aria-hidden="true"
          className="size-4 text-muted-foreground transition-transform duration-150 group-open/history:rotate-90"
        />
        History
      </summary>
      {moves.length === 0 ? (
        <p role="status" className="mt-2 text-[13px] text-muted-foreground">
          {historyPage === null || historyPage.isLoading
            ? 'Loading history…'
            : 'No moves yet. Every move from now on shows here, with why it happened.'}
        </p>
      ) : (
        <ol className="mt-3 grid">
          {moves.map((cardMove) => (
            <li
              key={cardMove.id}
              className="relative grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 pb-3 last:pb-0 [&:not(:last-child)]:before:absolute [&:not(:last-child)]:before:top-7 [&:not(:last-child)]:before:bottom-1 [&:not(:last-child)]:before:left-3 [&:not(:last-child)]:before:w-px [&:not(:last-child)]:before:bg-border"
            >
              <span
                aria-hidden="true"
                className="inline-flex size-6 items-center justify-center rounded-full bg-surface-strong text-muted-foreground [&_svg]:size-3"
              >
                {reasonIcons[cardMove.reason]}
              </span>
              <div className="grid min-w-0 gap-0.5 pt-0.5">
                <p className="flex min-w-0 items-center text-sm text-foreground">
                  <MoveColumns cardMove={cardMove} />
                </p>
                <p className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                  <span className="min-w-0 truncate">{describeCardMoveReason(cardMove)}</span>
                  <time dateTime={cardMove.movedAt.toISOString()} className="tabular-nums">
                    {formatScheduleDay(cardMove.movedAt, calendarTimeZone)},{' '}
                    {formatClock(cardMove.movedAt, calendarTimeZone)}
                  </time>
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
      {historyPage?.hasOlderMoves === true && oldestMove !== undefined ? (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 -ml-2"
          disabled={historyPage.isLoading}
          onClick={() => onLoadHistory(oldestMove.id)}
        >
          Show older moves
        </Button>
      ) : null}
    </details>
  );
};

export default CardHistorySection;
