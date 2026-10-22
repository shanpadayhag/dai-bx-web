import { Square } from 'lucide-react';
import TaskSession from '@/features/tracking/entities/task-session';

type RunningTaskPillProps = {
  taskSession: TaskSession;
};

const RunningTaskPill = ({ taskSession }: RunningTaskPillProps) => (
  <div className="flex h-9 items-center gap-2 rounded-[10px] border border-primary/25 bg-primary-soft pr-1 pl-3 text-primary-soft-foreground">
    <span className="relative flex size-2">
      <span className="absolute inset-0 animate-pulse-dot rounded-full bg-primary" />
    </span>
    <span className="hidden max-w-[180px] truncate text-[13px] font-medium md:inline">
      {taskSession.taskName}
    </span>
    <span className="font-mono text-[13px] tabular-nums">{taskSession.elapsed}</span>
    <button
      type="button"
      popoverTarget="finish-task-dialog"
      className="inline-flex h-7 items-center gap-1.5 rounded-lg bg-primary px-2.5 text-xs font-medium text-primary-foreground transition-colors duration-150 hover:bg-primary-hover"
    >
      <Square className="size-3 fill-current" />
      Finish
    </button>
  </div>
);

export default RunningTaskPill;
