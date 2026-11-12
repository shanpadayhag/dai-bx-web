import type { RepeatRule } from '@/core/repeat-rule';
import { addCalendarDays, formatInZone, partsInZone } from '@/core/zoned-time';

type GroupShows = {
  repeat: RepeatRule;
  windowStart: string | null;
  windowEnd: string | null;
};

type GroupUnchecks = {
  repeat: RepeatRule;
  time: string;
};

type GroupTimetable = {
  dueNow: boolean;
  dueUntil: string | null;
  nextShowsAt: string | null;
  lastUncheckAt: string | null;
  nextUncheckAt: string | null;
};

type GroupSchedule = {
  shows: GroupShows | null;
  unchecks: GroupUnchecks | null;
  timetable: GroupTimetable;
};

type GroupView = 'due' | 'all';

const ALWAYS_DUE_TIMETABLE: GroupTimetable = {
  dueNow: true,
  dueUntil: null,
  nextShowsAt: null,
  lastUncheckAt: null,
  nextUncheckAt: null,
};

const hasShowRuleEnded = (groupSchedule: GroupSchedule): boolean =>
  groupSchedule.shows !== null &&
  !groupSchedule.timetable.dueNow &&
  groupSchedule.timetable.nextShowsAt === null;

const describeNextShow = (nextShowsAt: string, now: Date, timeZone: string): string => {
  const nextShowMoment = new Date(nextShowsAt);
  const nextShowDate = partsInZone(nextShowMoment, timeZone).calendarDate;
  const todayDate = partsInZone(now, timeZone).calendarDate;
  const shownTime = formatInZone(nextShowMoment, timeZone, {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  if (nextShowDate === todayDate) return `Today ${shownTime}`;
  if (nextShowDate === addCalendarDays(todayDate, 1)) return `Tomorrow ${shownTime}`;
  if (nextShowDate < addCalendarDays(todayDate, 7)) {
    return `${formatInZone(nextShowMoment, timeZone, { weekday: 'short' })} ${shownTime}`;
  }
  return formatInZone(nextShowMoment, timeZone, { day: 'numeric', month: 'short' });
};

const describeGroupAvailability = (
  groupSchedule: GroupSchedule,
  now: Date,
  timeZone: string,
): string | null => {
  if (groupSchedule.timetable.dueNow) return null;
  if (hasShowRuleEnded(groupSchedule)) return 'Ended';
  const { nextShowsAt } = groupSchedule.timetable;
  return nextShowsAt === null ? null : `Next: ${describeNextShow(nextShowsAt, now, timeZone)}`;
};

export type { GroupSchedule, GroupShows, GroupTimetable, GroupUnchecks, GroupView };
export { ALWAYS_DUE_TIMETABLE, describeGroupAvailability, hasShowRuleEnded };
