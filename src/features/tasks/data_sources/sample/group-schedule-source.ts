import { ALWAYS_DUE_TIMETABLE, type GroupSchedule } from '@/features/tasks/entities/group-schedule';

const HOUR_MILLIS = 3_600_000;

const hoursFrom = (now: Date, hourCount: number): string =>
  new Date(now.getTime() + hourCount * HOUR_MILLIS).toISOString();

const sampleGroupSchedules = (now: Date): readonly GroupSchedule[] => [
  {
    shows: {
      repeat: { frequency: 'weekly', interval: 1, weekdays: ['sat', 'sun'], ends: { never: true } },
      windowStart: '06:00',
      windowEnd: '12:00',
    },
    unchecks: {
      repeat: { frequency: 'weekly', interval: 1, weekdays: ['sat', 'sun'], ends: { never: true } },
      time: '04:00',
    },
    timetable: {
      dueNow: true,
      dueUntil: hoursFrom(now, 3),
      nextShowsAt: hoursFrom(now, 24),
      lastUncheckAt: hoursFrom(now, -5),
      nextUncheckAt: hoursFrom(now, 19),
    },
  },
  {
    shows: {
      repeat: {
        frequency: 'weekly',
        interval: 1,
        weekdays: ['mon', 'tue', 'wed', 'thu', 'fri'],
        ends: { never: true },
      },
      windowStart: '22:00',
      windowEnd: '02:00',
    },
    unchecks: null,
    timetable: {
      dueNow: false,
      dueUntil: null,
      nextShowsAt: hoursFrom(now, 30),
      lastUncheckAt: null,
      nextUncheckAt: null,
    },
  },
  {
    shows: {
      repeat: { frequency: 'daily', interval: 1, ends: { onDate: '2026-11-01' } },
      windowStart: null,
      windowEnd: null,
    },
    unchecks: null,
    timetable: {
      dueNow: false,
      dueUntil: null,
      nextShowsAt: null,
      lastUncheckAt: null,
      nextUncheckAt: null,
    },
  },
];

const sampleGroupScheduleSource = {
  findGroupSchedule(groupIndex: number, now: Date): GroupSchedule {
    return (
      sampleGroupSchedules(now)[groupIndex] ?? {
        shows: null,
        unchecks: null,
        timetable: ALWAYS_DUE_TIMETABLE,
      }
    );
  },
};

export default sampleGroupScheduleSource;
