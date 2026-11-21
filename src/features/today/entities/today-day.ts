import { addCalendarDays, calendarDateTitle, instantInZone, partsInZone } from '@/core/zoned-time';

const MORNING_START_HOUR = 5;
const AFTERNOON_START_HOUR = 12;
const EVENING_START_HOUR = 18;

const greetingFor = (hour: number): string => {
  if (hour >= MORNING_START_HOUR && hour < AFTERNOON_START_HOUR) return 'Good morning';
  if (hour >= AFTERNOON_START_HOUR && hour < EVENING_START_HOUR) return 'Good afternoon';
  return 'Good evening';
};

const todayDateIn = (now: Date, timeZone: string): string =>
  partsInZone(now, timeZone).calendarDate;

const dayStartIn = (calendarDate: string, timeZone: string): Date =>
  instantInZone(calendarDate, 0, timeZone);

const nextMidnightIn = (now: Date, timeZone: string): Date =>
  dayStartIn(addCalendarDays(todayDateIn(now, timeZone), 1), timeZone);

const formatTodayTitle = (calendarDate: string): string =>
  calendarDateTitle(calendarDate, { weekday: 'long', month: 'long', day: 'numeric' }, 'en-US');

export { dayStartIn, formatTodayTitle, greetingFor, nextMidnightIn, todayDateIn };
