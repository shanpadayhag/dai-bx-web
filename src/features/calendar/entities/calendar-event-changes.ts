import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';

type CalendarEventChanges = Partial<
  Pick<CalendarEventRecord, 'title' | 'categoryId' | 'startsAt' | 'endsAt'>
>;

type LocalEventChange =
  | { kind: 'add'; eventRecord: CalendarEventRecord }
  | { kind: 'update'; eventId: string; eventChanges: CalendarEventChanges }
  | { kind: 'delete'; eventId: string }
  | { kind: 'replace'; eventRecord: CalendarEventRecord };

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
  }
};

export type { CalendarEventChanges, LocalEventChange };
export { applyEventChange };
