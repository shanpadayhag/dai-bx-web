const isSameDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfDay = (d: Date): Date => new Date(d.getFullYear(), d.getMonth(), d.getDate());

const formatTime = (d: Date): string =>
  d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

export const formatAlarmTime = (firesAt: string, now: Date = new Date()): string => {
  const d = new Date(firesAt);
  if (Number.isNaN(d.getTime())) return '';

  const today = startOfDay(now);
  const target = startOfDay(d);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (isSameDay(d, now)) return formatTime(d);
  if (diffDays === 1) return `Tomorrow ${formatTime(d)}`;
  if (diffDays === -1) return `Yesterday ${formatTime(d)}`;
  if (diffDays > 1 && diffDays < 7) {
    const weekday = d.toLocaleDateString(undefined, { weekday: 'short' });
    return `${weekday} ${formatTime(d)}`;
  }
  const date = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${date} ${formatTime(d)}`;
};

const pad = (n: number): string => String(n).padStart(2, '0');

export const toTimeInputValue = (firesAt: string | null): string => {
  if (!firesAt) return '';
  const d = new Date(firesAt);
  if (Number.isNaN(d.getTime())) return '';
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/**
 * Resolves an (hour, minute) pair into the ISO timestamp of its next occurrence:
 * later today if the time hasn't passed, otherwise tomorrow.
 */
export const nextOccurrenceIso = (
  hour: number,
  minute: number,
  now: Date = new Date(),
): string => {
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0);
  if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
  return target.toISOString();
};

export const parseHourMinute = (firesAt: string | null): { hour: number; minute: number } | null => {
  if (!firesAt) return null;
  const d = new Date(firesAt);
  if (Number.isNaN(d.getTime())) return null;
  return { hour: d.getHours(), minute: d.getMinutes() };
};

export const isTomorrow = (firesAt: string, now: Date = new Date()): boolean => {
  const d = new Date(firesAt);
  if (Number.isNaN(d.getTime())) return false;
  const dayDelta = Math.round(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86_400_000,
  );
  return dayDelta === 1;
};
