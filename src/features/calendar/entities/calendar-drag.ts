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

const momentAtMinute = (dayStart: Date, minuteOfDay: number): Date =>
  new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), 0, minuteOfDay);

const draftTimes = (dayStart: Date, anchorMinute: number, pointerMinute: number): EventTimes => {
  const firstMinute = snapMinute(Math.min(anchorMinute, pointerMinute));
  const lastMinute = snapMinute(Math.max(anchorMinute, pointerMinute));
  const endMinute = lastMinute === firstMinute ? firstMinute + CLICK_DRAFT_MINUTES : lastMinute;
  return {
    startsAt: momentAtMinute(dayStart, firstMinute),
    endsAt: momentAtMinute(dayStart, endMinute),
  };
};

const movedTimes = (eventTimes: EventTimes, minuteDelta: number, dayDelta: number): EventTimes => {
  const { startsAt } = eventTimes;
  const movedStart = new Date(
    startsAt.getFullYear(),
    startsAt.getMonth(),
    startsAt.getDate() + dayDelta,
    startsAt.getHours(),
    startsAt.getMinutes() + snapMinutes(minuteDelta),
  );
  const durationMillis = eventTimes.endsAt.getTime() - startsAt.getTime();
  return { startsAt: movedStart, endsAt: new Date(movedStart.getTime() + durationMillis) };
};

const resizedEnd = (startsAt: Date, dayStart: Date, pointerMinute: number): Date => {
  const pointedEnd = momentAtMinute(dayStart, snapMinute(pointerMinute));
  const earliestEnd = new Date(startsAt.getTime() + SNAP_MINUTES * MINUTE_MILLIS);
  return pointedEnd < earliestEnd ? earliestEnd : pointedEnd;
};

export type { EventTimes };
export { draftTimes, momentAtMinute, movedTimes, resizedEnd, snapMinute };
