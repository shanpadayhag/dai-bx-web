import backendCalendarEventSource from '@/features/calendar/data_sources/backend/calendar-event-source';
import {
  checkPlannedTimes,
  readPlannedTitle,
} from '@/features/calendar/actions/create-planned-event';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';

type UpdatePlannedEventParams = {
  eventId: CalendarEventRecord['id'];
  title?: string;
  categoryId?: string | null;
  startsAt: Date;
  endsAt: Date;
};

const updatePlannedEvent = async (
  params: UpdatePlannedEventParams,
): Promise<CalendarEventRecord> => {
  const plannedTitle = params.title === undefined ? undefined : readPlannedTitle(params.title);
  checkPlannedTimes(params.startsAt, params.endsAt);
  return backendCalendarEventSource.update(params.eventId, {
    ...(plannedTitle === undefined ? {} : { title: plannedTitle }),
    ...(params.categoryId === undefined ? {} : { categoryId: params.categoryId }),
    startsAt: params.startsAt.toISOString(),
    endsAt: params.endsAt.toISOString(),
  });
};

export default updatePlannedEvent;
