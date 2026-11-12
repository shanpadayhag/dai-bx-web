import { expect, test } from 'vitest';
import {
  ALWAYS_DUE_TIMETABLE,
  nextTimetableChangeAt,
  type GroupSchedule,
} from '@/features/tasks/entities/group-schedule';

const now = new Date('2026-11-12T10:00:00Z');

const scheduleWith = (timetable: Partial<GroupSchedule['timetable']>): GroupSchedule => ({
  shows: null,
  unchecks: null,
  timetable: { ...ALWAYS_DUE_TIMETABLE, ...timetable },
});

test('picks the earliest future change across every group', () => {
  const groupSchedules = [
    scheduleWith({ dueUntil: '2026-11-12T12:00:00Z', nextShowsAt: '2026-11-13T06:00:00Z' }),
    scheduleWith({ nextUncheckAt: '2026-11-12T11:00:00Z', lastUncheckAt: '2026-11-12T04:00:00Z' }),
  ];

  expect(nextTimetableChangeAt(groupSchedules, now)).toEqual(new Date('2026-11-12T11:00:00Z'));
});

test('skips changes that have already passed', () => {
  const groupSchedules = [
    scheduleWith({ dueUntil: '2026-11-12T10:00:00Z', nextShowsAt: '2026-11-13T06:00:00Z' }),
  ];

  expect(nextTimetableChangeAt(groupSchedules, now)).toEqual(new Date('2026-11-13T06:00:00Z'));
});

test('has nothing to wait for when no group has rules', () => {
  expect(nextTimetableChangeAt([scheduleWith({})], now)).toBeNull();
});
