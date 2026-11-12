import type { RepeatRule } from '@/core/repeat-rule';
import { calendarDateTitle, formatInZone } from '@/core/zoned-time';
import type CardScheduleRecord from '@/features/board/entities/card-schedule-record';
import type { ScheduleRunRecord } from '@/features/board/entities/card-schedule-record';

type CardScheduleKind = 'once' | 'repeating';

type ScheduleRunTiming = 'onTime' | 'late' | 'byHand';

type ScheduleRun = {
  id: string;
  ranAt: Date;
  timing: ScheduleRunTiming;
  isMoved: boolean;
  trackedMinutes: number;
};

type CalendarBlock = {
  startTime: string | null;
  lengthMinutes: number;
  categoryId: string | null;
};

type CardSchedule = {
  id: string;
  kind: CardScheduleKind;
  targetListId: string | null;
  targetListName: string | null;
  localStart: string;
  repeatRule: RepeatRule | null;
  timeZone: string;
  calendarBlock: CalendarBlock | null;
  nextRunAt: Date | null;
  isPaused: boolean;
};

const WEEKDAY_LABEL_MILLIS = 6 * 86_400_000;

const cardScheduleFromRecord = (scheduleRecord: CardScheduleRecord): CardSchedule => ({
  id: scheduleRecord.id,
  kind: scheduleRecord.kind,
  targetListId: scheduleRecord.targetListId,
  targetListName: scheduleRecord.targetListName,
  localStart: scheduleRecord.start,
  repeatRule: scheduleRecord.repeat,
  timeZone: scheduleRecord.timeZone,
  calendarBlock:
    scheduleRecord.block === null
      ? null
      : {
          startTime: scheduleRecord.block.time,
          lengthMinutes: scheduleRecord.block.minutes,
          categoryId: scheduleRecord.block.categoryId,
        },
  nextRunAt: scheduleRecord.nextRunAt === null ? null : new Date(scheduleRecord.nextRunAt),
  isPaused: scheduleRecord.paused,
});

const scheduleRunFromRecord = (runRecord: ScheduleRunRecord): ScheduleRun => ({
  id: runRecord.id,
  ranAt: new Date(runRecord.ranAt),
  timing: runRecord.how,
  isMoved: runRecord.moved,
  trackedMinutes: runRecord.trackedMinutes,
});

const formatClock = (moment: Date, timeZone: string): string =>
  formatInZone(moment, timeZone, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });

const formatScheduleMoment = (moment: Date, now: Date, timeZone: string): string => {
  const millisAhead = moment.getTime() - now.getTime();
  const dayText = formatInZone(
    moment,
    timeZone,
    millisAhead >= 0 && millisAhead < WEEKDAY_LABEL_MILLIS
      ? { weekday: 'short' }
      : { day: 'numeric', month: 'short' },
  );
  return `${dayText} ${formatClock(moment, timeZone)}`;
};

const formatScheduleDay = (moment: Date, timeZone: string): string =>
  formatInZone(moment, timeZone, { weekday: 'short', day: 'numeric', month: 'short' });

const formatLocalStartDay = (localStart: string): string =>
  calendarDateTitle(localStart.slice(0, 10), { weekday: 'short', day: 'numeric', month: 'short' });

const localStartClock = (localStart: string): string => localStart.slice(11, 16);

const formatMinutesLength = (lengthMinutes: number): string => {
  const hours = Math.floor(lengthMinutes / 60);
  const minutes = lengthMinutes % 60;
  if (hours === 0) return `${minutes}m`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
};

const formatTrackedMinutes = (trackedMinutes: number): string =>
  trackedMinutes === 0 ? 'nothing tracked' : `${formatMinutesLength(trackedMinutes)} tracked`;

export type { CalendarBlock, CardScheduleKind, ScheduleRun, ScheduleRunTiming };
export {
  cardScheduleFromRecord,
  formatClock,
  formatLocalStartDay,
  formatMinutesLength,
  formatScheduleDay,
  formatScheduleMoment,
  formatTrackedMinutes,
  localStartClock,
  scheduleRunFromRecord,
};
export default CardSchedule;
