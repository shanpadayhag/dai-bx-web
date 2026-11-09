import { formatClockInZone } from '@/core/time-zone';
import type CalendarEvent from '@/features/calendar/entities/calendar-event';

const formatClock = (moment: Date, timeZone: string): string => formatClockInZone(moment, timeZone);

const formatMinuteOfDay = (minuteOfDay: number): string =>
  `${String(Math.floor(minuteOfDay / 60) % 24).padStart(2, '0')}:${String(minuteOfDay % 60).padStart(2, '0')}`;

const formatEventTimeRange = (calendarEvent: CalendarEvent, timeZone: string): string =>
  `${formatClock(calendarEvent.startsAt, timeZone)} – ${calendarEvent.endsAt === null ? 'now' : formatClock(calendarEvent.endsAt, timeZone)}`;

const formatDurationMinutes = (durationMinutes: number): string => {
  const wholeHours = Math.floor(durationMinutes / 60);
  const leftoverMinutes = durationMinutes % 60;
  if (wholeHours === 0) return `${leftoverMinutes} min`;
  return leftoverMinutes === 0 ? `${wholeHours} h` : `${wholeHours} h ${leftoverMinutes} min`;
};

const eventDurationMinutes = (calendarEvent: CalendarEvent, now: Date): number =>
  Math.round(((calendarEvent.endsAt ?? now).getTime() - calendarEvent.startsAt.getTime()) / 60_000);

export {
  eventDurationMinutes,
  formatClock,
  formatDurationMinutes,
  formatEventTimeRange,
  formatMinuteOfDay,
};
