import { dateOrNull } from '@/features/calendar/entities/calendar-event-record';
import type RunningItemRecord from '@/features/tracking/entities/running-item-record';

type RunningItemSourceKind = 'task' | 'card';

type RunningItem = {
  id: string;
  title: string;
  sourceKind: RunningItemSourceKind;
  sourceId: string;
  sourceName: string;
  startedAt: Date;
  lastAnsweredAt: Date | null;
  estimateMinutes: number | null;
};

const formatElapsed = (startedAt: Date, now: Date): string => {
  const elapsedSeconds = Math.max(0, Math.floor((now.getTime() - startedAt.getTime()) / 1000));
  const elapsedHours = Math.floor(elapsedSeconds / 3600);
  const elapsedMinutes = Math.floor((elapsedSeconds % 3600) / 60);
  const leftoverSeconds = elapsedSeconds % 60;
  return `${elapsedHours}:${String(elapsedMinutes).padStart(2, '0')}:${String(leftoverSeconds).padStart(2, '0')}`;
};

const checkInSinceMoment = (runningItem: RunningItem): Date =>
  runningItem.lastAnsweredAt ?? runningItem.startedAt;

const runningItemFromRecord = (runningItemRecord: RunningItemRecord): RunningItem => ({
  id: runningItemRecord.id,
  title: runningItemRecord.title,
  sourceKind: runningItemRecord.source.kind,
  sourceId: runningItemRecord.source.id,
  sourceName: runningItemRecord.sourceName,
  startedAt: new Date(runningItemRecord.startsAt),
  lastAnsweredAt: dateOrNull(runningItemRecord.lastAnsweredAt),
  estimateMinutes: runningItemRecord.estimateMinutes,
});

export type { RunningItemSourceKind };
export { checkInSinceMoment, formatElapsed, runningItemFromRecord };
export default RunningItem;
