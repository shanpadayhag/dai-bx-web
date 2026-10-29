import { expect, test } from 'vitest';
import { buildMoveTargets } from '@/features/tasks/entities/move-target';
import type TaskRecord from '@/features/tasks/entities/task-record';

const taskRecord = (
  id: string,
  parentId: string | null,
  position: number,
  isDone = false,
): TaskRecord => ({ id, parentId, position, name: id, isDone, estimateMinutes: null });

const records = [
  taskRecord('b', null, 1, true),
  taskRecord('a', null, 0),
  taskRecord('a2', 'a', 1),
  taskRecord('a1', 'a', 0),
  taskRecord('a1x', 'a1', 0),
];

test('lists every task depth-first in order, with its depth and done state', () => {
  expect(buildMoveTargets(records, null)).toEqual([
    { id: 'a', name: 'a', depth: 0, isDone: false },
    { id: 'a1', name: 'a1', depth: 1, isDone: false },
    { id: 'a1x', name: 'a1x', depth: 2, isDone: false },
    { id: 'a2', name: 'a2', depth: 1, isDone: false },
    { id: 'b', name: 'b', depth: 0, isDone: true },
  ]);
});

test('leaves out the moving task and everything under it', () => {
  expect(buildMoveTargets(records, 'a1').map((moveTarget) => moveTarget.id)).toEqual([
    'a',
    'a2',
    'b',
  ]);
});
