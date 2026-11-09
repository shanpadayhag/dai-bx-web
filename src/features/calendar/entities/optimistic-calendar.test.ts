import { describe, expect, test } from 'vitest';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
import type CalendarRange from '@/features/calendar/entities/calendar-range';
import {
  confirmEventWrite,
  confirmEventWriteWithRecords,
  failEventWrite,
  startEventWrite,
  startOptimisticCalendar,
  visibleEventRecords,
} from '@/features/calendar/entities/optimistic-calendar';

const weekRange: CalendarRange = { start: '2026-11-02', days: 7, timeZone: 'America/Los_Angeles' };

const plannedRecord: CalendarEventRecord = {
  id: 'event-1',
  kind: 'planned',
  title: 'Plan the week',
  categoryId: null,
  startsAt: '2026-11-05T16:00:00.000Z',
  endsAt: '2026-11-05T17:00:00.000Z',
  finishedAt: null,
  lastAnsweredAt: null,
  timeZone: null,
  series: null,
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

  test('a series write is confirmed by the reloaded range, unless another range is shown now', () => {
    const pendingCalendar = startEventWrite(loadedCalendar, 3, {
      kind: 'delete',
      eventId: plannedRecord.id,
    });
    const reloadedRecord = { ...plannedRecord, id: 'reloaded' };

    expect(confirmEventWriteWithRecords(pendingCalendar, 3, weekRange, [reloadedRecord])).toEqual({
      range: weekRange,
      confirmedRecords: [reloadedRecord],
      pendingWrites: [],
    });
    expect(
      confirmEventWriteWithRecords(pendingCalendar, 3, { ...weekRange, start: '2026-11-09' }, [
        reloadedRecord,
      ]),
    ).toEqual({ range: weekRange, confirmedRecords: [plannedRecord], pendingWrites: [] });
  });
});
