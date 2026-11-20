import AppError from '@/core/app-error';

export type PlanningDay = {
  start: string;
  end: string;
};

export type PlanningDayField = keyof PlanningDay;

export type PlanningWeek = readonly (PlanningDay | null)[];

export const PLANNING_WEEKDAY_NAMES: readonly string[] = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export const planningWeekFromWorkingHours = (
  workingHoursStart: string,
  workingHoursEnd: string,
): PlanningWeek =>
  PLANNING_WEEKDAY_NAMES.map(() => ({ start: workingHoursStart, end: workingHoursEnd }));

export const withPlanningDay = (
  planningWeek: PlanningWeek,
  dayIndex: number,
  planningDay: PlanningDay | null,
): PlanningWeek => {
  if (planningDay !== null && planningDay.start === planningDay.end) {
    throw new AppError('Check the hours', 'A planning day starts and ends at different times.');
  }
  return planningWeek.map((weekDay, weekDayIndex) =>
    weekDayIndex === dayIndex ? planningDay : weekDay,
  );
};
