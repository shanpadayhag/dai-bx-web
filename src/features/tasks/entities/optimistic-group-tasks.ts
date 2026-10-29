import type { GroupTasks } from '@/features/tasks/entities/group-tasks';
import {
  applyTaskChange,
  type LocalTaskChange,
} from '@/features/tasks/entities/task-record-changes';

export type PendingWrite = {
  writeId: number;
  localChange: LocalTaskChange;
};

export type OptimisticGroupTasks = {
  confirmedGroupTasks: GroupTasks;
  pendingWrites: readonly PendingWrite[];
};

export const startOptimisticGroupTasks = (
  confirmedGroupTasks: GroupTasks,
): OptimisticGroupTasks => ({
  confirmedGroupTasks,
  pendingWrites: [],
});

export const startWrite = (
  optimisticState: OptimisticGroupTasks,
  writeId: number,
  localChange: LocalTaskChange,
): OptimisticGroupTasks => ({
  ...optimisticState,
  pendingWrites: [...optimisticState.pendingWrites, { writeId, localChange }],
});

const withoutWrite = (pendingWrites: readonly PendingWrite[], writeId: number) =>
  pendingWrites.filter((pendingWrite) => pendingWrite.writeId !== writeId);

export const confirmWrite = (
  optimisticState: OptimisticGroupTasks,
  writeId: number,
  serverGroupTasks: GroupTasks,
): OptimisticGroupTasks => ({
  confirmedGroupTasks: serverGroupTasks,
  pendingWrites: withoutWrite(optimisticState.pendingWrites, writeId),
});

export const failWrite = (
  optimisticState: OptimisticGroupTasks,
  writeId: number,
): OptimisticGroupTasks => ({
  ...optimisticState,
  pendingWrites: withoutWrite(optimisticState.pendingWrites, writeId),
});

export const visibleGroupTasks = (optimisticState: OptimisticGroupTasks): GroupTasks => {
  if (optimisticState.pendingWrites.length === 0) return optimisticState.confirmedGroupTasks;
  const visibleTasks = optimisticState.pendingWrites.reduce(
    (currentTasks, pendingWrite) => applyTaskChange(currentTasks, pendingWrite.localChange),
    optimisticState.confirmedGroupTasks.tasks,
  );
  const openCount = visibleTasks.filter((task) => !task.isDone).length;
  return {
    ...optimisticState.confirmedGroupTasks,
    tasks: visibleTasks,
    openCount,
    doneCount: visibleTasks.length - openCount,
  };
};
