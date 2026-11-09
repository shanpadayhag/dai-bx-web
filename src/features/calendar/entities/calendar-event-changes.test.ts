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
  timeZone: null,
  series: null,
  source: null,
});

const morningRecord = eventRecord(
  'morning',
  '2026-11-05T16:00:00.000Z',
  '2026-11-05T17:00:00.000Z',
);
const runningRecord = eventRecord('running', '2026-11-05T18:00:00.000Z', null);
const eventRecords = [morningRecord, runningRecord];

const occurrenceRecord = (seriesId: string, originalStart: string): CalendarEventRecord => ({
  ...eventRecord(
    `${seriesId}:${originalStart}`,
    originalStart,
    new Date(Date.parse(originalStart) + 60 * 60_000).toISOString(),
  ),
  title: seriesId,
  timeZone: 'Asia/Manila',
  series: {
    id: seriesId,
    originalStart,
    repeat: { frequency: 'weekly', interval: 1, weekdays: ['tue'], ends: { never: true } },
  },
});

const firstRun = occurrenceRecord('run', '2026-11-09T22:00:00.000Z');
const secondRun = occurrenceRecord('run', '2026-11-16T22:00:00.000Z');
const thirdRun = occurrenceRecord('run', '2026-11-23T22:00:00.000Z');
const familyCall = occurrenceRecord('call', '2026-11-15T11:00:00.000Z');
const seriesRecords = [morningRecord, firstRun, secondRun, thirdRun, familyCall];

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

describe('applyEventChange on a series', () => {
  test('"This event" changes only the one occurrence', () => {
    expect(
      applyEventChange(seriesRecords, {
        kind: 'updateOccurrences',
        eventId: secondRun.id,
        scope: 'this',
        eventChanges: { title: 'Long run' },
      }),
    ).toEqual([morningRecord, firstRun, { ...secondRun, title: 'Long run' }, thirdRun, familyCall]);
  });

  test('"This and following" moves this and the later occurrences by the same amount', () => {
    expect(
      applyEventChange(seriesRecords, {
        kind: 'updateOccurrences',
        eventId: secondRun.id,
        scope: 'following',
        eventChanges: {
          startsAt: '2026-11-16T22:30:00.000Z',
          endsAt: '2026-11-16T23:30:00.000Z',
        },
      }),
    ).toEqual([
      morningRecord,
      firstRun,
      { ...secondRun, startsAt: '2026-11-16T22:30:00.000Z', endsAt: '2026-11-16T23:30:00.000Z' },
      { ...thirdRun, startsAt: '2026-11-23T22:30:00.000Z', endsAt: '2026-11-23T23:30:00.000Z' },
      familyCall,
    ]);
  });

  test('"All events" changes every occurrence of that series and no other', () => {
    expect(
      applyEventChange(seriesRecords, {
        kind: 'updateOccurrences',
        eventId: thirdRun.id,
        scope: 'all',
        eventChanges: { categoryId: 'health', endsAt: '2026-11-23T23:15:00.000Z' },
      }),
    ).toEqual([
      morningRecord,
      { ...firstRun, categoryId: 'health', endsAt: '2026-11-09T23:15:00.000Z' },
      { ...secondRun, categoryId: 'health', endsAt: '2026-11-16T23:15:00.000Z' },
      { ...thirdRun, categoryId: 'health', endsAt: '2026-11-23T23:15:00.000Z' },
      familyCall,
    ]);
  });

  test('deleting removes the occurrences the scope covers', () => {
    const deletedIds = (scope: 'this' | 'following' | 'all') =>
      applyEventChange(seriesRecords, {
        kind: 'deleteOccurrences',
        eventId: secondRun.id,
        scope,
      }).map((shownRecord) => shownRecord.id);

    expect(deletedIds('this')).toEqual([morningRecord.id, firstRun.id, thirdRun.id, familyCall.id]);
    expect(deletedIds('following')).toEqual([morningRecord.id, firstRun.id, familyCall.id]);
    expect(deletedIds('all')).toEqual([morningRecord.id, familyCall.id]);
  });

  test('a scoped change to an unknown occurrence or a plain event leaves the list as it was', () => {
    for (const eventId of ['run:2026-12-01T22:00:00.000Z', morningRecord.id]) {
      expect(
        applyEventChange(seriesRecords, {
          kind: 'updateOccurrences',
          eventId,
          scope: 'all',
          eventChanges: { title: 'Nothing' },
        }),
      ).toBe(seriesRecords);
      expect(
        applyEventChange(seriesRecords, { kind: 'deleteOccurrences', eventId, scope: 'all' }),
      ).toBe(seriesRecords);
    }
  });
});
