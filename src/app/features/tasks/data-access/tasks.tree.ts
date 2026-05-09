import { todayIso } from '@shared/utils/dates';
import type { AlarmSpec } from '@features/alarms/data-access/alarms.types';
import type { Task, TaskRow } from '@features/tasks/data-access/tasks.types';

export const isVisibleToday = (task: Task): boolean =>
  !task.hiddenUntil || task.hiddenUntil <= todayIso();

const moveInArray = <T>(arr: T[], from: number, to: number): T[] => {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) {
    return arr;
  }
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

const reindexOrder = <T extends { order: number }>(items: T[]): T[] =>
  items.map((item, i) => ({ ...item, order: i }));

export const insertSubtask = (tasks: Task[], parentId: string, newTask: Task): Task[] =>
  tasks.map((task) => {
    if (task.id === parentId) {
      return { ...task, tasks: [...task.tasks, newTask] };
    }
    return { ...task, tasks: insertSubtask(task.tasks, parentId, newTask) };
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

export const setTaskAlarmById = (
  tasks: Task[],
  taskId: string,
  alarm: AlarmSpec | null,
): Task[] =>
  tasks.map((task) => {
    if (task.id === taskId) return { ...task, alarm };
    return { ...task, tasks: setTaskAlarmById(task.tasks, taskId, alarm) };
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

export const collectSubtreeIds = (task: Task): string[] => {
  const out: string[] = [task.id];
  for (const child of task.tasks) out.push(...collectSubtreeIds(child));
  return out;
};

export interface TaskInTree {
  task: Task;
  parentId: string | null;
}

export const findTaskInTree = (tasks: Task[], taskId: string): TaskInTree | null => {
  const walk = (nodes: Task[], parentId: string | null): TaskInTree | null => {
    for (const t of nodes) {
      if (t.id === taskId) return { task: t, parentId };
      const inner = walk(t.tasks, t.id);
      if (inner) return inner;
    }
    return null;
  };
  return walk(tasks, null);
};

export const getSiblingsOf = (tasks: Task[], parentId: string | null): Task[] => {
  if (parentId === null) return tasks;
  const found = findTaskInTree(tasks, parentId);
  return found?.task.tasks ?? [];
};

export const toTaskRow = (task: Task, groupId: string, parentId: string | null): TaskRow => ({
  id: task.id,
  groupId,
  parentId,
  name: task.name,
  order: task.order,
  hiddenUntil: task.hiddenUntil,
  completedDate: task.completedDate,
  isOpen: task.isOpen,
  alarm: task.alarm,
});

export const flattenTasks = (
  tasks: Task[],
  groupId: string,
  parentId: string | null = null,
): TaskRow[] => {
  const out: TaskRow[] = [];
  for (const t of tasks) {
    out.push(toTaskRow(t, groupId, parentId));
    out.push(...flattenTasks(t.tasks, groupId, t.id));
  }
  return out;
};

const sortRecursive = (tasks: Task[]): void => {
  tasks.sort((a, b) => a.order - b.order);
  for (const t of tasks) sortRecursive(t.tasks);
};

export const buildTreeFromRows = (rows: TaskRow[]): Task[] => {
  const byId = new Map<string, Task>();
  for (const r of rows) {
    byId.set(r.id, {
      id: r.id,
      name: r.name,
      order: r.order,
      hiddenUntil: r.hiddenUntil,
      completedDate: r.completedDate,
      isOpen: r.isOpen,
      alarm: r.alarm ?? null,
      tasks: [],
    });
  }
  const roots: Task[] = [];
  for (const r of rows) {
    const t = byId.get(r.id);
    if (!t) continue;
    if (r.parentId === null) {
      roots.push(t);
    } else {
      const parent = byId.get(r.parentId);
      if (parent) parent.tasks.push(t);
      else roots.push(t);
    }
  }
  sortRecursive(roots);
  return roots;
};
