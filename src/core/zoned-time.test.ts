import { describe, expect, test } from 'vitest';
import {
  addCalendarDays,
  calendarDateTitle,
  formatInZone,
  instantInZone,
  partsInZone,
  wallClockInZone,
} from '@/core/zoned-time';

describe('partsInZone', () => {
  test('reads the date and clock of a moment in the given zone', () => {
    expect(partsInZone(new Date('2026-11-09T18:30:00Z'), 'Asia/Manila')).toEqual({
      calendarDate: '2026-11-10',
      weekday: 'tue',
      hour: 2,
      minute: 30,
      minuteOfDay: 150,
    });
  });

  test('keeps the same London clock across the week the clocks go back', () => {
    const londonWeek = [
      '2026-10-22T08:00:00Z',
      '2026-10-23T08:00:00Z',
      '2026-10-24T08:00:00Z',
      '2026-10-25T09:00:00Z',
      '2026-10-26T09:00:00Z',
      '2026-10-27T09:00:00Z',
      '2026-10-28T09:00:00Z',
    ].map((instantText) => partsInZone(new Date(instantText), 'Europe/London'));

    expect(londonWeek.map((londonParts) => londonParts.calendarDate)).toEqual([
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
    ]);
    expect(new Set(londonWeek.map((londonParts) => londonParts.minuteOfDay))).toEqual(
      new Set([9 * 60]),
    );
  });

  test('reads the hour that repeats on the night the clocks go back', () => {
    expect(partsInZone(new Date('2026-10-25T00:30:00Z'), 'Europe/London').minuteOfDay).toBe(90);
    expect(partsInZone(new Date('2026-10-25T01:30:00Z'), 'Europe/London').minuteOfDay).toBe(90);
  });

  test('midnight is minute zero, not hour 24', () => {
    expect(partsInZone(new Date('2026-11-09T16:00:00Z'), 'Asia/Manila')).toMatchObject({
      calendarDate: '2026-11-10',
      hour: 0,
      minuteOfDay: 0,
    });
  });
});

describe('formatInZone', () => {
  test('formats a moment with the given options in the zone', () => {
    expect(
      formatInZone(new Date('2026-11-09T10:00:00Z'), 'America/New_York', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }),
    ).toBe('Mon 05:00');
  });
});

describe('wallClockInZone', () => {
  test('writes the local date and time the API reads', () => {
    expect(wallClockInZone(new Date('2026-07-01T17:05:00Z'), 'Europe/London')).toBe(
      '2026-07-01T18:05',
    );
  });
});

describe('addCalendarDays', () => {
  test('steps across month and year ends', () => {
    expect(addCalendarDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addCalendarDays('2026-03-01', -1)).toBe('2026-02-28');
  });

  test('ignores clock changes', () => {
    expect(addCalendarDays('2026-10-25', 1)).toBe('2026-10-26');
  });
});

describe('instantInZone', () => {
  test('finds the moment a date and minute happen in the zone', () => {
    expect(instantInZone('2026-11-09', 18 * 60, 'Asia/Manila')).toEqual(
      new Date('2026-11-09T10:00:00Z'),
    );
  });

  test('follows the zone across daylight saving', () => {
    expect(instantInZone('2026-07-01', 9 * 60, 'Europe/London')).toEqual(
      new Date('2026-07-01T08:00:00Z'),
    );
    expect(instantInZone('2026-12-01', 9 * 60, 'Europe/London')).toEqual(
      new Date('2026-12-01T09:00:00Z'),
    );
  });

  test('minutes past the end of the day roll into the next days', () => {
    expect(instantInZone('2026-11-09', 24 * 60 + 30, 'Asia/Manila')).toEqual(
      new Date('2026-11-09T16:30:00Z'),
    );
  });

  test('round-trips with wallClockInZone', () => {
    const moment = instantInZone('2026-10-24', 23 * 60 + 45, 'America/New_York');
    expect(wallClockInZone(moment, 'America/New_York')).toBe('2026-10-24T23:45');
  });
});

describe('calendarDateTitle', () => {
  test('formats a calendar date without moving it to another day', () => {
    expect(calendarDateTitle('2026-11-09', { weekday: 'short', day: 'numeric' })).toBe('Mon 9');
  });
});
