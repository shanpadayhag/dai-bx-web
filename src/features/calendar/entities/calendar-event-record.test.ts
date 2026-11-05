import { describe, expect, test } from 'vitest';
import type { Category } from '@/core/category';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
import { calendarEventFromRecord } from '@/features/calendar/entities/calendar-event-record';

const focusCategory: Category = { id: 'focus', name: 'Focus', color: '#5b7fa6' };
const categoriesById = new Map([[focusCategory.id, focusCategory]]);

const trackedRecord: CalendarEventRecord = {
  id: 'event-1',
  kind: 'tracked',
  title: 'Write the changelog',
  categoryId: 'focus',
  startsAt: '2026-11-05T01:00:00.000Z',
  endsAt: '2026-11-05T02:30:00.000Z',
  finishedAt: '2026-11-05T02:45:00.000Z',
  lastAnsweredAt: '2026-11-05T02:30:00.000Z',
  source: { kind: 'task', id: 'task-1', groupId: 'group-1' },
};

describe('calendarEventFromRecord', () => {
  test('reads the times as dates and finds the category', () => {
    expect(calendarEventFromRecord(trackedRecord, categoriesById)).toEqual({
      id: 'event-1',
      kind: 'tracked',
      title: 'Write the changelog',
      category: focusCategory,
      startsAt: new Date('2026-11-05T01:00:00.000Z'),
      endsAt: new Date('2026-11-05T02:30:00.000Z'),
      finishedAt: new Date('2026-11-05T02:45:00.000Z'),
      source: { kind: 'task' },
    });
  });

  test('a running event has no end, and an unknown category shows as none', () => {
    const runningEvent = calendarEventFromRecord(
      { ...trackedRecord, categoryId: 'deleted', endsAt: null, finishedAt: null, source: null },
      categoriesById,
    );

    expect(runningEvent.category).toBeNull();
    expect(runningEvent.endsAt).toBeNull();
    expect(runningEvent.finishedAt).toBeNull();
    expect(runningEvent.source).toBeNull();
  });
});
