import backendCalendarEventSource from '@/features/calendar/data_sources/backend/calendar-event-source';
import type { CalendarRangeRecord } from '@/features/calendar/entities/calendar-event-record';
import type CalendarRange from '@/features/calendar/entities/calendar-range';

const findCalendarEvents = (calendarRange: CalendarRange): Promise<CalendarRangeRecord> =>
  backendCalendarEventSource.listRange(calendarRange);

export default findCalendarEvents;
