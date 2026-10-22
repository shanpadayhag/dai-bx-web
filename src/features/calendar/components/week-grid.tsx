import joinClassNames from '@/core/class-names';
import CalendarDay from '@/features/calendar/entities/calendar-day';
import CalendarEvent from '@/features/calendar/entities/calendar-event';
import CalendarEventBlock from '@/features/calendar/components/calendar-event-block';

const hourHeight = 56;

type WeekGridProps = {
  weekDays: CalendarDay[];
  weekEvents: CalendarEvent[];
  hourLabels: string[];
  nowMinute: number;
};

const WeekGrid = ({ weekDays, weekEvents, hourLabels, nowMinute }: WeekGridProps) => {
  const eventsByDayIndex = new Map<number, CalendarEvent[]>();
  for (const weekEvent of weekEvents) {
    const dayEvents = eventsByDayIndex.get(weekEvent.dayIndex) ?? [];
    dayEvents.push(weekEvent);
    eventsByDayIndex.set(weekEvent.dayIndex, dayEvents);
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-background shadow-soft">
      <div className="min-w-[760px]">
        <div className="sticky top-0 z-10 grid grid-cols-[56px_repeat(7,1fr)] border-b border-border bg-background/95 backdrop-blur">
          <span />
          {weekDays.map((weekDay) => (
            <div
              key={weekDay.dateLabel}
              className="flex items-baseline justify-center gap-1.5 py-3"
            >
              <span className="text-xs text-muted-foreground">{weekDay.weekdayLabel}</span>
              <span
                className={joinClassNames(
                  'inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
                  weekDay.isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
                )}
              >
                {weekDay.dateLabel}
              </span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-[56px_repeat(7,1fr)] pt-3">
          <div>
            {hourLabels.map((hourLabel) => (
              <div key={hourLabel} className="relative" style={{ height: hourHeight }}>
                <span className="absolute -top-2 right-2 font-mono text-[11px] text-muted-foreground tabular-nums">
                  {hourLabel}
                </span>
              </div>
            ))}
          </div>
          {weekDays.map((weekDay, dayIndex) => (
            <div
              key={weekDay.dateLabel}
              className={joinClassNames(
                'relative border-l border-border',
                weekDay.isToday && 'bg-primary-soft/25',
              )}
              style={{
                backgroundImage: 'linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
                backgroundSize: `100% ${hourHeight}px`,
              }}
            >
              <div style={{ height: hourLabels.length * hourHeight }} />
              {(eventsByDayIndex.get(dayIndex) ?? []).map((calendarEvent) => (
                <CalendarEventBlock key={calendarEvent.id} calendarEvent={calendarEvent} />
              ))}
              {weekDay.isToday ? (
                <div
                  aria-label="Now, 18:02"
                  className="pointer-events-none absolute inset-x-0 z-[1] flex items-center"
                  style={{ top: (nowMinute / 60) * hourHeight }}
                >
                  <span className="-ml-1 size-2 rounded-full bg-danger" />
                  <span className="h-px flex-1 bg-danger" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeekGrid;
