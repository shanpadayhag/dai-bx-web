import { weekdayOf, type Weekday } from '@/core/repeat-rule';

type ZonedParts = {
  calendarDate: string;
  weekday: Weekday;
  hour: number;
  minute: number;
  minuteOfDay: number;
};

const DAY_MILLIS = 86_400_000;
const MINUTE_MILLIS = 60_000;

const partsFormats = new Map<string, Intl.DateTimeFormat>();

const partsFormatOf = (timeZone: string): Intl.DateTimeFormat => {
  const knownFormat = partsFormats.get(timeZone);
  if (knownFormat !== undefined) return knownFormat;
  const partsFormat = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  partsFormats.set(timeZone, partsFormat);
  return partsFormat;
};

const partsInZone = (moment: Date, timeZone: string): ZonedParts => {
  const partValues = new Map(
    partsFormatOf(timeZone)
      .formatToParts(moment)
      .map((datePart) => [datePart.type, datePart.value]),
  );
  const calendarDate = `${partValues.get('year')}-${partValues.get('month')}-${partValues.get('day')}`;
  const hour = Number(partValues.get('hour')) % 24;
  const minute = Number(partValues.get('minute'));
  return {
    calendarDate,
    weekday: weekdayOf(calendarDate),
    hour,
    minute,
    minuteOfDay: hour * 60 + minute,
  };
};

const formatInZone = (
  moment: Date,
  timeZone: string,
  formatOptions: Intl.DateTimeFormatOptions,
): string => new Intl.DateTimeFormat('en-GB', { ...formatOptions, timeZone }).format(moment);

const wallClockInZone = (moment: Date, timeZone: string): string => {
  const zonedParts = partsInZone(moment, timeZone);
  return `${zonedParts.calendarDate}T${String(zonedParts.hour).padStart(2, '0')}:${String(zonedParts.minute).padStart(2, '0')}`;
};

const wallMillisOf = (calendarDate: string, minuteOfDay: number): number =>
  Date.parse(`${calendarDate}T00:00:00Z`) + minuteOfDay * MINUTE_MILLIS;

const zoneOffsetMillis = (instantMillis: number, timeZone: string): number => {
  const zonedParts = partsInZone(new Date(instantMillis), timeZone);
  return wallMillisOf(zonedParts.calendarDate, zonedParts.minuteOfDay) - instantMillis;
};

const instantInZone = (calendarDate: string, minuteOfDay: number, timeZone: string): Date => {
  const wallMillis = wallMillisOf(calendarDate, minuteOfDay);
  const firstGuess = wallMillis - zoneOffsetMillis(wallMillis, timeZone);
  return new Date(wallMillis - zoneOffsetMillis(firstGuess, timeZone));
};

const calendarDateTitle = (
  calendarDate: string,
  formatOptions: Intl.DateTimeFormatOptions,
  locale = 'en-GB',
): string =>
  new Intl.DateTimeFormat(locale, { ...formatOptions, timeZone: 'UTC' }).format(
    new Date(`${calendarDate}T00:00:00Z`),
  );

const addCalendarDays = (calendarDate: string, dayCount: number): string =>
  new Date(Date.parse(`${calendarDate}T00:00:00Z`) + dayCount * DAY_MILLIS)
    .toISOString()
    .slice(0, 10);

export type { ZonedParts };
export {
  addCalendarDays,
  calendarDateTitle,
  formatInZone,
  instantInZone,
  partsInZone,
  wallClockInZone,
};
