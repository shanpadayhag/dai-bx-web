import { WEEKDAYS_IN_ORDER, weekdayOf } from '@/core/repeat-rule';
import { addCalendarDays } from '@/core/zoned-time';

type CalendarRangeDays = 1 | 7;

type CalendarRange = {
  start: string;
  days: CalendarRangeDays;
  timeZone: string;
};

const dayRange = (calendarDate: string, timeZone: string): CalendarRange => ({
  start: calendarDate,
  days: 1,
  timeZone,
});

const weekRange = (calendarDate: string, timeZone: string): CalendarRange => ({
  start: addCalendarDays(calendarDate, -WEEKDAYS_IN_ORDER.indexOf(weekdayOf(calendarDate))),
  days: 7,
  timeZone,
});

const calendarDatesOf = (calendarRange: CalendarRange): string[] =>
  Array.from({ length: calendarRange.days }, (_, dayIndex) =>
    addCalendarDays(calendarRange.start, dayIndex),
  );

export type { CalendarRangeDays };
export { calendarDatesOf, dayRange, weekRange };
export default CalendarRange;
