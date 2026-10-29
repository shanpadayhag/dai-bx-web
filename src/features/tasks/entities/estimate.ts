export type EstimateParse =
  { kind: 'minutes'; minutes: number } | { kind: 'empty' } | { kind: 'invalid' };

export const MIN_ESTIMATE_MINUTES = 1;
export const MAX_ESTIMATE_MINUTES = 24 * 60;

const MINUTES_PER_HOUR = 60;
const ESTIMATE_PATTERN = /^(?:(\d+)h)?\s*(?:(\d+)m)?$/;
const PLAIN_MINUTES_PATTERN = /^\d+$/;

const readMinutes = (normalizedText: string): number | null => {
  if (PLAIN_MINUTES_PATTERN.test(normalizedText)) return Number(normalizedText);
  const estimateMatch = ESTIMATE_PATTERN.exec(normalizedText);
  if (estimateMatch === null) return null;
  const [, hourText, minuteText] = estimateMatch;
  if (hourText === undefined && minuteText === undefined) return null;
  return Number(hourText ?? 0) * MINUTES_PER_HOUR + Number(minuteText ?? 0);
};

export const parseEstimate = (estimateText: string): EstimateParse => {
  const normalizedText = estimateText.trim().toLowerCase();
  if (normalizedText === '') return { kind: 'empty' };
  const estimateMinutes = readMinutes(normalizedText);
  if (
    estimateMinutes === null ||
    estimateMinutes < MIN_ESTIMATE_MINUTES ||
    estimateMinutes > MAX_ESTIMATE_MINUTES
  ) {
    return { kind: 'invalid' };
  }
  return { kind: 'minutes', minutes: estimateMinutes };
};

export const formatEstimate = (estimateMinutes: number | null): string => {
  if (estimateMinutes === null) return '';
  const wholeHours = Math.floor(estimateMinutes / MINUTES_PER_HOUR);
  const leftoverMinutes = estimateMinutes % MINUTES_PER_HOUR;
  if (wholeHours === 0) return `${leftoverMinutes}m`;
  if (leftoverMinutes === 0) return `${wholeHours}h`;
  return `${wholeHours}h ${leftoverMinutes}m`;
};
