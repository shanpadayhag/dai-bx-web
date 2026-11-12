import type { RepeatRule } from '@/core/repeat-rule';
import type { CardScheduleKind, ScheduleRunTiming } from '@/features/board/entities/card-schedule';

type ScheduleBlockRecord = {
  time: string | null;
  minutes: number;
  categoryId: string | null;
};

type CardScheduleRecord = {
  id: string;
  kind: CardScheduleKind;
  targetListId: string | null;
  targetListName: string | null;
  start: string;
  startsAt: string | null;
  timeZone: string;
  repeat: RepeatRule | null;
  block: ScheduleBlockRecord | null;
  paused: boolean;
  nextRunAt: string | null;
};

type CardSchedulesRecord = {
  schedules: CardScheduleRecord[];
};

type ScheduleRunRecord = {
  id: string;
  ranAt: string;
  how: ScheduleRunTiming;
  moved: boolean;
  trackedMinutes: number;
};

type NextMoveRecord = {
  at: string;
  listName: string;
};

export type { CardSchedulesRecord, NextMoveRecord, ScheduleBlockRecord, ScheduleRunRecord };
export default CardScheduleRecord;
