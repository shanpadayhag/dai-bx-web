import backendCalendarEventSource from '@/features/calendar/data_sources/backend/calendar-event-source';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';

type ChangeEventCategoryParams = {
  eventId: CalendarEventRecord['id'];
  categoryId: string | null;
};

const changeEventCategory = (params: ChangeEventCategoryParams): Promise<CalendarEventRecord> =>
  backendCalendarEventSource.update(params.eventId, { categoryId: params.categoryId });

export default changeEventCategory;
