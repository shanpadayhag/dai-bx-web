type RunningItemSourceKind = 'task' | 'card';

type RunningItem = {
  id: string;
  title: string;
  sourceKind: RunningItemSourceKind;
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

export type { RunningItemSourceKind };
export { checkInSinceMoment, formatElapsed };
export default RunningItem;
