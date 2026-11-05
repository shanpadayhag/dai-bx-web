import backendCalendarEventSource from '@/features/calendar/data_sources/backend/calendar-event-source';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';

const deleteCalendarEvent = async (eventId: CalendarEventRecord['id']): Promise<void> => {
  await backendCalendarEventSource.delete(eventId);
};

export default deleteCalendarEvent;
