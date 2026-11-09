import {
  applyEventChange,
  type LocalEventChange,
} from '@/features/calendar/entities/calendar-event-changes';
import type CalendarEventRecord from '@/features/calendar/entities/calendar-event-record';
import type CalendarRange from '@/features/calendar/entities/calendar-range';

type PendingEventWrite = {
  writeId: number;
  localChange: LocalEventChange;
};

type OptimisticCalendar = {
  range: CalendarRange;
  confirmedRecords: readonly CalendarEventRecord[];
  pendingWrites: readonly PendingEventWrite[];
};

const startOptimisticCalendar = (
  range: CalendarRange,
  confirmedRecords: readonly CalendarEventRecord[],
): OptimisticCalendar => ({ range, confirmedRecords, pendingWrites: [] });

const startEventWrite = (
  optimisticCalendar: OptimisticCalendar,
  writeId: number,
  localChange: LocalEventChange,
): OptimisticCalendar => ({
  ...optimisticCalendar,
  pendingWrites: [...optimisticCalendar.pendingWrites, { writeId, localChange }],
});

const withoutWrite = (pendingWrites: readonly PendingEventWrite[], writeId: number) =>
  pendingWrites.filter((pendingWrite) => pendingWrite.writeId !== writeId);

const takeConfirmedChange = (
  optimisticCalendar: OptimisticCalendar,
  answeredChange: LocalEventChange,
): OptimisticCalendar => ({
  ...optimisticCalendar,
  confirmedRecords: applyEventChange(optimisticCalendar.confirmedRecords, answeredChange),
});

const confirmEventWrite = (
  optimisticCalendar: OptimisticCalendar,
  writeId: number,
  answeredChange: LocalEventChange,
): OptimisticCalendar => ({
  ...takeConfirmedChange(optimisticCalendar, answeredChange),
  pendingWrites: withoutWrite(optimisticCalendar.pendingWrites, writeId),
});

const failEventWrite = (
  optimisticCalendar: OptimisticCalendar,
  writeId: number,
): OptimisticCalendar => ({
  ...optimisticCalendar,
  pendingWrites: withoutWrite(optimisticCalendar.pendingWrites, writeId),
});

const isSameRange = (firstRange: CalendarRange, secondRange: CalendarRange): boolean =>
  firstRange.start === secondRange.start &&
  firstRange.days === secondRange.days &&
  firstRange.timeZone === secondRange.timeZone;

const confirmEventWriteWithRecords = (
  optimisticCalendar: OptimisticCalendar,
  writeId: number,
  reloadedRange: CalendarRange,
  reloadedRecords: readonly CalendarEventRecord[],
): OptimisticCalendar => ({
  ...optimisticCalendar,
  confirmedRecords: isSameRange(optimisticCalendar.range, reloadedRange)
    ? reloadedRecords
    : optimisticCalendar.confirmedRecords,
  pendingWrites: withoutWrite(optimisticCalendar.pendingWrites, writeId),
});

const visibleEventRecords = (
  optimisticCalendar: OptimisticCalendar,
): readonly CalendarEventRecord[] =>
  optimisticCalendar.pendingWrites.reduce(
    (currentRecords, pendingWrite) => applyEventChange(currentRecords, pendingWrite.localChange),
    optimisticCalendar.confirmedRecords,
  );

export type { OptimisticCalendar };
export {
  confirmEventWrite,
  confirmEventWriteWithRecords,
  failEventWrite,
  startEventWrite,
  startOptimisticCalendar,
  takeConfirmedChange,
  visibleEventRecords,
};
