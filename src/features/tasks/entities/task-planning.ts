import AppError from '@/core/app-error';
import { addCalendarDays, calendarDateTitle } from '@/core/zoned-time';

export type TaskPriority = 'high' | 'normal' | 'low';

export type TaskDue = {
  date: string;
  time: string | null;
};

export type PlanBetween = {
  start: string;
  end: string;
};

export type TaskPlanning = {
  priority: TaskPriority;
  due: TaskDue | null;
  planBetween: PlanBetween | null;
};

export const NO_TASK_PLANNING: TaskPlanning = { priority: 'normal', due: null, planBetween: null };

export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  high: 'High',
  normal: 'Normal',
  low: 'Low',
};

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const WALL_CLOCK_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const isTaskPriority = (priorityText: string): priorityText is TaskPriority =>
  priorityText === 'high' || priorityText === 'normal' || priorityText === 'low';

export type TaskPlanningEntry = {
  priority: string;
  dueDate: string;
  dueTime: string;
  windowStart: string;
  windowEnd: string;
};

export const readTaskPlanning = (planningEntry: TaskPlanningEntry): TaskPlanning => {
  if (!isTaskPriority(planningEntry.priority)) {
    throw new AppError('Choose a priority', 'A task is high, normal or low priority.');
  }
  if (planningEntry.dueDate === '' && planningEntry.dueTime !== '') {
    throw new AppError('Pick a due date', 'A due time needs a date.');
  }
  if (planningEntry.dueDate !== '' && !CALENDAR_DATE_PATTERN.test(planningEntry.dueDate)) {
    throw new AppError('Check the due date', 'Pick a date from the calendar.');
  }
  const windowTimes = [planningEntry.windowStart, planningEntry.windowEnd, planningEntry.dueTime];
  if (windowTimes.some((windowTime) => windowTime !== '' && !WALL_CLOCK_PATTERN.test(windowTime))) {
    throw new AppError('Check the times', 'Write each time like 09:30.');
  }
  const hasWindowStart = planningEntry.windowStart !== '';
  if (hasWindowStart !== (planningEntry.windowEnd !== '')) {
    throw new AppError('Finish the window', 'Plan between needs a start and an end, or neither.');
  }
  if (hasWindowStart && planningEntry.windowStart === planningEntry.windowEnd) {
    throw new AppError('Check the window', 'Plan between starts and ends at different times.');
  }
  return {
    priority: planningEntry.priority,
    due:
      planningEntry.dueDate === ''
        ? null
        : { date: planningEntry.dueDate, time: planningEntry.dueTime || null },
    planBetween: hasWindowStart
      ? { start: planningEntry.windowStart, end: planningEntry.windowEnd }
      : null,
  };
};

export const formatDueDay = (dueDate: string, todayDate: string): string => {
  if (dueDate === todayDate) return 'Today';
  if (dueDate === addCalendarDays(todayDate, 1)) return 'Tomorrow';
  return calendarDateTitle(dueDate, { weekday: 'short', day: 'numeric', month: 'short' });
};

export const formatDue = (due: TaskDue, todayDate: string): string => {
  const dueDay = formatDueDay(due.date, todayDate);
  return due.time === null ? dueDay : `${dueDay} ${due.time}`;
};

export const isDuePast = (due: TaskDue, todayDate: string): boolean => due.date < todayDate;

export const formatPlanBetween = (planBetween: PlanBetween): string =>
  `${planBetween.start}–${planBetween.end}`;
