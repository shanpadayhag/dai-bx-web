import apiClient from '@/core/api/api-client';
import type { CalendarEventChanges } from '@/features/calendar/entities/calendar-event-changes';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
import type CalendarRange from '@/features/calendar/entities/calendar-range';

type NewPlannedEvent = {
  title: string;
  categoryId: string | null;
  startsAt: string;
  endsAt: string;
};

type DeletedAnswer = {
  status: string;
};

const backendCalendarEventSource = {
  listRange: (calendarRange: CalendarRange) => {
    const rangeSearch = new URLSearchParams({
      from: calendarRange.from.toISOString(),
      to: calendarRange.to.toISOString(),
    });
    return apiClient.get<CalendarEventRecord[]>(`/calendar/events?${rangeSearch.toString()}`);
  },
  createPlanned: (newPlannedEvent: NewPlannedEvent) =>
    apiClient.post<CalendarEventRecord>('/calendar/events', newPlannedEvent),
  update: (eventId: CalendarEventRecord['id'], eventChanges: CalendarEventChanges) =>
    apiClient.patch<CalendarEventRecord>(`/calendar/events/${eventId}`, eventChanges),
  delete: (eventId: CalendarEventRecord['id']) =>
    apiClient.delete<DeletedAnswer>(`/calendar/events/${eventId}`),
};

export type { NewPlannedEvent };
export default backendCalendarEventSource;
