import { describe, expect, test } from 'vitest';
import type TaskRecord from '@/features/tasks/entities/task-record';
import { applyTaskChange } from '@/features/tasks/entities/task-record-changes';

const taskRecord = (
  id: string,
  parentId: string | null,
  position: number,
  isDone = false,
): TaskRecord => ({ id, parentId, position, name: id, isDone, estimateMinutes: null });

const family: TaskRecord[] = [
  taskRecord('parent', null, 0),
  taskRecord('child', 'parent', 0),
  taskRecord('second-child', 'parent', 1),
  taskRecord('grandchild', 'child', 0),
  taskRecord('neighbour', null, 1),
];

const doneIds = (tasks: readonly TaskRecord[]) =>
  tasks
    .filter((task) => task.isDone)
    .map((task) => task.id)
    .sort();

const placeOf = (tasks: readonly TaskRecord[], taskId: string) => {
  const foundTask = tasks.find((task) => task.id === taskId);
  return foundTask === undefined ? undefined : [foundTask.parentId, foundTask.position];
};

describe('applyTaskChange', () => {
  test('completing a task completes everything beneath it', () => {
    const changedTasks = applyTaskChange(family, { kind: 'complete', taskId: 'child' });

    expect(doneIds(changedTasks)).toEqual(['child', 'grandchild']);
  });

  test('reopening a task reopens its done ancestors but none of its own subtasks', () => {
    const allDone = family.map((task) => ({ ...task, isDone: true }));

    const changedTasks = applyTaskChange(allDone, { kind: 'reopen', taskId: 'child' });

    expect(doneIds(changedTasks)).toEqual(['grandchild', 'neighbour', 'second-child']);
  });

  test('renaming and setting an estimate change only that task', () => {
    const renamedTasks = applyTaskChange(family, {
      kind: 'update',
      taskId: 'child',
      taskName: 'Renamed',
      estimateMinutes: 30,
    });

    expect(renamedTasks.find((task) => task.id === 'child')).toMatchObject({
      name: 'Renamed',
      estimateMinutes: 30,
    });
    expect(renamedTasks.find((task) => task.id === 'parent')?.name).toBe('parent');
  });

  test('deleting removes the subtree and closes the gap among siblings', () => {
    const changedTasks = applyTaskChange(family, { kind: 'delete', taskId: 'child' });

    expect(changedTasks.map((task) => task.id).sort()).toEqual([
      'neighbour',
      'parent',
      'second-child',
    ]);
    expect(placeOf(changedTasks, 'second-child')).toEqual(['parent', 0]);
  });

  test('adding puts the task last among its siblings and reopens done ancestors', () => {
    const doneParentFamily = applyTaskChange(family, { kind: 'complete', taskId: 'parent' });

    const changedTasks = applyTaskChange(doneParentFamily, {
      kind: 'add',
      taskRecord: taskRecord('new', 'parent', 0),
    });

    expect(placeOf(changedTasks, 'new')).toEqual(['parent', 2]);
    expect(doneIds(changedTasks)).toEqual(['child', 'grandchild', 'second-child']);
  });

  test('moving within the group renumbers both sibling lists and clamps the position', () => {
    const changedTasks = applyTaskChange(family, {
      kind: 'move',
      taskId: 'child',
      parentId: null,
      position: 99,
    });

    expect(placeOf(changedTasks, 'child')).toEqual([null, 2]);
    expect(placeOf(changedTasks, 'second-child')).toEqual(['parent', 0]);
    expect(placeOf(changedTasks, 'grandchild')).toEqual(['child', 0]);
  });

  test('moving an open task under a done task reopens it', () => {
    const doneNeighbour = applyTaskChange(family, { kind: 'complete', taskId: 'neighbour' });

    const changedTasks = applyTaskChange(doneNeighbour, {
      kind: 'move',
      taskId: 'second-child',
      parentId: 'neighbour',
      position: 0,
    });

    expect(doneIds(changedTasks)).toEqual([]);
  });

  test('moving to another group removes the subtree from this list', () => {
    const changedTasks = applyTaskChange(family, { kind: 'leave', taskId: 'child' });

    expect(changedTasks.map((task) => task.id).sort()).toEqual([
      'neighbour',
      'parent',
      'second-child',
    ]);
  });
});
