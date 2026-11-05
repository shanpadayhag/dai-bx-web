import { describe, expect, test } from 'vitest';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
import { applyEventChange } from '@/features/calendar/entities/calendar-event-changes';

const eventRecord = (
  eventId: string,
  startsAt: string,
  endsAt: string | null,
): CalendarEventRecord => ({
  id: eventId,
  kind: endsAt === null ? 'tracked' : 'planned',
  title: eventId,
  categoryId: null,
  startsAt,
  endsAt,
  finishedAt: null,
  lastAnsweredAt: null,
  source: null,
});

const morningRecord = eventRecord(
  'morning',
  '2026-11-05T16:00:00.000Z',
  '2026-11-05T17:00:00.000Z',
);
const runningRecord = eventRecord('running', '2026-11-05T18:00:00.000Z', null);
const eventRecords = [morningRecord, runningRecord];

describe('applyEventChange', () => {
  test('adds a new event', () => {
    const addedRecord = eventRecord(
      'added',
      '2026-11-05T20:00:00.000Z',
      '2026-11-05T21:00:00.000Z',
    );

    expect(applyEventChange(eventRecords, { kind: 'add', eventRecord: addedRecord })).toEqual([
      morningRecord,
      runningRecord,
      addedRecord,
    ]);
  });

  test('changes only the given fields of one event', () => {
    expect(
      applyEventChange(eventRecords, {
        kind: 'update',
        eventId: 'morning',
        eventChanges: {
          title: 'Plan the week',
          categoryId: 'focus',
          endsAt: '2026-11-05T17:30:00.000Z',
        },
      }),
    ).toEqual([
      {
        ...morningRecord,
        title: 'Plan the week',
        categoryId: 'focus',
        endsAt: '2026-11-05T17:30:00.000Z',
      },
      runningRecord,
    ]);
  });

  test('a cleared category and a moved start are kept as given', () => {
    const categorizedRecords = [{ ...morningRecord, categoryId: 'focus' }];

    expect(
      applyEventChange(categorizedRecords, {
        kind: 'update',
        eventId: 'morning',
        eventChanges: { categoryId: null, startsAt: '2026-11-05T15:00:00.000Z' },
      }),
    ).toEqual([{ ...morningRecord, categoryId: null, startsAt: '2026-11-05T15:00:00.000Z' }]);
  });

  test('removes a deleted event', () => {
    expect(applyEventChange(eventRecords, { kind: 'delete', eventId: 'morning' })).toEqual([
      runningRecord,
    ]);
  });

  test("swaps in the server's copy of an event", () => {
    const finishedRecord = {
      ...runningRecord,
      endsAt: '2026-11-05T19:00:00.000Z',
      finishedAt: '2026-11-05T19:00:00.000Z',
    };

    expect(
      applyEventChange(eventRecords, { kind: 'replace', eventRecord: finishedRecord }),
    ).toEqual([morningRecord, finishedRecord]);
  });

  test('replacing an event that is not shown leaves the list as it was', () => {
    const elsewhereRecord = eventRecord('elsewhere', '2026-11-12T16:00:00.000Z', null);

    expect(applyEventChange(eventRecords, { kind: 'replace', eventRecord: elsewhereRecord })).toBe(
      eventRecords,
    );
  });

  test('a change to an unknown event leaves the list as it was', () => {
    expect(
      applyEventChange(eventRecords, {
        kind: 'update',
        eventId: 'missing',
        eventChanges: { title: 'Nothing' },
      }),
    ).toBe(eventRecords);
    expect(applyEventChange(eventRecords, { kind: 'delete', eventId: 'missing' })).toBe(
      eventRecords,
    );
  });
});
