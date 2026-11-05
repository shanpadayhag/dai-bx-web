import { describe, expect, test } from 'vitest';
import { dayRange, weekRange } from '@/features/calendar/entities/calendar-range';

const HOUR_MILLIS = 60 * 60 * 1000;

const spanHours = (calendarRange: { from: Date; to: Date }) =>
  (calendarRange.to.getTime() - calendarRange.from.getTime()) / HOUR_MILLIS;

describe('weekRange', () => {
  test('runs from the Monday at midnight to the next Monday at midnight', () => {
    expect(weekRange(new Date(2026, 10, 4, 15, 30))).toEqual({
      from: new Date(2026, 10, 2),
      to: new Date(2026, 10, 9),
    });
  });

  test('a Sunday belongs to the week that started the Monday before', () => {
    expect(weekRange(new Date(2026, 10, 8, 23, 59)).from).toEqual(new Date(2026, 10, 2));
  });

  test('Monday at midnight starts its own week', () => {
    expect(weekRange(new Date(2026, 10, 9)).from).toEqual(new Date(2026, 10, 9));
  });

  test('a week with a clock change keeps local midnights and is an hour longer', () => {
    const clockChangeWeek = weekRange(new Date(2026, 9, 29, 12));

    expect(clockChangeWeek).toEqual({
      from: new Date(2026, 9, 26),
      to: new Date(2026, 10, 2),
    });
    expect(spanHours(clockChangeWeek)).toBe(7 * 24 + 1);
  });
});

describe('dayRange', () => {
  test('runs from midnight to the next midnight', () => {
    expect(dayRange(new Date(2026, 10, 5, 18, 2))).toEqual({
      from: new Date(2026, 10, 5),
      to: new Date(2026, 10, 6),
    });
  });

  test('the day the clocks go back lasts 25 hours', () => {
    expect(spanHours(dayRange(new Date(2026, 10, 1, 9)))).toBe(25);
  });
});
