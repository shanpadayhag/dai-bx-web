import { describe, expect, test } from 'vitest';
import { calendarDatesOf, dayRange, weekRange } from '@/features/calendar/entities/calendar-range';

describe('weekRange', () => {
  test('starts on the Monday and lasts seven days in the given zone', () => {
    expect(weekRange('2026-11-04', 'Asia/Manila')).toEqual({
      start: '2026-11-02',
      days: 7,
      timeZone: 'Asia/Manila',
    });
  });

  test('a Sunday belongs to the week that started the Monday before', () => {
    expect(weekRange('2026-11-08', 'Asia/Manila').start).toBe('2026-11-02');
  });

  test('a Monday starts its own week', () => {
    expect(weekRange('2026-11-09', 'Asia/Manila').start).toBe('2026-11-09');
  });

  test('a week with a clock change is still seven calendar days', () => {
    const clockChangeWeek = weekRange('2026-10-29', 'Europe/London');

    expect(clockChangeWeek.start).toBe('2026-10-26');
    expect(calendarDatesOf(clockChangeWeek)).toEqual([
      '2026-10-26',
      '2026-10-27',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
      '2026-10-31',
      '2026-11-01',
    ]);
  });
});

describe('dayRange', () => {
  test('is the one day in the given zone', () => {
    expect(dayRange('2026-11-05', 'Europe/London')).toEqual({
      start: '2026-11-05',
      days: 1,
      timeZone: 'Europe/London',
    });
    expect(calendarDatesOf(dayRange('2026-11-05', 'Europe/London'))).toEqual(['2026-11-05']);
  });
});
