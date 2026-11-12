import apiClient from '@/core/api/api-client';
import type { OccurrenceScope } from '@/core/occurrence-scope';
import type { RepeatRule } from '@/core/repeat-rule';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
import type {
  CalendarRangeRecord,
  SeriesOccurrenceKey,
} from '@/features/calendar/entities/calendar-event-record';
import type CalendarRange from '@/features/calendar/entities/calendar-range';

type NewPlannedEvent = {
  title: string;
  categoryId: string | null;
  start: string;
  end: string;
  inputZone: string;
  timeZone?: string | null;
  repeat?: RepeatRule;
};

type CalendarEventWrite = {
  title?: string;
  categoryId?: string | null;
  start?: string;
  end?: string;
  inputZone?: string;
  timeZone?: string | null;
  repeat?: RepeatRule | null;
};

type DeletedAnswer = {
  status: string;
};

const occurrencePath = (occurrenceKey: SeriesOccurrenceKey) =>
  `/calendar/series/${occurrenceKey.seriesId}/occurrences/${encodeURIComponent(occurrenceKey.originalStart)}`;

const backendCalendarEventSource = {
  listRange: (calendarRange: CalendarRange) => {
    const rangeSearch = new URLSearchParams({
      start: calendarRange.start,
      days: String(calendarRange.days),
      timeZone: calendarRange.timeZone,
    });
    return apiClient.get<CalendarRangeRecord>(`/calendar/events?${rangeSearch.toString()}`);
  },
  createPlanned: (newPlannedEvent: NewPlannedEvent) =>
    apiClient.post<CalendarEventRecord>('/calendar/events', newPlannedEvent),
  update: (eventId: CalendarEventRecord['id'], eventWrite: CalendarEventWrite) =>
    apiClient.patch<CalendarEventRecord>(`/calendar/events/${eventId}`, eventWrite),
  delete: (eventId: CalendarEventRecord['id']) =>
    apiClient.delete<DeletedAnswer>(`/calendar/events/${eventId}`),
  changeOccurrence: (
    occurrenceKey: SeriesOccurrenceKey,
    occurrenceScope: OccurrenceScope,
    eventWrite: CalendarEventWrite,
  ) =>
    apiClient.patch<CalendarEventRecord>(occurrencePath(occurrenceKey), {
      scope: occurrenceScope,
      ...eventWrite,
    }),
  deleteOccurrence: (occurrenceKey: SeriesOccurrenceKey, occurrenceScope: OccurrenceScope) =>
    apiClient.delete<DeletedAnswer>(
      `${occurrencePath(occurrenceKey)}?${new URLSearchParams({ scope: occurrenceScope }).toString()}`,
    ),
};

export type { CalendarEventWrite, NewPlannedEvent };
export default backendCalendarEventSource;
