import type { OccurrenceScope } from '@/core/occurrence-scope';
import backendCalendarEventSource from '@/features/calendar/data_sources/backend/calendar-event-source';
import type { SeriesOccurrenceKey } from '@/features/calendar/entities/calendar-event-record';

const deleteEventOccurrence = async (
  occurrenceKey: SeriesOccurrenceKey,
  occurrenceScope: OccurrenceScope,
): Promise<void> => {
  await backendCalendarEventSource.deleteOccurrence(occurrenceKey, occurrenceScope);
};

export default deleteEventOccurrence;
