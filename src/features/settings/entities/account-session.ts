export type AccountSession = {
  id: string;
  createdAt: string;
  lastSeenAt: string;
  userAgent: string | null;
  isCurrent: boolean;
};

const browserPatterns: readonly [RegExp, string][] = [
  [/Edg\//, 'Edge'],
  [/OPR\//, 'Opera'],
  [/Firefox\//, 'Firefox'],
  [/Chrome\//, 'Chrome'],
  [/Safari\//, 'Safari'],
];

const systemPatterns: readonly [RegExp, string][] = [
  [/iPhone|iPad/, 'iOS'],
  [/Android/, 'Android'],
  [/Mac OS X|Macintosh/, 'macOS'],
  [/Windows/, 'Windows'],
  [/Linux/, 'Linux'],
];

const findLabel = (userAgent: string, labelPatterns: readonly [RegExp, string][]) =>
  labelPatterns.find(([labelPattern]) => labelPattern.test(userAgent))?.[1] ?? null;

export const describeSessionDevice = (userAgent: string | null) => {
  if (userAgent === null) return 'Unknown device';
  const browserLabel = findLabel(userAgent, browserPatterns);
  const systemLabel = findLabel(userAgent, systemPatterns);
  if (browserLabel !== null && systemLabel !== null) return `${browserLabel} on ${systemLabel}`;
  return browserLabel ?? systemLabel ?? 'Unknown device';
};

const relativeTimeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
const SECONDS_PER_MINUTE = 60;
const SECONDS_PER_HOUR = 60 * SECONDS_PER_MINUTE;
const SECONDS_PER_DAY = 24 * SECONDS_PER_HOUR;

export const describeLastActive = (lastSeenAt: string, currentTime: Date) => {
  const elapsedSeconds = Math.max(
    0,
    Math.round((currentTime.getTime() - new Date(lastSeenAt).getTime()) / 1000),
  );
  if (elapsedSeconds < 2 * SECONDS_PER_MINUTE) return 'Active now';
  if (elapsedSeconds < SECONDS_PER_HOUR) {
    return `Active ${relativeTimeFormat.format(-Math.round(elapsedSeconds / SECONDS_PER_MINUTE), 'minute')}`;
  }
  if (elapsedSeconds < SECONDS_PER_DAY) {
    return `Active ${relativeTimeFormat.format(-Math.round(elapsedSeconds / SECONDS_PER_HOUR), 'hour')}`;
  }
  return `Active ${relativeTimeFormat.format(-Math.round(elapsedSeconds / SECONDS_PER_DAY), 'day')}`;
};
