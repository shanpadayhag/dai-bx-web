import { expect, test } from 'vitest';
import {
  dayStartIn,
  formatTodayTitle,
  greetingFor,
  nextMidnightIn,
  todayDateIn,
} from '@/features/today/entities/today-day';

test('greets by the hour of the day', () => {
  expect([0, 4, 5, 11, 12, 17, 18, 23].map(greetingFor)).toEqual([
    'Good evening',
    'Good evening',
    'Good morning',
    'Good morning',
    'Good afternoon',
    'Good afternoon',
    'Good evening',
    'Good evening',
  ]);
});

test('works the day and its next midnight out in the calendar zone', () => {
  const now = new Date('2026-11-21T20:30:00.000Z');

  expect(todayDateIn(now, 'Asia/Manila')).toBe('2026-11-22');
  expect(todayDateIn(now, 'America/Los_Angeles')).toBe('2026-11-21');
  expect(dayStartIn('2026-11-22', 'Asia/Manila').toISOString()).toBe('2026-11-21T16:00:00.000Z');
  expect(nextMidnightIn(now, 'Asia/Manila').toISOString()).toBe('2026-11-22T16:00:00.000Z');
});

test('titles the day with the weekday and date', () => {
  expect(formatTodayTitle('2026-11-21')).toBe('Saturday, November 21');
});
