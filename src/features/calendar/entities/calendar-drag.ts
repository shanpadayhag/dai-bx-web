import { instantInZone, partsInZone, addCalendarDays } from '@/core/zoned-time';
import { MINUTES_PER_DAY } from '@/features/calendar/entities/day-layout';

type EventTimes = {
  startsAt: Date;
  endsAt: Date;
};

const SNAP_MINUTES = 15;
const CLICK_DRAFT_MINUTES = 60;
const MINUTE_MILLIS = 60_000;

const snapMinutes = (minuteCount: number): number =>
  Math.round(minuteCount / SNAP_MINUTES) * SNAP_MINUTES;

const snapMinute = (minuteOfDay: number): number =>
  Math.min(MINUTES_PER_DAY, Math.max(0, snapMinutes(minuteOfDay)));

const draftTimes = (
  calendarDate: string,
  anchorMinute: number,
  pointerMinute: number,
  timeZone: string,
): EventTimes => {
  const firstMinute = snapMinute(Math.min(anchorMinute, pointerMinute));
  const lastMinute = snapMinute(Math.max(anchorMinute, pointerMinute));
  const endMinute = lastMinute === firstMinute ? firstMinute + CLICK_DRAFT_MINUTES : lastMinute;
  return {
    startsAt: instantInZone(calendarDate, firstMinute, timeZone),
    endsAt: instantInZone(calendarDate, endMinute, timeZone),
  };
};

const movedTimes = (
  eventTimes: EventTimes,
  minuteDelta: number,
  dayDelta: number,
  timeZone: string,
): EventTimes => {
  const startParts = partsInZone(eventTimes.startsAt, timeZone);
  const movedStart = instantInZone(
    addCalendarDays(startParts.calendarDate, dayDelta),
    startParts.minuteOfDay + snapMinutes(minuteDelta),
    timeZone,
  );
  const durationMillis = eventTimes.endsAt.getTime() - eventTimes.startsAt.getTime();
  return { startsAt: movedStart, endsAt: new Date(movedStart.getTime() + durationMillis) };
};

const resizedEnd = (
  startsAt: Date,
  calendarDate: string,
  pointerMinute: number,
  timeZone: string,
): Date => {
  const pointedEnd = instantInZone(calendarDate, snapMinute(pointerMinute), timeZone);
  const earliestEnd = new Date(startsAt.getTime() + SNAP_MINUTES * MINUTE_MILLIS);
  return pointedEnd < earliestEnd ? earliestEnd : pointedEnd;
};

export type { EventTimes };
export { draftTimes, movedTimes, resizedEnd, snapMinute };
