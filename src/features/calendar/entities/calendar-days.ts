import { calendarDateTitle, partsInZone } from '@/core/zoned-time';
import type { CalendarView } from '@/features/calendar/entities/calendar-address';
import type CalendarEvent from '@/features/calendar/entities/calendar-event';
import type CalendarRange from '@/features/calendar/entities/calendar-range';
import { dayRange, weekRange } from '@/features/calendar/entities/calendar-range';
import {
  layoutDay,
  splitAtMidnight,
  type DayLayoutEntry,
  type EventPiece,
} from '@/features/calendar/entities/day-layout';

type CalendarDay = {
  calendarDate: string;
  isToday: boolean;
  layoutEntries: DayLayoutEntry[];
};

const CLOCK_TEXT_PATTERN = /^(\d{2}):(\d{2})$/;
const FALLBACK_START_MINUTE = 8 * 60;

const shownRangeOf = (
  calendarView: CalendarView,
  anchorDate: string,
  timeZone: string,
): CalendarRange =>
  calendarView === 'week' ? weekRange(anchorDate, timeZone) : dayRange(anchorDate, timeZone);

const calendarTitle = (calendarView: CalendarView, calendarDates: readonly string[]): string => {
  const [firstDate] = calendarDates;
  const lastDate = calendarDates.at(-1);
  if (firstDate === undefined || lastDate === undefined) return '';
  if (calendarView === 'day') {
    return calendarDateTitle(firstDate, { weekday: 'long', month: 'long', day: 'numeric' }, 'en');
  }
  const monthDayTitle = (calendarDate: string) =>
    calendarDateTitle(calendarDate, { month: 'long', day: 'numeric' }, 'en');
  const lastDayLabel =
    firstDate.slice(0, 7) === lastDate.slice(0, 7)
      ? String(Number(lastDate.slice(8)))
      : monthDayTitle(lastDate);
  return `${monthDayTitle(firstDate)} – ${lastDayLabel}`;
};

const arrangeCalendarDays = (
  calendarDates: readonly string[],
  calendarEvents: readonly CalendarEvent[],
  now: Date,
  timeZone: string,
): CalendarDay[] => {
  const piecesByDate = new Map<string, EventPiece[]>();
  for (const calendarEvent of calendarEvents) {
    for (const eventPiece of splitAtMidnight(calendarEvent, now, timeZone)) {
      const dayPieces = piecesByDate.get(eventPiece.calendarDate) ?? [];
      dayPieces.push(eventPiece);
      piecesByDate.set(eventPiece.calendarDate, dayPieces);
    }
  }
  const todayDate = partsInZone(now, timeZone).calendarDate;
  return calendarDates.map((calendarDate) => ({
    calendarDate,
    isToday: calendarDate === todayDate,
    layoutEntries: layoutDay(piecesByDate.get(calendarDate) ?? []),
  }));
};

const clockTextMinute = (clockText: string | undefined): number => {
  const clockMatch = clockText === undefined ? null : CLOCK_TEXT_PATTERN.exec(clockText);
  if (clockMatch === null) return FALLBACK_START_MINUTE;
  const [hours, minutes] = clockMatch.slice(1).map(Number);
  if (hours === undefined || minutes === undefined || hours > 23 || minutes > 59) {
    return FALLBACK_START_MINUTE;
  }
  return hours * 60 + minutes;
};

export type { CalendarDay };
export { arrangeCalendarDays, calendarTitle, clockTextMinute, shownRangeOf };
