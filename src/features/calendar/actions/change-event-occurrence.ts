import type { OccurrenceScope } from '@/core/occurrence-scope';
import type { RepeatRule } from '@/core/repeat-rule';
import { wallClockInZone } from '@/core/zoned-time';
import {
  checkPlannedTimes,
  readPlannedTitle,
} from '@/features/calendar/actions/create-planned-event';
import backendCalendarEventSource from '@/features/calendar/data_sources/backend/calendar-event-source';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
import type { SeriesOccurrenceKey } from '@/features/calendar/entities/calendar-event-record';

type OccurrenceTimes = {
  startsAt: Date;
  endsAt: Date;
};

type ChangeEventOccurrenceParams = {
  occurrenceKey: SeriesOccurrenceKey;
  scope: OccurrenceScope;
  inputZone: string;
  title?: string;
  categoryId?: string | null;
  times?: OccurrenceTimes;
  timeZone?: string;
  repeat?: RepeatRule;
};

const changeEventOccurrence = async (
  params: ChangeEventOccurrenceParams,
): Promise<CalendarEventRecord> => {
  const plannedTitle = params.title === undefined ? undefined : readPlannedTitle(params.title);
  if (params.times !== undefined) checkPlannedTimes(params.times.startsAt, params.times.endsAt);
  return backendCalendarEventSource.changeOccurrence(params.occurrenceKey, params.scope, {
    ...(plannedTitle === undefined ? {} : { title: plannedTitle }),
    ...(params.categoryId === undefined ? {} : { categoryId: params.categoryId }),
    ...(params.times === undefined
      ? {}
      : {
          start: wallClockInZone(params.times.startsAt, params.inputZone),
          end: wallClockInZone(params.times.endsAt, params.inputZone),
        }),
    inputZone: params.inputZone,
    ...(params.timeZone === undefined ? {} : { timeZone: params.timeZone }),
    ...(params.repeat === undefined ? {} : { repeat: params.repeat }),
  });
};

export type { ChangeEventOccurrenceParams };
export default changeEventOccurrence;
