import { describe, expect, test } from 'vitest';
import {
  cardScheduleFromRecord,
  formatLocalStartDay,
  formatScheduleDay,
  formatScheduleMoment,
  localStartClock,
  scheduleRunFromRecord,
} from '@/features/board/entities/card-schedule';

describe('cardScheduleFromRecord', () => {
  test('keeps the local start and reads the next run as a date', () => {
    expect(
      cardScheduleFromRecord({
        id: 'schedule-1',
        kind: 'repeating',
        targetListId: 'list-1',
        targetListName: 'To Do',
        start: '2026-11-09T18:00',
        startsAt: '2026-11-09T10:00:00.000Z',
        timeZone: 'Asia/Manila',
        repeat: { frequency: 'weekly', interval: 1, weekdays: ['mon'], ends: { never: true } },
        block: { time: null, minutes: 60, categoryId: 'category-1' },
        paused: false,
        nextRunAt: '2026-11-16T10:00:00.000Z',
      }),
    ).toEqual({
      id: 'schedule-1',
      kind: 'repeating',
      targetListId: 'list-1',
      targetListName: 'To Do',
      localStart: '2026-11-09T18:00',
      repeatRule: { frequency: 'weekly', interval: 1, weekdays: ['mon'], ends: { never: true } },
      timeZone: 'Asia/Manila',
      calendarBlock: { startTime: null, lengthMinutes: 60, categoryId: 'category-1' },
      nextRunAt: new Date('2026-11-16T10:00:00.000Z'),
      isPaused: false,
    });
  });
});

describe('scheduleRunFromRecord', () => {
  test('reads the run time as a date', () => {
    expect(
      scheduleRunFromRecord({
        id: 'run-1',
        ranAt: '2026-11-09T10:01:00.000Z',
        how: 'late',
        moved: false,
        trackedMinutes: 25,
      }),
    ).toEqual({
      id: 'run-1',
      ranAt: new Date('2026-11-09T10:01:00.000Z'),
      timing: 'late',
      isMoved: false,
      trackedMinutes: 25,
    });
  });
});

describe('schedule times', () => {
  const now = new Date('2026-11-08T12:00:00Z');

  test('a moment this week names its weekday in the zone', () => {
    expect(formatScheduleMoment(new Date('2026-11-09T10:00:00Z'), now, 'Asia/Manila')).toBe(
      'Mon 18:00',
    );
  });

  test('a run day reads in the zone, not the device', () => {
    expect(formatScheduleDay(new Date('2026-11-09T20:00:00Z'), 'Asia/Manila')).toBe('Tue 10 Nov');
  });

  test('the local start reads as written', () => {
    expect(formatLocalStartDay('2026-11-25T18:00')).toBe('Wed 25 Nov');
    expect(localStartClock('2026-11-25T18:00')).toBe('18:00');
  });
});
