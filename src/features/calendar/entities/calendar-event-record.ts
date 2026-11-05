import type { Category } from '@/core/category';
import type CalendarEvent from '@/features/calendar/entities/calendar-event';
import type { CalendarEventKind } from '@/features/calendar/entities/calendar-event';

type TrackedSourceRecord =
  { kind: 'task'; id: string; groupId: string } | { kind: 'card'; id: string; boardId: string };

type CalendarEventRecord = {
  id: string;
  kind: CalendarEventKind;
  title: string;
  categoryId: string | null;
  startsAt: string;
  endsAt: string | null;
  finishedAt: string | null;
  lastAnsweredAt: string | null;
  source: TrackedSourceRecord | null;
};

const dateOrNull = (instantText: string | null): Date | null =>
  instantText === null ? null : new Date(instantText);

const calendarEventFromRecord = (
  eventRecord: CalendarEventRecord,
  categoriesById: ReadonlyMap<string, Category>,
): CalendarEvent => ({
  id: eventRecord.id,
  kind: eventRecord.kind,
  title: eventRecord.title,
  category:
    eventRecord.categoryId === null ? null : (categoriesById.get(eventRecord.categoryId) ?? null),
  startsAt: new Date(eventRecord.startsAt),
  endsAt: dateOrNull(eventRecord.endsAt),
  finishedAt: dateOrNull(eventRecord.finishedAt),
  source: eventRecord.source === null ? null : { kind: eventRecord.source.kind },
});

export type { TrackedSourceRecord };
export { calendarEventFromRecord, dateOrNull };
export default CalendarEventRecord;
