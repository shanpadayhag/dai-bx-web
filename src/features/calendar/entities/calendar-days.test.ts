import { expect, test } from 'vitest';
import {
  arrangeCalendarDays,
  calendarTitle,
  clockTextMinute,
  visibleDayStarts,
} from '@/features/calendar/entities/calendar-days';
import type CalendarEvent from '@/features/calendar/entities/calendar-event';

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

test('a week shows its seven days from Monday', () => {
  const dayStarts = visibleDayStarts('week', new Date(2026, 10, 5, 18));

  expect(dayStarts).toHaveLength(7);
  expect(dayStarts[0]).toEqual(new Date(2026, 10, 2));
  expect(dayStarts[6]).toEqual(new Date(2026, 10, 8));
});

test('a day shows just that day', () => {
  expect(visibleDayStarts('day', new Date(2026, 10, 5, 18))).toEqual([new Date(2026, 10, 5)]);
});

test('the title names the week or the day', () => {
  expect(calendarTitle('week', visibleDayStarts('week', new Date(2026, 10, 5)))).toBe(
    'November 2 – 8',
  );
  expect(calendarTitle('week', visibleDayStarts('week', new Date(2026, 10, 30)))).toBe(
    'November 30 – December 6',
  );
  expect(calendarTitle('day', [new Date(2026, 10, 5)])).toBe('Thursday, November 5');
});

test('an event across midnight lands on both days, and today is marked', () => {
  const calendarDays = arrangeCalendarDays(
    visibleDayStarts('week', new Date(2026, 10, 4)),
    [lateStudy],
    new Date(2026, 10, 4, 9),
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

test('the working-hours start is read as a minute of the day', () => {
  expect(clockTextMinute('16:30')).toBe(16 * 60 + 30);
  expect(clockTextMinute('25:00')).toBe(8 * 60);
  expect(clockTextMinute(undefined)).toBe(8 * 60);
});
