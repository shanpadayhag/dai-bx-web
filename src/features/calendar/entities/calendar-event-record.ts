import type { Category } from '@/core/category';
import type { RepeatRule } from '@/core/repeat-rule';
import type CalendarEvent from '@/features/calendar/entities/calendar-event';
import type { CalendarEventKind } from '@/features/calendar/entities/calendar-event';
import type ScheduledMove from '@/features/calendar/entities/scheduled-move';

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
  timeZone: string | null;
  series: SeriesOccurrenceRecord | null;
};

type SeriesOccurrenceRecord = {
  id: string;
  originalStart: string;
  repeat: RepeatRule;
};

type SeriesOccurrenceKey = {
  seriesId: string;
  originalStart: string;
};

type ScheduledMoveRecord = {
  scheduleId: string;
  cardId: string;
  cardTitle: string;
  boardId: string;
  listName: string;
  at: string;
};

type CalendarRangeRecord = {
  events: CalendarEventRecord[];
  moves: ScheduledMoveRecord[];
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
  ...(eventRecord.timeZone === null ? {} : { timeZone: eventRecord.timeZone }),
  ...(eventRecord.series === null
    ? {}
    : {
        series: {
          id: eventRecord.series.id,
          originalStart: new Date(eventRecord.series.originalStart),
          repeatRule: eventRecord.series.repeat,
        },
      }),
});

const seriesOccurrenceKeyOf = (eventRecord: CalendarEventRecord): SeriesOccurrenceKey | null =>
  eventRecord.series === null
    ? null
    : { seriesId: eventRecord.series.id, originalStart: eventRecord.series.originalStart };

const scheduledMoveFromRecord = (moveRecord: ScheduledMoveRecord): ScheduledMove => ({
  ...moveRecord,
  at: new Date(moveRecord.at),
});

export type {
  CalendarRangeRecord,
  ScheduledMoveRecord,
  SeriesOccurrenceKey,
  SeriesOccurrenceRecord,
  TrackedSourceRecord,
};
export { calendarEventFromRecord, dateOrNull, scheduledMoveFromRecord, seriesOccurrenceKeyOf };
export default CalendarEventRecord;
