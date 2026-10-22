import joinClassNames from '@/core/class-names';
import { categoryColorStyle } from '@/core/category';
import CalendarEvent from '@/features/calendar/entities/calendar-event';

const minuteHeight = 56 / 60;

type CalendarEventBlockProps = {
  calendarEvent: CalendarEvent;
};

const CalendarEventBlock = ({ calendarEvent }: CalendarEventBlockProps) => {
  const awayMinutes =
    calendarEvent.awayFromMinute === null
      ? 0
      : calendarEvent.startMinute + calendarEvent.durationMinutes - calendarEvent.awayFromMinute;
  const isShort = calendarEvent.durationMinutes < 40;
  const isRoomy = calendarEvent.durationMinutes >= 75;

  return (
    <button
      type="button"
      title={`${calendarEvent.title} · ${calendarEvent.timeLabel}`}
      className={joinClassNames(
        'absolute inset-x-1 overflow-hidden rounded-lg text-left transition-colors duration-150',
        calendarEvent.kind === 'planned' ? 'category-soft' : 'category-solid',
        calendarEvent.kind === 'running' &&
          'shadow-lift ring-2 ring-foreground/70 ring-offset-2 ring-offset-background',
        calendarEvent.kind !== 'planned' && 'shadow-soft',
      )}
      style={{
        ...categoryColorStyle(calendarEvent.category),
        top: calendarEvent.startMinute * minuteHeight,
        height: Math.max(calendarEvent.durationMinutes * minuteHeight, 20),
      }}
    >
      <span
        className={joinClassNames(
          'flex h-full flex-col px-2',
          isShort ? 'justify-center' : 'gap-0.5 py-1.5',
        )}
      >
        <span
          className={joinClassNames(
            'text-xs leading-tight font-medium',
            isRoomy ? 'line-clamp-2' : 'truncate',
          )}
        >
          {calendarEvent.title}
        </span>
        {isShort ? null : (
          <span className="truncate font-mono text-[11px] leading-tight tabular-nums opacity-80">
            {calendarEvent.timeLabel}
          </span>
        )}
      </span>
      {awayMinutes > 0 ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 bg-[repeating-linear-gradient(135deg,var(--background)_0_4px,transparent_4px_8px)] opacity-60"
          style={{ height: awayMinutes * minuteHeight }}
        />
      ) : null}
    </button>
  );
};

export default CalendarEventBlock;
