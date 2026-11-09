import { Layers } from 'lucide-react';
import joinClassNames from '@/core/class-names';
import EventKindDot from '@/features/calendar/components/event-kind-dot';
import { isEventRunning } from '@/features/calendar/entities/calendar-event';
import type { DayLayoutEntry } from '@/features/calendar/entities/day-layout';
import {
  formatClock,
  formatEventTimeRange,
  formatMinuteOfDay,
} from '@/features/calendar/entities/event-time';

type StackEntry = Extract<DayLayoutEntry, { kind: 'stack' }>;

type CalendarStackBlockProps = {
  stackEntry: StackEntry;
  minuteHeight: number;
  selectedEventId: string | null;
  timeZone: string;
  onSelectEvent: (eventId: string) => void;
};

const stackKindLabel = (eventKind: 'planned' | 'tracked', isRunning: boolean): string => {
  if (isRunning) return 'Tracking now';
  return eventKind === 'planned' ? 'Planned' : 'Tracked';
};

const CalendarStackBlock = ({
  stackEntry,
  minuteHeight,
  selectedEventId,
  timeZone,
  onSelectEvent,
}: CalendarStackBlockProps) => {
  const popoverId = `${stackEntry.id}-popover`;
  const stackEvents = stackEntry.pieces.map((piece) => piece.event);
  const hasRunningEvent = stackEvents.some(isEventRunning);
  const hasSelectedEvent = stackEvents.some((stackEvent) => stackEvent.id === selectedEventId);
  const endsNow = stackEntry.pieces.some(
    (piece) => isEventRunning(piece.event) && piece.endMinute === stackEntry.endMinute,
  );
  const stackStartLabel = formatClock(stackEntry.pieces[0]?.event.startsAt ?? new Date(), timeZone);
  const stackRangeLabel = `${stackStartLabel} – ${endsNow ? 'now' : formatMinuteOfDay(stackEntry.endMinute)}`;

  return (
    <>
      <button
        type="button"
        popoverTarget={popoverId}
        aria-label={`${stackEvents.length} events, ${stackRangeLabel}`}
        className={joinClassNames(
          'absolute inset-x-1 z-[1] flex flex-col gap-1 overflow-hidden rounded-lg border border-border-strong bg-background px-2 py-1.5 text-left shadow-soft transition-[border-color,box-shadow] duration-150 hover:border-primary/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
          hasRunningEvent &&
            'shadow-lift ring-2 ring-foreground/70 ring-offset-2 ring-offset-background',
          hasSelectedEvent && 'outline-2 outline-offset-2 outline-primary',
        )}
        style={{
          top: stackEntry.startMinute * minuteHeight,
          height: (stackEntry.endMinute - stackEntry.startMinute) * minuteHeight,
        }}
      >
        <span className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <Layers aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
          {stackEvents.length} events
        </span>
        <span className="grid gap-1">
          {stackEvents.map((stackEvent) => (
            <span
              key={stackEvent.id}
              className="flex min-w-0 items-center gap-1.5 text-[11px] leading-tight text-foreground"
            >
              <EventKindDot calendarEvent={stackEvent} />
              <span className="truncate">{stackEvent.title}</span>
            </span>
          ))}
        </span>
      </button>
      <div
        id={popoverId}
        popover="auto"
        role="dialog"
        aria-label={`${stackEvents.length} events from ${stackRangeLabel}`}
        className="m-auto w-[min(320px,calc(100vw-2rem))] rounded-xl border border-border bg-background p-1.5 text-foreground shadow-lift backdrop:bg-transparent supports-[position-area:bottom]:m-0 supports-[position-area:bottom]:ml-2 supports-[position-area:bottom]:[position-area:right_span-bottom] supports-[position-area:bottom]:[position-try-fallbacks:flip-inline]"
      >
        <p className="px-2.5 pt-1.5 pb-2 font-mono text-xs text-muted-foreground tabular-nums">
          {stackRangeLabel}
        </p>
        <ul className="grid gap-0.5">
          {stackEvents.map((stackEvent) => {
            const isRunning = isEventRunning(stackEvent);
            return (
              <li key={stackEvent.id}>
                <button
                  type="button"
                  popoverTarget={popoverId}
                  popoverTargetAction="hide"
                  onClick={() => onSelectEvent(stackEvent.id)}
                  aria-current={stackEvent.id === selectedEventId ? 'true' : undefined}
                  className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-2.5 rounded-lg px-2.5 py-2 text-left transition-colors duration-150 hover:bg-surface focus-visible:outline-2 focus-visible:outline-primary aria-[current=true]:bg-primary-soft/60"
                >
                  <EventKindDot calendarEvent={stackEvent} />
                  <span className="grid min-w-0 gap-0.5">
                    <span className="truncate text-sm font-medium text-foreground">
                      {stackEvent.title}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {stackKindLabel(stackEvent.kind, isRunning)}
                      {stackEvent.category === null ? '' : ` · ${stackEvent.category.name}`}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-muted-foreground tabular-nums">
                    {formatEventTimeRange(stackEvent, timeZone)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

export default CalendarStackBlock;
