import { Square } from 'lucide-react';
import type RunningItem from '@/features/tracking/entities/running-item';
import { formatElapsed } from '@/features/tracking/entities/running-item';

type RunningPillProps = {
  runningItems: readonly RunningItem[];
  now: Date;
};

const RunningPill = ({ runningItems, now }: RunningPillProps) => {
  const [newestItem] = runningItems;
  if (newestItem === undefined) return null;
  const otherItemCount = runningItems.length - 1;

  return (
    <div className="flex h-9 items-center gap-1 rounded-[10px] border border-primary/25 bg-primary-soft pr-1 text-primary-soft-foreground">
      <button
        type="button"
        popoverTarget="running-list"
        aria-label={`${runningItems.length} running: show all`}
        className="flex h-full min-w-0 items-center gap-2 rounded-l-[10px] pr-1 pl-3 transition-colors duration-150 hover:bg-primary/8 focus-visible:outline-2 focus-visible:outline-primary"
      >
        <span className="relative flex size-2 shrink-0">
          <span className="absolute inset-0 animate-pulse-dot rounded-full bg-primary" />
        </span>
        <span className="hidden max-w-[180px] truncate text-[13px] font-medium md:inline">
          {newestItem.title}
        </span>
        <span className="font-mono text-[13px] tabular-nums">
          {formatElapsed(newestItem.startedAt, now)}
        </span>
        {otherItemCount > 0 ? (
          <span className="inline-flex h-5 items-center rounded-md bg-primary/12 px-1.5 text-xs font-semibold tabular-nums">
            +{otherItemCount}
          </span>
        ) : null}
      </button>
      <button
        type="button"
        popoverTarget="finish-task-dialog"
        aria-label={`Finish ${newestItem.title}`}
        className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary-hover"
      >
        <Square className="size-3 fill-current" />
        Finish
      </button>
    </div>
  );
};

export default RunningPill;
