import type { RepeatRule } from '@/core/repeat-rule';

type CardScheduleKind = 'once' | 'repeating';

type ScheduleRunTiming = 'onTime' | 'late' | 'byHand';

type ScheduleRun = {
  id: string;
  ranAt: Date;
  timing: ScheduleRunTiming;
  movedToListName: string;
  trackedMinutes: number;
};

type CalendarBlock = {
  lengthMinutes: number;
  categoryId: string | null;
};

type CardSchedule = {
  id: string;
  kind: CardScheduleKind;
  targetListId: string | null;
  targetListName: string | null;
  firstAt: Date;
  repeatRule: RepeatRule | null;
  timeZone: string;
  calendarBlock: CalendarBlock | null;
  nextRunAt: Date | null;
  isPaused: boolean;
  runs: readonly ScheduleRun[];
};

type ScheduledCardMove = {
  cardId: string;
  targetListName: string;
  at: Date;
};

const DAY_MILLIS = 86_400_000;

const formatClock = (moment: Date): string =>
  moment.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

const formatScheduleMoment = (moment: Date, now: Date): string => {
  const isWithinAWeek =
    moment.getTime() >= now.getTime() && moment.getTime() - now.getTime() < 6 * DAY_MILLIS;
  const dayText = isWithinAWeek
    ? moment.toLocaleDateString('en-GB', { weekday: 'short' })
    : moment.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${dayText} ${formatClock(moment)}`;
};

const formatMinutesLength = (lengthMinutes: number): string => {
  const hours = Math.floor(lengthMinutes / 60);
  const minutes = lengthMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
};

const formatTrackedMinutes = (trackedMinutes: number): string =>
  trackedMinutes === 0 ? 'nothing tracked' : `${formatMinutesLength(trackedMinutes)} tracked`;

const formatScheduleDay = (moment: Date): string =>
  moment.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

export type { CalendarBlock, CardScheduleKind, ScheduleRun, ScheduleRunTiming, ScheduledCardMove };
export {
  formatClock,
  formatMinutesLength,
  formatScheduleDay,
  formatScheduleMoment,
  formatTrackedMinutes,
};
export default CardSchedule;
