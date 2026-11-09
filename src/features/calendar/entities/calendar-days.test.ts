import { expect, test } from 'vitest';
import {
  arrangeCalendarDays,
  calendarTitle,
  clockTextMinute,
  shownRangeOf,
} from '@/features/calendar/entities/calendar-days';
import type CalendarEvent from '@/features/calendar/entities/calendar-event';
import { calendarDatesOf } from '@/features/calendar/entities/calendar-range';

const DEVICE_ZONE = 'America/Los_Angeles';

const lateStudy: CalendarEvent = {
  id: 'event-late',
  kind: 'tracked',
  title: 'Late study',
  category: null,
  startsAt: new Date(2026, 10, 3, 23),
  endsAt: new Date(2026, 10, 4, 1),
  finishedAt: null,
  source: null,
};

const shownDates = (calendarView: 'week' | 'day', anchorDate: string, timeZone = DEVICE_ZONE) =>
  calendarDatesOf(shownRangeOf(calendarView, anchorDate, timeZone));

test('a week shows its seven days from Monday', () => {
  const weekDates = shownDates('week', '2026-11-05');

  expect(weekDates).toHaveLength(7);
  expect(weekDates[0]).toBe('2026-11-02');
  expect(weekDates[6]).toBe('2026-11-08');
});

test('a day shows just that day', () => {
  expect(shownDates('day', '2026-11-05')).toEqual(['2026-11-05']);
});

test('the title names the week or the day', () => {
  expect(calendarTitle('week', shownDates('week', '2026-11-05'))).toBe('November 2 – 8');
  expect(calendarTitle('week', shownDates('week', '2026-11-30'))).toBe('November 30 – December 6');
  expect(calendarTitle('day', ['2026-11-05'])).toBe('Thursday, November 5');
});

test('an event across midnight lands on both days, and today is marked', () => {
  const calendarDays = arrangeCalendarDays(
    shownDates('week', '2026-11-04'),
    [lateStudy],
    new Date(2026, 10, 4, 9),
    DEVICE_ZONE,
  );

  expect(calendarDays[1]?.layoutEntries).toHaveLength(1);
  expect(calendarDays[2]?.layoutEntries).toHaveLength(1);
  expect(calendarDays.map((calendarDay) => calendarDay.isToday)).toEqual([
    false,
    false,
    true,
    false,
    false,
    false,
    false,
  ]);
});

test('the days and today follow the calendar zone, not the device', () => {
  const calendarDays = arrangeCalendarDays(
    shownDates('week', '2026-11-04', 'Asia/Manila'),
    [lateStudy],
    new Date(2026, 10, 4, 9),
    'Asia/Manila',
  );

  expect(calendarDays.map((calendarDay) => calendarDay.layoutEntries.length)).toEqual([
    0, 0, 1, 0, 0, 0, 0,
  ]);
  expect(calendarDays.find((calendarDay) => calendarDay.isToday)?.calendarDate).toBe('2026-11-05');
});

test('the working-hours start is read as a minute of the day', () => {
  expect(clockTextMinute('16:30')).toBe(16 * 60 + 30);
  expect(clockTextMinute('25:00')).toBe(8 * 60);
  expect(clockTextMinute(undefined)).toBe(8 * 60);
});
