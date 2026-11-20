import { expect, test } from 'vitest';
import {
  formatDue,
  formatPlanBetween,
  isDuePast,
  readTaskPlanning,
  type TaskPlanningEntry,
} from '@/features/tasks/entities/task-planning';

const emptyEntry: TaskPlanningEntry = {
  priority: 'normal',
  dueDate: '',
  dueTime: '',
  windowStart: '',
  windowEnd: '',
};

test('reads an empty form as a normal task with nothing set', () => {
  expect(readTaskPlanning(emptyEntry)).toEqual({
    priority: 'normal',
    due: null,
    planBetween: null,
  });
});

test('reads every field', () => {
  expect(
    readTaskPlanning({
      priority: 'high',
      dueDate: '2026-11-21',
      dueTime: '17:00',
      windowStart: '22:00',
      windowEnd: '02:00',
    }),
  ).toEqual({
    priority: 'high',
    due: { date: '2026-11-21', time: '17:00' },
    planBetween: { start: '22:00', end: '02:00' },
  });
  expect(readTaskPlanning({ ...emptyEntry, dueDate: '2026-11-21' }).due).toEqual({
    date: '2026-11-21',
    time: null,
  });
});

test.each([
  [{ priority: 'urgent' }, 'Choose a priority'],
  [{ dueTime: '17:00' }, 'Pick a due date'],
  [{ dueDate: '21/11/2026' }, 'Check the due date'],
  [{ windowStart: '9am', windowEnd: '10:00' }, 'Check the times'],
  [{ windowStart: '09:00' }, 'Finish the window'],
  [{ windowStart: '09:00', windowEnd: '09:00' }, 'Check the window'],
])('refuses %o', (changedFields, expectedTitle) => {
  expect(() => readTaskPlanning({ ...emptyEntry, ...changedFields })).toThrow(
    expect.objectContaining({ title: expectedTitle }),
  );
});

test('names the due day relative to today', () => {
  expect(formatDue({ date: '2026-11-20', time: null }, '2026-11-20')).toBe('Today');
  expect(formatDue({ date: '2026-11-21', time: '09:30' }, '2026-11-20')).toBe('Tomorrow 09:30');
  expect(formatDue({ date: '2026-11-24', time: null }, '2026-11-20')).toBe('Tue 24 Nov');
  expect(isDuePast({ date: '2026-11-19', time: null }, '2026-11-20')).toBe(true);
  expect(isDuePast({ date: '2026-11-20', time: null }, '2026-11-20')).toBe(false);
});

test('writes a window as start–end', () => {
  expect(formatPlanBetween({ start: '22:00', end: '02:00' })).toBe('22:00–02:00');
});
