import backendCalendarEventSource from '@/features/calendar/data_sources/backend/calendar-event-source';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
import type CalendarRange from '@/features/calendar/entities/calendar-range';

const findCalendarEvents = (calendarRange: CalendarRange): Promise<CalendarEventRecord[]> =>
  backendCalendarEventSource.listRange(calendarRange);

export default findCalendarEvents;
