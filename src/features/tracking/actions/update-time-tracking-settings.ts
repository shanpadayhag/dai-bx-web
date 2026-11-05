import AppError from '@/core/app-error';
import backendTimeTrackingSettingsSource from '@/features/tracking/data_sources/backend/time-tracking-settings-source';
import type TimeTrackingSettings from '@/features/tracking/entities/time-tracking-settings';
import type { TimeTrackingChanges } from '@/features/tracking/entities/time-tracking-settings';

const CHECK_IN_MINUTES_MIN = 5;
const CHECK_IN_MINUTES_MAX = 240;
const CLOCK_TEXT_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

type UpdateTimeTrackingSettingsParams = {
  timeTrackingChanges: TimeTrackingChanges;
};

export const readCheckInMinutes = (minutesText: string): number => {
  const trimmedText = minutesText.trim();
  const checkInMinutes = Number(trimmedText);
  if (
    trimmedText === '' ||
    !Number.isInteger(checkInMinutes) ||
    checkInMinutes < CHECK_IN_MINUTES_MIN ||
    checkInMinutes > CHECK_IN_MINUTES_MAX
  ) {
    throw new AppError('Check the minutes', 'Check-ins are 5 to 240 minutes apart.');
  }
  return checkInMinutes;
};

export const readClockTime = (clockText: string): string => {
  if (!CLOCK_TEXT_PATTERN.test(clockText)) {
    throw new AppError('Pick a time', 'Working hours need a time, like 09:30.');
  }
  return clockText;
};

const updateTimeTrackingSettings = (
  params: UpdateTimeTrackingSettingsParams,
): Promise<TimeTrackingSettings> =>
  backendTimeTrackingSettingsSource.update(params.timeTrackingChanges);

export default updateTimeTrackingSettings;
