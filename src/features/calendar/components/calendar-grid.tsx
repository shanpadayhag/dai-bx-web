import type { CSSProperties } from 'react';
import joinClassNames from '@/core/class-names';
import CalendarEventBlock from '@/features/calendar/components/calendar-event-block';
import CalendarScrollArea from '@/features/calendar/components/calendar-scroll-area';
import CalendarStackBlock from '@/features/calendar/components/calendar-stack-block';
import type { DayLayoutEntry } from '@/features/calendar/entities/day-layout';
import { formatClock, formatMinuteOfDay } from '@/features/calendar/entities/event-time';

const HOUR_HEIGHT = 56;
const MINUTE_HEIGHT = HOUR_HEIGHT / 60;
const HOUR_MINUTES = Array.from({ length: 24 }, (_, hourIndex) => hourIndex * 60);

type CalendarGridDay = {
  dayStart: Date;
  isToday: boolean;
  layoutEntries: DayLayoutEntry[];
};

type CalendarGridProps = {
  gridDays: CalendarGridDay[];
  now: Date;
  workingHoursStartMinute: number;
  selectedEventId: string | null;
  hrefForEvent: (eventId: string) => string;
};

const weekdayFormat = new Intl.DateTimeFormat('en', { weekday: 'short' });

const CalendarGrid = ({
  gridDays,
  now,
  workingHoursStartMinute,
  selectedEventId,
  hrefForEvent,
}: CalendarGridProps) => {
  const isDayView = gridDays.length === 1;
  const nowMinute = now.getHours() * 60 + now.getMinutes();
  const gridColumnsStyle: CSSProperties = {
    gridTemplateColumns: `56px repeat(${gridDays.length}, minmax(0, 1fr))`,
  };

  return (
    <CalendarScrollArea
      initialScrollTop={Math.max(0, (workingHoursStartMinute - 30) * MINUTE_HEIGHT)}
    >
      <div className={isDayView ? undefined : 'min-w-[760px]'}>
        <div
          className="sticky top-0 z-10 grid border-b border-border bg-background/95 backdrop-blur"
          style={gridColumnsStyle}
        >
          <span />
          {gridDays.map((gridDay) => (
            <div
              key={gridDay.dayStart.toISOString()}
              className={joinClassNames(
                'flex items-baseline gap-1.5 py-3',
                isDayView ? 'justify-start pl-3' : 'justify-center',
              )}
            >
              <span className="text-xs text-muted-foreground">
                {weekdayFormat.format(gridDay.dayStart)}
              </span>
              <span
                className={joinClassNames(
                  'inline-flex size-7 items-center justify-center rounded-full text-sm font-semibold tabular-nums',
                  gridDay.isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
                )}
              >
                {gridDay.dayStart.getDate()}
              </span>
            </div>
          ))}
        </div>
        <div
          className="grid pt-3 pb-3 [--cascade-step:16px] data-[view=day]:[--cascade-step:28px]"
          data-view={isDayView ? 'day' : 'week'}
          style={gridColumnsStyle}
        >
          <div>
            {HOUR_MINUTES.map((hourMinute) => (
              <div key={hourMinute} className="relative" style={{ height: HOUR_HEIGHT }}>
                {hourMinute === 0 ? null : (
                  <span className="absolute -top-2 right-2 font-mono text-[11px] text-muted-foreground tabular-nums">
                    {formatMinuteOfDay(hourMinute)}
                  </span>
                )}
              </div>
            ))}
          </div>
          {gridDays.map((gridDay) => (
            <div
              key={gridDay.dayStart.toISOString()}
              className={joinClassNames(
                'relative border-l border-border',
                gridDay.isToday && 'bg-primary-soft/25',
              )}
              style={{
                height: 24 * HOUR_HEIGHT,
                backgroundImage: 'linear-gradient(to bottom, var(--border) 1px, transparent 1px)',
                backgroundSize: `100% ${HOUR_HEIGHT}px`,
              }}
            >
              {gridDay.layoutEntries.map((layoutEntry) =>
                layoutEntry.kind === 'stack' ? (
                  <CalendarStackBlock
                    key={layoutEntry.id}
                    stackEntry={layoutEntry}
                    minuteHeight={MINUTE_HEIGHT}
                    selectedEventId={selectedEventId}
                    hrefForEvent={hrefForEvent}
                  />
                ) : (
                  <CalendarEventBlock
                    key={`${layoutEntry.piece.event.id}-${layoutEntry.piece.dayStart.toISOString()}`}
                    piece={layoutEntry.piece}
                    cascadeLevel={layoutEntry.cascadeLevel}
                    minuteHeight={MINUTE_HEIGHT}
                    isSelected={layoutEntry.piece.event.id === selectedEventId}
                    href={hrefForEvent(layoutEntry.piece.event.id)}
                  />
                ),
              )}
              {gridDay.isToday ? (
                <div
                  aria-label={`Now, ${formatClock(now)}`}
                  className="pointer-events-none absolute inset-x-0 z-[3] flex items-center"
                  style={{ top: nowMinute * MINUTE_HEIGHT }}
                >
                  <span className="-ml-1 size-2 rounded-full bg-danger" />
                  <span className="h-px flex-1 bg-danger" />
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </CalendarScrollArea>
  );
};

export type { CalendarGridDay };
export default CalendarGrid;
