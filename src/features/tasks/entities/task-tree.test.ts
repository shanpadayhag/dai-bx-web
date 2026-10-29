import { expect, test } from 'vitest';
import type TaskRecord from '@/features/tasks/entities/task-record';
import { buildTaskTree } from '@/features/tasks/entities/task-tree';

const taskRecord = (
  id: string,
  parentId: string | null,
  position: number,
  overrides: Partial<TaskRecord> = {},
): TaskRecord => ({
  id,
  parentId,
  position,
  name: id,
  isDone: false,
  estimateMinutes: null,
  ...overrides,
});

const namesInOrder = (tasks: ReturnType<typeof buildTaskTree>): unknown[] =>
  tasks.map((task) => (task.tasks.length > 0 ? [task.name, namesInOrder(task.tasks)] : task.name));

test('nests tasks under their parents in position order, whatever order they arrive in', () => {
  const flatTasks = [
    taskRecord('b', null, 1),
    taskRecord('a2', 'a', 1),
    taskRecord('a', null, 0),
    taskRecord('a1', 'a', 0),
    taskRecord('a1x', 'a1', 0),
  ];

  expect(namesInOrder(buildTaskTree(flatTasks, new Set()))).toEqual([
    ['a', [['a1', ['a1x']], 'a2']],
    'b',
  ]);
});

test('builds 32 levels without losing any', () => {
  const chainTasks = Array.from({ length: 32 }, (_, levelIndex) =>
    taskRecord(`level-${levelIndex}`, levelIndex === 0 ? null : `level-${levelIndex - 1}`, 0),
  );

  let deepestTask = buildTaskTree(chainTasks, new Set())[0];
  let depth = 1;
  while (deepestTask !== undefined && deepestTask.tasks.length > 0) {
    deepestTask = deepestTask.tasks[0];
    depth += 1;
  }

  expect(depth).toBe(32);
});

test('carries done, estimate and the collapsed state onto each node', () => {
  const tree = buildTaskTree(
    [taskRecord('a', null, 0, { isDone: true, estimateMinutes: 45 }), taskRecord('a1', 'a', 0)],
    new Set(['a']),
  );

  expect(tree[0]).toMatchObject({
    id: 'a',
    isDone: true,
    estimateMinutes: 45,
    isOpen: false,
    isTracking: false,
  });
  expect(tree[0]?.tasks[0]).toMatchObject({ id: 'a1', isOpen: true });
});
