import type PushDevice from '@/features/notifications/entities/push-device';

const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

const relativeTimeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const addedDateFormat = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });

const describeReached = (lastDeliveredAt: string | null, currentTime: Date) => {
  if (lastDeliveredAt === null) return 'Not reached yet';
  const elapsedSeconds = Math.max(
    0,
    Math.round((currentTime.getTime() - new Date(lastDeliveredAt).getTime()) / 1000),
  );
  if (elapsedSeconds < 2 * SECONDS_PER_MINUTE) return 'Reached just now';
  if (elapsedSeconds < SECONDS_PER_HOUR) {
    return `Reached ${relativeTimeFormat.format(-Math.round(elapsedSeconds / SECONDS_PER_MINUTE), 'minute')}`;
  }
  if (elapsedSeconds < SECONDS_PER_DAY) {
    return `Reached ${relativeTimeFormat.format(-Math.round(elapsedSeconds / SECONDS_PER_HOUR), 'hour')}`;
  }
  return `Reached ${relativeTimeFormat.format(-Math.round(elapsedSeconds / SECONDS_PER_DAY), 'day')}`;
};

const describeDeviceReach = (pushDevice: PushDevice, currentTime: Date): string =>
  `Added ${addedDateFormat.format(new Date(pushDevice.createdAt))} · ${describeReached(pushDevice.lastDeliveredAt, currentTime)}`;

export default describeDeviceReach;
