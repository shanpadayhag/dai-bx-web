import type RunningItem from '@/features/tracking/entities/running-item';
import type TimeTrackingSettings from '@/features/tracking/entities/time-tracking-settings';

const MINUTE_MILLIS = 60_000;

const checkInDueAt = (
  runningItem: RunningItem,
  timeTrackingSettings: TimeTrackingSettings,
): Date | null => {
  if (!timeTrackingSettings.checkInsEnabled) return null;
  if (runningItem.lastAnsweredAt !== null) {
    return new Date(
      runningItem.lastAnsweredAt.getTime() +
        timeTrackingSettings.checkInIntervalMinutes * MINUTE_MILLIS,
    );
  }
  const firstCheckInMinutes =
    runningItem.estimateMinutes ?? timeTrackingSettings.firstCheckInMinutes;
  return new Date(runningItem.startedAt.getTime() + firstCheckInMinutes * MINUTE_MILLIS);
};

const isCheckInDue = (
  runningItem: RunningItem,
  timeTrackingSettings: TimeTrackingSettings,
  now: Date,
): boolean => {
  const dueAt = checkInDueAt(runningItem, timeTrackingSettings);
  return dueAt !== null && dueAt <= now;
};

export { checkInDueAt, isCheckInDue };
