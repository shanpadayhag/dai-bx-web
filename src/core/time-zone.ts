const UTC_ZONE_NAME = 'UTC';

const deviceTimeZone = (): string => Intl.DateTimeFormat().resolvedOptions().timeZone;

const supportedTimeZoneNames = (): string[] =>
  typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];

const timeZoneNames = (keptZoneName: string): string[] => {
  const listedZoneNames = new Set([UTC_ZONE_NAME, ...supportedTimeZoneNames()]);
  listedZoneNames.add(keptZoneName);
  return [...listedZoneNames];
};

const timeZoneOffset = (timeZone: string, moment: Date): string => {
  const offsetText =
    new Intl.DateTimeFormat('en-GB', { timeZone, timeZoneName: 'shortOffset' })
      .formatToParts(moment)
      .find((datePart) => datePart.type === 'timeZoneName')?.value ?? 'GMT';
  return offsetText === 'GMT+0' ? 'GMT' : offsetText;
};

const timeZoneLabel = (timeZone: string, moment: Date): string =>
  `${timeZone.replaceAll('_', ' ')} (${timeZoneOffset(timeZone, moment)})`;

const formatClockInZone = (moment: Date, timeZone: string): string =>
  new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
    timeZone,
  }).format(moment);

const timeZonePlaceName = (timeZone: string): string =>
  (timeZone.split('/').at(-1) ?? timeZone).replaceAll('_', ' ');

export { deviceTimeZone, formatClockInZone, timeZoneLabel, timeZoneNames, timeZonePlaceName };
