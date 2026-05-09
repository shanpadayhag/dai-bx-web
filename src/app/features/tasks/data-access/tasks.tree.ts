import { uid } from '@shared/utils/uid';
import { todayIso } from '@shared/utils/dates';
import type { Task } from '@features/tasks/data-access/tasks.types';

export const isVisibleToday = (task: Task): boolean =>
  !task.hiddenUntil || task.hiddenUntil <= todayIso();

const reindexOrder = <T extends { order: number }>(items: T[]): T[] =>
  items.map((item, i) => ({ ...item, order: i }));

const moveInArray = <T>(arr: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) {
    return arr;
  }
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

export const addSubtaskById = (tasks: Task[], parentId: string, name: string): Task[] =>
  tasks.map((task) => {
    if (task.id === parentId) {
      return {
        ...task,
        tasks: [
          ...task.tasks,
          {
            id: uid(),
            name,
            order: task.tasks.length,
            hiddenUntil: null,
            completedDate: null,
            isOpen: true,
            tasks: [],
          },
        ],
      };
    }
    return { ...task, tasks: addSubtaskById(task.tasks, parentId, name) };
  });

export const deleteTaskById = (tasks: Task[], taskId: string): Task[] =>
  tasks
    .filter((task) => task.id !== taskId)
    .map((task) => ({ ...task, tasks: deleteTaskById(task.tasks, taskId) }));

export const toggleTaskCompletionById = (tasks: Task[], taskId: string): Task[] => {
  const setAllChildren = (children: Task[], completedDate: string | null): Task[] =>
    children.map((child) => ({
      ...child,
      completedDate,
      tasks: setAllChildren(child.tasks, completedDate),
    }));

  return tasks.map((task) => {
    if (task.id === taskId) {
      const today = todayIso();
      const isCompletedToday = task.completedDate === today;
      const newCompletedDate = isCompletedToday ? null : today;
      return {
        ...task,
        completedDate: newCompletedDate,
        tasks: setAllChildren(task.tasks, newCompletedDate),
      };
    }
    return { ...task, tasks: toggleTaskCompletionById(task.tasks, taskId) };
  });
};

export const toggleTaskOpenById = (tasks: Task[], taskId: string, isOpen: boolean): Task[] =>
  tasks.map((task) => {
    if (task.id === taskId) return { ...task, isOpen };
    return { ...task, tasks: toggleTaskOpenById(task.tasks, taskId, isOpen) };
  });

export const reorderTasksByParent = (
  tasks: Task[],
  parentId: string | null,
  fromIndex: number,
  toIndex: number,
): Task[] => {
  if (parentId === null) {
    return reindexOrder(moveInArray(tasks, fromIndex, toIndex));
  }
  return tasks.map((task) => {
    if (task.id === parentId) {
      return {
        ...task,
        tasks: reindexOrder(moveInArray(task.tasks, fromIndex, toIndex)),
      };
    }
    return {
      ...task,
      tasks: reorderTasksByParent(task.tasks, parentId, fromIndex, toIndex),
    };
  });
};
