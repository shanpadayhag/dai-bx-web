import { Square, Timer } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import TaskSession from '@/features/tracking/entities/task-session';

type RunningTaskCardProps = {
  taskSession: TaskSession;
};

const RunningTaskCard = ({ taskSession }: RunningTaskCardProps) => (
  <section
    aria-label="Running task"
    className="relative isolate grid gap-6 overflow-hidden rounded-2xl bg-ink p-6 text-ink-foreground shadow-lift"
  >
    <div
      aria-hidden="true"
      className="absolute -right-24 -bottom-32 -z-10 size-[420px] rounded-full bg-[radial-gradient(circle_farthest-side,var(--glow),transparent)] opacity-60 blur-3xl"
    />
    <div className="flex flex-wrap items-center gap-2">
      <span className="inline-flex h-5.5 items-center gap-1.5 rounded-md bg-white/10 px-2 text-xs font-medium text-ink-foreground">
        <span className="size-1.5 rounded-full bg-glow" />
        Tracking
      </span>
      <span className="text-[13px] text-ink-muted">{taskSession.groupName}</span>
    </div>
    <div className="grid gap-2">
      <h2 className="text-xl font-semibold tracking-[-0.01em]">{taskSession.taskName}</h2>
      <p className="font-mono text-5xl font-medium tracking-[-0.03em] tabular-nums sm:text-6xl">
        {taskSession.elapsed}
      </p>
      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
        <span>
          Started{' '}
          <span className="font-mono text-ink-foreground tabular-nums">
            {taskSession.startedAt}
          </span>
        </span>
        <span className="inline-flex items-center gap-1">
          <Timer className="size-3.5" />
          Estimate {taskSession.estimate}
        </span>
        <span>
          Last check-in{' '}
          <span className="font-mono text-ink-foreground tabular-nums">
            {taskSession.lastCheckInAt}
          </span>
        </span>
      </p>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button variant="inverse" popoverTarget="finish-task-dialog">
        <Square className="fill-current" />
        Finish task
      </Button>
      <Button
        variant="ghost"
        className="text-ink-muted hover:bg-white/10 hover:text-ink-foreground"
      >
        Open in calendar
      </Button>
    </div>
  </section>
);

export default RunningTaskCard;
