import type { OccurrenceScope } from '@/core/occurrence-scope';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';

type CalendarEventChanges = Partial<
  Pick<CalendarEventRecord, 'title' | 'categoryId' | 'startsAt' | 'endsAt'>
>;

type LocalEventChange =
  | { kind: 'add'; eventRecord: CalendarEventRecord }
  | { kind: 'update'; eventId: string; eventChanges: CalendarEventChanges }
  | { kind: 'delete'; eventId: string }
  | { kind: 'replace'; eventRecord: CalendarEventRecord }
  | {
      kind: 'updateOccurrences';
      eventId: string;
      scope: OccurrenceScope;
      eventChanges: CalendarEventChanges;
    }
  | { kind: 'deleteOccurrences'; eventId: string; scope: OccurrenceScope };

const replaceEvent = (
  eventRecords: readonly CalendarEventRecord[],
  eventId: string,
  changeEvent: (eventRecord: CalendarEventRecord) => CalendarEventRecord,
): readonly CalendarEventRecord[] => {
  const eventIndex = eventRecords.findIndex((eventRecord) => eventRecord.id === eventId);
  const currentRecord = eventRecords[eventIndex];
  if (currentRecord === undefined) return eventRecords;
  const changedRecords = [...eventRecords];
  changedRecords[eventIndex] = changeEvent(currentRecord);
  return changedRecords;
};

const isInScope = (
  targetRecord: CalendarEventRecord,
  occurrenceScope: OccurrenceScope,
  eventRecord: CalendarEventRecord,
): boolean => {
  if (occurrenceScope === 'this') return eventRecord.id === targetRecord.id;
  if (eventRecord.series === null || eventRecord.series.id !== targetRecord.series?.id) {
    return false;
  }
  return (
    occurrenceScope === 'all' ||
    Date.parse(eventRecord.series.originalStart) >= Date.parse(targetRecord.series.originalStart)
  );
};

const shiftedInstant = (instantText: string, shiftMillis: number): string =>
  new Date(Date.parse(instantText) + shiftMillis).toISOString();

const shiftMillisOf = (
  fromText: string | null,
  toText: string | null | undefined,
): number | null =>
  fromText === null || toText === undefined || toText === null
    ? null
    : Date.parse(toText) - Date.parse(fromText);

const changeOccurrences = (
  eventRecords: readonly CalendarEventRecord[],
  eventId: string,
  occurrenceScope: OccurrenceScope,
  changeOccurrence: (
    eventRecord: CalendarEventRecord,
    targetRecord: CalendarEventRecord,
  ) => CalendarEventRecord | null,
): readonly CalendarEventRecord[] => {
  const targetRecord = eventRecords.find((eventRecord) => eventRecord.id === eventId);
  if (targetRecord === undefined || targetRecord.series === null) return eventRecords;
  return eventRecords.flatMap((eventRecord) => {
    if (!isInScope(targetRecord, occurrenceScope, eventRecord)) return [eventRecord];
    const changedRecord = changeOccurrence(eventRecord, targetRecord);
    return changedRecord === null ? [] : [changedRecord];
  });
};

const applyOccurrenceChanges = (
  eventRecord: CalendarEventRecord,
  targetRecord: CalendarEventRecord,
  eventChanges: CalendarEventChanges,
): CalendarEventRecord => {
  const startShiftMillis = shiftMillisOf(targetRecord.startsAt, eventChanges.startsAt);
  const endShiftMillis = shiftMillisOf(targetRecord.endsAt, eventChanges.endsAt);
  return {
    ...eventRecord,
    ...(eventChanges.title === undefined ? {} : { title: eventChanges.title }),
    ...(eventChanges.categoryId === undefined ? {} : { categoryId: eventChanges.categoryId }),
    ...(startShiftMillis === null
      ? {}
      : { startsAt: shiftedInstant(eventRecord.startsAt, startShiftMillis) }),
    ...(endShiftMillis === null || eventRecord.endsAt === null
      ? {}
      : { endsAt: shiftedInstant(eventRecord.endsAt, endShiftMillis) }),
  };
};

const applyEventChange = (
  eventRecords: readonly CalendarEventRecord[],
  localEventChange: LocalEventChange,
): readonly CalendarEventRecord[] => {
  switch (localEventChange.kind) {
    case 'add':
      return [...eventRecords, localEventChange.eventRecord];
    case 'update':
      return replaceEvent(eventRecords, localEventChange.eventId, (eventRecord) => ({
        ...eventRecord,
        ...localEventChange.eventChanges,
      }));
    case 'delete': {
      const keptRecords = eventRecords.filter(
        (eventRecord) => eventRecord.id !== localEventChange.eventId,
      );
      return keptRecords.length === eventRecords.length ? eventRecords : keptRecords;
    }
    case 'replace':
      return replaceEvent(
        eventRecords,
        localEventChange.eventRecord.id,
        () => localEventChange.eventRecord,
      );
    case 'updateOccurrences':
      return changeOccurrences(
        eventRecords,
        localEventChange.eventId,
        localEventChange.scope,
        (eventRecord, targetRecord) =>
          applyOccurrenceChanges(eventRecord, targetRecord, localEventChange.eventChanges),
      );
    case 'deleteOccurrences':
      return changeOccurrences(
        eventRecords,
        localEventChange.eventId,
        localEventChange.scope,
        () => null,
      );
  }
};

export type { CalendarEventChanges, LocalEventChange };
export { applyEventChange };
