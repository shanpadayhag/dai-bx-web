import { Check, Square, Timer } from 'lucide-react';
import Button from '@/core/components/atoms/button';
import { formatClockInZone } from '@/core/time-zone';
import { calendarPath } from '@/features/calendar/entities/calendar-address';
import { formatEstimate } from '@/features/tasks/entities/estimate';
import { checkInDueAt } from '@/features/tracking/entities/check-in';
import RunningItem, { formatElapsed } from '@/features/tracking/entities/running-item';
import type TimeTrackingSettings from '@/features/tracking/entities/time-tracking-settings';

type RunningNowListProps = {
  runningItems: readonly RunningItem[];
  timeTrackingSettings: TimeTrackingSettings | null;
  now: Date;
  timeZone: string;
  todayDate: string;
  onCheckIn: (eventId: string) => void;
  onFinish: (eventId: string) => void;
};

const nextCheckInText = (
  runningItem: RunningItem,
  timeTrackingSettings: TimeTrackingSettings | null,
  now: Date,
  timeZone: string,
): string | null => {
  if (timeTrackingSettings === null) return null;
  const dueAt = checkInDueAt(runningItem, timeTrackingSettings);
  if (dueAt === null) return null;
  return dueAt <= now ? 'Check-in due' : `Next check-in ${formatClockInZone(dueAt, timeZone)}`;
};

const RunningNowList = ({
  runningItems,
  timeTrackingSettings,
  now,
  timeZone,
  todayDate,
  onCheckIn,
  onFinish,
}: RunningNowListProps) => {
  if (runningItems.length === 0) {
    return (
      <section
        aria-label="Running now"
        className="grid gap-1 rounded-2xl border border-dashed border-border-strong bg-background p-5"
      >
        <h2 className="text-[13px] font-semibold text-foreground">Nothing running</h2>
        <p className="text-[13px] text-muted-foreground">
          Start a task from Up next and its timer shows here.
        </p>
      </section>
    );
  }
  const hasSeveralItems = runningItems.length > 1;
  return (
    <section aria-label="Running now" className="grid gap-3">
      {runningItems.map((runningItem) => {
        const checkInText = nextCheckInText(runningItem, timeTrackingSettings, now, timeZone);
        return (
          <article
            key={runningItem.id}
            aria-label={runningItem.title}
            className="relative isolate grid gap-5 overflow-hidden rounded-2xl bg-ink p-6 text-ink-foreground shadow-lift"
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
              <span className="text-[13px] text-ink-muted">{runningItem.sourceName}</span>
            </div>
            <div className="grid gap-2">
              <h2 className="text-xl font-semibold tracking-[-0.01em]">{runningItem.title}</h2>
              <p
                className={
                  hasSeveralItems
                    ? 'font-mono text-4xl font-medium tracking-[-0.03em] tabular-nums'
                    : 'font-mono text-5xl font-medium tracking-[-0.03em] tabular-nums sm:text-6xl'
                }
              >
                {formatElapsed(runningItem.startedAt, now)}
              </p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
                <span>
                  Started{' '}
                  <span className="font-mono text-ink-foreground tabular-nums">
                    {formatClockInZone(runningItem.startedAt, timeZone)}
                  </span>
                </span>
                {runningItem.estimateMinutes === null ? null : (
                  <span className="inline-flex items-center gap-1">
                    <Timer aria-hidden="true" className="size-3.5" />
                    Estimate {formatEstimate(runningItem.estimateMinutes)}
                  </span>
                )}
                {checkInText === null ? null : <span>{checkInText}</span>}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="inverse" onClick={() => onFinish(runningItem.id)}>
                <Square className="fill-current" />
                Finish
              </Button>
              {checkInText === null ? null : (
                <Button
                  variant="ghost"
                  className="text-ink-foreground hover:bg-white/10"
                  onClick={() => onCheckIn(runningItem.id)}
                >
                  <Check />
                  Check in
                </Button>
              )}
              <Button
                variant="ghost"
                href={calendarPath('day', todayDate)}
                className="text-ink-muted hover:bg-white/10 hover:text-ink-foreground"
              >
                Open in calendar
              </Button>
            </div>
          </article>
        );
      })}
    </section>
  );
};

export default RunningNowList;
