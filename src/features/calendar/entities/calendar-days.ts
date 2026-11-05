import type { CalendarView } from '@/features/calendar/entities/calendar-address';
import type CalendarEvent from '@/features/calendar/entities/calendar-event';
import { dayRange, weekRange } from '@/features/calendar/entities/calendar-range';
import {
  layoutDay,
  splitAtMidnight,
  startOfLocalDay,
  type DayLayoutEntry,
  type EventPiece,
} from '@/features/calendar/entities/day-layout';

type CalendarDay = {
  dayStart: Date;
  isToday: boolean;
  layoutEntries: DayLayoutEntry[];
};

const CLOCK_TEXT_PATTERN = /^(\d{2}):(\d{2})$/;
const FALLBACK_START_MINUTE = 8 * 60;

const weekTitleFormat = new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric' });
const dayTitleFormat = new Intl.DateTimeFormat('en', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
});

const visibleDayStarts = (calendarView: CalendarView, anchorDay: Date): Date[] => {
  const shownRange = calendarView === 'week' ? weekRange(anchorDay) : dayRange(anchorDay);
  const dayStarts: Date[] = [];
  for (
    let dayStart = shownRange.from;
    dayStart < shownRange.to;
    dayStart = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate() + 1)
  ) {
    dayStarts.push(dayStart);
  }
  return dayStarts;
};

const calendarTitle = (calendarView: CalendarView, dayStarts: readonly Date[]): string => {
  const [firstDayStart] = dayStarts;
  const lastDayStart = dayStarts.at(-1);
  if (firstDayStart === undefined || lastDayStart === undefined) return '';
  if (calendarView === 'day') return dayTitleFormat.format(firstDayStart);
  const lastDayLabel =
    firstDayStart.getMonth() === lastDayStart.getMonth()
      ? String(lastDayStart.getDate())
      : weekTitleFormat.format(lastDayStart);
  return `${weekTitleFormat.format(firstDayStart)} – ${lastDayLabel}`;
};

const arrangeCalendarDays = (
  dayStarts: readonly Date[],
  calendarEvents: readonly CalendarEvent[],
  now: Date,
): CalendarDay[] => {
  const piecesByDayTime = new Map<number, EventPiece[]>();
  for (const calendarEvent of calendarEvents) {
    for (const eventPiece of splitAtMidnight(calendarEvent, now)) {
      const pieceDayTime = eventPiece.dayStart.getTime();
      const dayPieces = piecesByDayTime.get(pieceDayTime) ?? [];
      dayPieces.push(eventPiece);
      piecesByDayTime.set(pieceDayTime, dayPieces);
    }
  }
  const todayTime = startOfLocalDay(now).getTime();
  return dayStarts.map((dayStart) => ({
    dayStart,
    isToday: dayStart.getTime() === todayTime,
    layoutEntries: layoutDay(piecesByDayTime.get(dayStart.getTime()) ?? []),
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
export { arrangeCalendarDays, calendarTitle, clockTextMinute, visibleDayStarts };
