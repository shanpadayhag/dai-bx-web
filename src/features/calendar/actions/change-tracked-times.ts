import AppError from '@/core/app-error';
import backendCalendarEventSource from '@/features/calendar/data_sources/backend/calendar-event-source';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';

type ChangeTrackedTimesParams = {
  eventId: CalendarEventRecord['id'];
  startsAt: Date;
  endsAt: Date;
  now: Date;
};

const changeTrackedTimes = async (
  params: ChangeTrackedTimesParams,
): Promise<CalendarEventRecord> => {
  if (Number.isNaN(params.startsAt.getTime()) || Number.isNaN(params.endsAt.getTime())) {
    throw new AppError('Pick the Times', 'Choose a day and a time for the start and the end.');
  }
  if (params.endsAt <= params.startsAt) {
    throw new AppError('Check the Times', 'The end comes after the start.');
  }
  if (params.endsAt > params.now) {
    throw new AppError('Check the Times', "A tracked event can't end in the future.");
  }
  return backendCalendarEventSource.update(params.eventId, {
    startsAt: params.startsAt.toISOString(),
    endsAt: params.endsAt.toISOString(),
  });
};

export default changeTrackedTimes;
