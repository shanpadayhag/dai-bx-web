import { BellRing } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import type RunningItem from '@/features/tracking/entities/running-item';
import { checkInSinceMoment } from '@/features/tracking/entities/running-item';

type CheckInCardProps = {
  dueItems: readonly RunningItem[];
  onAnswerYes: (eventId: string) => void;
  onAnswerNo: (eventId: string) => void;
};

const formatClock = (moment: Date): string =>
  `${String(moment.getHours()).padStart(2, '0')}:${String(moment.getMinutes()).padStart(2, '0')}`;

const CheckInCard = ({ dueItems, onAnswerYes, onAnswerNo }: CheckInCardProps) => {
  if (dueItems.length === 0) return null;

  return (
    <section
      aria-label="Check-in"
      className="fixed inset-x-3 bottom-3 z-40 grid max-h-[60dvh] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-2xl border border-border bg-background shadow-lift sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[380px]"
    >
      <header className="flex items-center gap-2.5 border-b border-border px-4 py-3">
        <span className="inline-flex size-7 items-center justify-center rounded-lg bg-primary-soft text-primary">
          <BellRing className="size-3.5" />
        </span>
        <h2 className="text-sm font-semibold text-foreground">Check-in</h2>
        <span className="ml-auto text-xs text-muted-foreground">
          {dueItems.length === 1 ? 'Answer to keep tracking' : `${dueItems.length} to answer`}
        </span>
      </header>
      <ul className="divide-y divide-border overflow-y-auto">
        {dueItems.map((dueItem) => {
          const sinceLabel = formatClock(checkInSinceMoment(dueItem));
          return (
            <li key={dueItem.id} className="grid gap-2.5 px-4 py-3">
              <p className="text-[13px] text-foreground">
                Were you on <span className="font-medium">“{dueItem.title}”</span> since{' '}
                <span className="font-mono tabular-nums">{sinceLabel}</span>?
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onAnswerNo(dueItem.id)}
                  aria-label={`No, I wasn’t on ${dueItem.title} since ${sinceLabel}`}
                >
                  No
                </Button>
                <Button
                  size="sm"
                  onClick={() => onAnswerYes(dueItem.id)}
                  aria-label={`Yes, I was on ${dueItem.title} since ${sinceLabel}`}
                >
                  Yes
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
};

export default CheckInCard;
