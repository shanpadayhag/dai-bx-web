import { expect, test } from 'vitest';
import {
  planningWeekFromWorkingHours,
  withPlanningDay,
} from '@/features/tracking/entities/planning-hours';

test('starts a custom week from the working hours on every day', () => {
  const planningWeek = planningWeekFromWorkingHours('09:00', '17:00');

  expect(planningWeek).toHaveLength(7);
  expect(planningWeek.every((planningDay) => planningDay?.start === '09:00')).toBe(true);
});

test('changes one day and can turn it off', () => {
  const planningWeek = planningWeekFromWorkingHours('09:00', '17:00');

  const withSundayOff = withPlanningDay(planningWeek, 6, null);
  const withLateMonday = withPlanningDay(withSundayOff, 0, { start: '22:00', end: '02:00' });

  expect(withLateMonday[0]).toEqual({ start: '22:00', end: '02:00' });
  expect(withLateMonday[6]).toBeNull();
  expect(withLateMonday[1]).toEqual({ start: '09:00', end: '17:00' });
});

test('refuses a day that starts and ends at the same time', () => {
  expect(() =>
    withPlanningDay(planningWeekFromWorkingHours('09:00', '17:00'), 2, {
      start: '10:00',
      end: '10:00',
    }),
  ).toThrow(expect.objectContaining({ title: 'Check the hours' }));
});
