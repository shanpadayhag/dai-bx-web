import type CalendarEvent from '@/features/calendar/entities/calendar-event';
import type ScheduledMove from '@/features/calendar/entities/scheduled-move';

const MORNING_RUN_WEEKDAYS = new Set([1, 3, 5]);
const SUNDAY = 0;
const MONDAY = 1;
const THURSDAY = 4;

const atLocalTime = (dayStart: Date, hours: number, minutes: number): Date =>
  new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate(), hours, minutes);

const morningRunOccurrence = (dayStart: Date): CalendarEvent => {
  const startsAt = atLocalTime(dayStart, 7, 0);
  return {
    id: `sample-morning-run:${startsAt.toISOString()}`,
    kind: 'planned',
    title: 'Morning run',
    category: null,
    startsAt,
    endsAt: atLocalTime(dayStart, 8, 0),
    finishedAt: null,
    source: null,
    series: {
      id: 'sample-morning-run',
      originalStart: startsAt,
      repeatRule: {
        frequency: 'weekly',
        interval: 1,
        weekdays: ['mon', 'wed', 'fri'],
        ends: { never: true },
      },
    },
  };
};

const familyCallOccurrence = (dayStart: Date): CalendarEvent => {
  const startsAt = atLocalTime(dayStart, 19, 0);
  return {
    id: `sample-family-call:${startsAt.toISOString()}`,
    kind: 'planned',
    title: 'Call home',
    category: null,
    startsAt,
    endsAt: atLocalTime(dayStart, 19, 30),
    finishedAt: null,
    source: null,
    timeZone: 'Europe/London',
    series: {
      id: 'sample-family-call',
      originalStart: startsAt,
      repeatRule: { frequency: 'weekly', interval: 1, weekdays: ['sun'], ends: { after: 12 } },
    },
  };
};

const sampleRepeatingEventSource = {
  findOccurrences: (dayStarts: readonly Date[]): CalendarEvent[] =>
    dayStarts.flatMap((dayStart) => [
      ...(MORNING_RUN_WEEKDAYS.has(dayStart.getDay()) ? [morningRunOccurrence(dayStart)] : []),
      ...(dayStart.getDay() === SUNDAY ? [familyCallOccurrence(dayStart)] : []),
    ]),
  findScheduledMoves: (dayStarts: readonly Date[]): ScheduledMove[] =>
    dayStarts.flatMap((dayStart) => [
      ...(dayStart.getDay() === MONDAY
        ? [
            {
              scheduleId: 'sample-weekly-review',
              cardId: 'sample-weekly-review-card',
              cardTitle: 'Weekly review',
              boardId: 'sample-board',
              listName: 'To Do',
              at: atLocalTime(dayStart, 18, 0),
            },
          ]
        : []),
      ...(dayStart.getDay() === THURSDAY
        ? [
            {
              scheduleId: 'sample-send-invoice',
              cardId: 'sample-send-invoice-card',
              cardTitle: 'Send the November invoice',
              boardId: 'sample-board',
              listName: 'Doing',
              at: atLocalTime(dayStart, 9, 30),
            },
          ]
        : []),
    ]),
};

export default sampleRepeatingEventSource;
