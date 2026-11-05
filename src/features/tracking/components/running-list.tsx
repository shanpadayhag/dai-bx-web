import { KanbanSquare, ListChecks, Square } from 'lucide-react';
import type RunningItem from '@/features/tracking/entities/running-item';
import { formatElapsed } from '@/features/tracking/entities/running-item';

type RunningListProps = {
  runningListId: string;
  runningItems: readonly RunningItem[];
  now: Date;
  onFinish: (eventId: string) => void;
};

const RunningList = ({ runningListId, runningItems, now, onFinish }: RunningListProps) => (
  <div
    id={runningListId}
    popover="auto"
    role="dialog"
    aria-label="Running now"
    className="m-auto w-[min(360px,calc(100vw-2rem))] rounded-xl border border-border bg-background p-1.5 text-foreground shadow-lift backdrop:bg-transparent supports-[position-area:bottom]:m-0 supports-[position-area:bottom]:mt-1.5 supports-[position-area:bottom]:[position-area:bottom_span-left] supports-[position-area:bottom]:[position-try-fallbacks:flip-block]"
  >
    <p className="px-2.5 pt-1.5 pb-2 text-xs font-medium text-muted-foreground">
      Running now · {runningItems.length}
    </p>
    <ul className="grid gap-0.5">
      {runningItems.map((runningItem) => (
        <li
          key={runningItem.id}
          className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3 rounded-lg px-2.5 py-2 hover:bg-surface"
        >
          <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary-soft-foreground [&_svg]:size-3.5">
            {runningItem.sourceKind === 'card' ? <KanbanSquare /> : <ListChecks />}
          </span>
          <span className="grid min-w-0 gap-0.5">
            <span className="truncate text-sm font-medium">{runningItem.title}</span>
            <span className="truncate text-xs text-muted-foreground">
              {runningItem.sourceKind === 'card' ? 'Card' : 'Task'} · {runningItem.sourceName} ·{' '}
              <span className="font-mono tabular-nums">
                {formatElapsed(runningItem.startedAt, now)}
              </span>
            </span>
          </span>
          <button
            type="button"
            onClick={() => onFinish(runningItem.id)}
            aria-label={`Finish ${runningItem.title}`}
            className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border-strong bg-background px-2.5 text-xs font-medium text-foreground shadow-soft transition-colors duration-150 hover:border-primary/40 hover:bg-surface"
          >
            <Square className="size-3 fill-current" />
            Finish
          </button>
        </li>
      ))}
    </ul>
  </div>
);

export default RunningList;
