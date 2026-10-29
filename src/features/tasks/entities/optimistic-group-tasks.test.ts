import { expect, test } from 'vitest';
import type { GroupTasks } from '@/features/tasks/entities/group-tasks';
import {
  confirmWrite,
  failWrite,
  startOptimisticGroupTasks,
  startWrite,
  visibleGroupTasks,
} from '@/features/tasks/entities/optimistic-group-tasks';

const serverGroupTasks: GroupTasks = {
  group: { id: 'group-today', name: 'Today', category: null },
  tasks: [
    { id: 'a', parentId: null, position: 0, name: 'A', isDone: false, estimateMinutes: null },
    { id: 'b', parentId: null, position: 1, name: 'B', isDone: false, estimateMinutes: null },
  ],
  openCount: 2,
  doneCount: 0,
};

test('a pending write shows at once, with counts recomputed', () => {
  const optimisticState = startWrite(startOptimisticGroupTasks(serverGroupTasks), 1, {
    kind: 'complete',
    taskId: 'a',
  });

  const shownGroupTasks = visibleGroupTasks(optimisticState);

  expect(shownGroupTasks.tasks.find((task) => task.id === 'a')?.isDone).toBe(true);
  expect(shownGroupTasks.openCount).toBe(1);
  expect(shownGroupTasks.doneCount).toBe(1);
});

test("the server's answer replaces the local guess", () => {
  const pendingState = startWrite(startOptimisticGroupTasks(serverGroupTasks), 1, {
    kind: 'update',
    taskId: 'a',
    taskName: 'Local guess',
  });
  const serverAnswer: GroupTasks = {
    ...serverGroupTasks,
    tasks: serverGroupTasks.tasks.map((task) =>
      task.id === 'a' ? { ...task, name: 'Server truth' } : task,
    ),
  };

  const confirmedState = confirmWrite(pendingState, 1, serverAnswer);

  expect(visibleGroupTasks(confirmedState).tasks[0]?.name).toBe('Server truth');
  expect(confirmedState.pendingWrites).toEqual([]);
});

test('a failed write rolls back only its own change and keeps the others pending', () => {
  const twoWritesState = startWrite(
    startWrite(startOptimisticGroupTasks(serverGroupTasks), 1, { kind: 'complete', taskId: 'a' }),
    2,
    { kind: 'delete', taskId: 'b' },
  );

  const rolledBackState = failWrite(twoWritesState, 1);

  const shownGroupTasks = visibleGroupTasks(rolledBackState);
  expect(shownGroupTasks.tasks.map((task) => [task.id, task.isDone])).toEqual([['a', false]]);
  expect(rolledBackState.pendingWrites.map((pendingWrite) => pendingWrite.writeId)).toEqual([2]);
});

test('a still-pending write stays applied on top of an earlier confirmation', () => {
  const twoWritesState = startWrite(
    startWrite(startOptimisticGroupTasks(serverGroupTasks), 1, { kind: 'complete', taskId: 'a' }),
    2,
    { kind: 'complete', taskId: 'b' },
  );
  const firstAnswer: GroupTasks = {
    ...serverGroupTasks,
    tasks: serverGroupTasks.tasks.map((task) =>
      task.id === 'a' ? { ...task, isDone: true } : task,
    ),
    openCount: 1,
    doneCount: 1,
  };

  const shownGroupTasks = visibleGroupTasks(confirmWrite(twoWritesState, 1, firstAnswer));

  expect(shownGroupTasks.tasks.every((task) => task.isDone)).toBe(true);
});
