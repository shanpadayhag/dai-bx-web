import { categoryColorStyle } from '@/core/category';
import joinClassNames from '@/core/class-names';
import type CalendarEvent from '@/features/calendar/entities/calendar-event';
import { isEventRunning } from '@/features/calendar/entities/calendar-event';

type EventKindDotProps = {
  calendarEvent: CalendarEvent;
};

const EventKindDot = ({ calendarEvent }: EventKindDotProps) => {
  const hasCategory = calendarEvent.category !== null;
  return (
    <span
      aria-hidden="true"
      style={
        calendarEvent.category === null ? undefined : categoryColorStyle(calendarEvent.category)
      }
      className={joinClassNames(
        'size-2 shrink-0 rounded-full',
        calendarEvent.kind === 'planned'
          ? hasCategory
            ? 'border-[1.5px] border-[var(--category)]'
            : 'border-[1.5px] border-dashed border-muted-foreground'
          : hasCategory
            ? 'category-swatch'
            : 'bg-muted-foreground',
        isEventRunning(calendarEvent) &&
          'ring-2 ring-foreground/50 ring-offset-1 ring-offset-background',
      )}
    />
  );
};

export default EventKindDot;
