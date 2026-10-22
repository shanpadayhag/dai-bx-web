import { BellRing } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import TaskSession from '@/features/tracking/entities/task-session';

type CheckInCardProps = {
  taskSession: TaskSession;
};

const CheckInCard = ({ taskSession }: CheckInCardProps) => (
  <section
    aria-label="Check-in"
    className="grid gap-3 rounded-2xl border border-border bg-background p-4 shadow-lift"
  >
    <div className="flex items-start gap-3">
      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <BellRing className="size-4" />
      </span>
      <div className="grid gap-0.5">
        <p className="text-sm font-medium text-foreground">Still on “{taskSession.taskName}”?</p>
        <p className="text-[13px] text-muted-foreground">
          It’s past its {taskSession.estimate} estimate. Tap to confirm you’re here; the next
          check-in is in 30 minutes.
        </p>
      </div>
    </div>
    <div className="flex flex-wrap justify-end gap-2">
      <Button variant="secondary" size="sm" popoverTarget="finish-task-dialog">
        I stepped away
      </Button>
      <Button size="sm">Still on it</Button>
    </div>
  </section>
);

export default CheckInCard;
