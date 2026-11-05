import { describe, expect, test } from 'vitest';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
import {
  confirmEventWrite,
  failEventWrite,
  startEventWrite,
  startOptimisticCalendar,
  visibleEventRecords,
} from '@/features/calendar/entities/optimistic-calendar';

const weekRange = { from: new Date(2026, 10, 2), to: new Date(2026, 10, 9) };

const plannedRecord: CalendarEventRecord = {
  id: 'event-1',
  kind: 'planned',
  title: 'Plan the week',
  categoryId: null,
  startsAt: '2026-11-05T16:00:00.000Z',
  endsAt: '2026-11-05T17:00:00.000Z',
  finishedAt: null,
  lastAnsweredAt: null,
  source: null,
};

describe('optimistic calendar', () => {
  const loadedCalendar = startOptimisticCalendar(weekRange, [plannedRecord]);

  test('shows a pending change before the server answers', () => {
    const pendingCalendar = startEventWrite(loadedCalendar, 1, {
      kind: 'update',
      eventId: 'event-1',
      eventChanges: { title: 'Plan the month' },
    });

    expect(visibleEventRecords(pendingCalendar)).toEqual([
      { ...plannedRecord, title: 'Plan the month' },
    ]);
  });

  test("keeps the server's answer once confirmed", () => {
    const pendingCalendar = startEventWrite(loadedCalendar, 1, {
      kind: 'update',
      eventId: 'event-1',
      eventChanges: { title: 'Plan the month' },
    });
    const answeredRecord = { ...plannedRecord, title: 'Plan the month' };

    const confirmedCalendar = confirmEventWrite(pendingCalendar, 1, {
      kind: 'replace',
      eventRecord: answeredRecord,
    });

    expect(confirmedCalendar.pendingWrites).toEqual([]);
    expect(visibleEventRecords(confirmedCalendar)).toEqual([answeredRecord]);
  });

  test('a created event swaps its stand-in for the saved one', () => {
    const standInRecord = { ...plannedRecord, id: 'pending-event-1' };
    const savedRecord = { ...plannedRecord, id: 'event-2' };
    const pendingCalendar = startEventWrite(loadedCalendar, 1, {
      kind: 'add',
      eventRecord: standInRecord,
    });

    expect(visibleEventRecords(pendingCalendar)).toEqual([plannedRecord, standInRecord]);
    expect(
      visibleEventRecords(
        confirmEventWrite(pendingCalendar, 1, { kind: 'add', eventRecord: savedRecord }),
      ),
    ).toEqual([plannedRecord, savedRecord]);
  });

  test('a failed write puts the event back as it was', () => {
    const pendingCalendar = startEventWrite(loadedCalendar, 1, {
      kind: 'delete',
      eventId: 'event-1',
    });

    expect(visibleEventRecords(pendingCalendar)).toEqual([]);
    expect(visibleEventRecords(failEventWrite(pendingCalendar, 1))).toEqual([plannedRecord]);
  });
});
