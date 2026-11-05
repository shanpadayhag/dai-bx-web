import AppError from '@/core/app-error';
import backendCalendarEventSource from '@/features/calendar/data_sources/backend/calendar-event-source';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';

type CreatePlannedEventParams = {
  title: string;
  categoryId: string | null;
  startsAt: Date;
  endsAt: Date;
};

const PLANNED_TITLE_MAX_CHARACTERS = 200;
const PLANNED_MINIMUM_MILLIS = 15 * 60_000;

const readPlannedTitle = (enteredTitle: string): string => {
  const trimmedTitle = enteredTitle.trim();
  const titleLength = [...trimmedTitle].length;
  if (titleLength === 0) throw new AppError('Name It', 'Give the event a title.');
  if (titleLength > PLANNED_TITLE_MAX_CHARACTERS) {
    throw new AppError('Too Long', 'Keep the title to 200 characters.');
  }
  return trimmedTitle;
};

const checkPlannedTimes = (startsAt: Date, endsAt: Date) => {
  if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) {
    throw new AppError('Pick the Times', 'Choose a day and a time for the start and the end.');
  }
  if (endsAt.getTime() - startsAt.getTime() < PLANNED_MINIMUM_MILLIS) {
    throw new AppError('Too Short', 'A planned event ends at least 15 minutes after it starts.');
  }
};

const createPlannedEvent = async (
  params: CreatePlannedEventParams,
): Promise<CalendarEventRecord> => {
  const plannedTitle = readPlannedTitle(params.title);
  checkPlannedTimes(params.startsAt, params.endsAt);
  return backendCalendarEventSource.createPlanned({
    title: plannedTitle,
    categoryId: params.categoryId,
    startsAt: params.startsAt.toISOString(),
    endsAt: params.endsAt.toISOString(),
  });
};

export { checkPlannedTimes, readPlannedTitle };
export default createPlannedEvent;
