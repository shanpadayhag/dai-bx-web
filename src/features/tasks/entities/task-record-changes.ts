import type TaskRecord from '@/features/tasks/entities/task-record';

export type LocalTaskChange =
  | { kind: 'add'; taskRecord: TaskRecord }
  | { kind: 'update'; taskId: string; taskName?: string; estimateMinutes?: number | null }
  | { kind: 'complete'; taskId: string }
  | { kind: 'reopen'; taskId: string }
  | { kind: 'delete'; taskId: string }
  | { kind: 'leave'; taskId: string }
  | { kind: 'move'; taskId: string; parentId: string | null; position: number };

export const collectSubtreeIds = (taskRecords: readonly TaskRecord[], rootTaskId: string) => {
  const childIdsByParentId = new Map<string, string[]>();
  for (const taskRecord of taskRecords) {
    if (taskRecord.parentId === null) continue;
    const siblingIds = childIdsByParentId.get(taskRecord.parentId) ?? [];
    siblingIds.push(taskRecord.id);
    childIdsByParentId.set(taskRecord.parentId, siblingIds);
  }
  const subtreeIds = new Set<string>();
  const pendingTaskIds = [rootTaskId];
  for (
    let pendingTaskId = pendingTaskIds.pop();
    pendingTaskId !== undefined;
    pendingTaskId = pendingTaskIds.pop()
  ) {
    if (subtreeIds.has(pendingTaskId)) continue;
    subtreeIds.add(pendingTaskId);
    pendingTaskIds.push(...(childIdsByParentId.get(pendingTaskId) ?? []));
  }
  return subtreeIds;
};

const collectAncestorIds = (taskRecords: readonly TaskRecord[], taskId: string | null) => {
  const parentIdById = new Map(
    taskRecords.map((taskRecord) => [taskRecord.id, taskRecord.parentId]),
  );
  const ancestorIds = new Set<string>();
  let currentTaskId = taskId;
  while (currentTaskId !== null && !ancestorIds.has(currentTaskId)) {
    ancestorIds.add(currentTaskId);
    currentTaskId = parentIdById.get(currentTaskId) ?? null;
  }
  return ancestorIds;
};

const reopenTasks = (taskRecords: readonly TaskRecord[], reopenedIds: ReadonlySet<string>) =>
  taskRecords.map((taskRecord) =>
    reopenedIds.has(taskRecord.id) && taskRecord.isDone
      ? { ...taskRecord, isDone: false }
      : taskRecord,
  );

const closeGap = (
  taskRecords: readonly TaskRecord[],
  parentId: string | null,
  removedPosition: number,
  movingTaskId: string,
) =>
  taskRecords.map((taskRecord) =>
    taskRecord.id !== movingTaskId &&
    taskRecord.parentId === parentId &&
    taskRecord.position > removedPosition
      ? { ...taskRecord, position: taskRecord.position - 1 }
      : taskRecord,
  );

const removeSubtree = (taskRecords: readonly TaskRecord[], taskId: string) => {
  const removedTask = taskRecords.find((taskRecord) => taskRecord.id === taskId);
  if (removedTask === undefined) return [...taskRecords];
  const subtreeIds = collectSubtreeIds(taskRecords, taskId);
  return closeGap(
    taskRecords.filter((taskRecord) => !subtreeIds.has(taskRecord.id)),
    removedTask.parentId,
    removedTask.position,
    taskId,
  );
};

const countSiblings = (
  taskRecords: readonly TaskRecord[],
  parentId: string | null,
  excludedTaskId: string,
) =>
  taskRecords.filter(
    (taskRecord) => taskRecord.parentId === parentId && taskRecord.id !== excludedTaskId,
  ).length;

const hasOpenTask = (taskRecords: readonly TaskRecord[], taskIds: ReadonlySet<string>) =>
  taskRecords.some((taskRecord) => taskIds.has(taskRecord.id) && !taskRecord.isDone);

const moveTask = (
  taskRecords: readonly TaskRecord[],
  taskId: string,
  parentId: string | null,
  requestedPosition: number,
) => {
  const movingTask = taskRecords.find((taskRecord) => taskRecord.id === taskId);
  if (movingTask === undefined) return [...taskRecords];
  const withGapClosed = closeGap(taskRecords, movingTask.parentId, movingTask.position, taskId);
  const targetPosition = Math.min(
    requestedPosition,
    countSiblings(withGapClosed, parentId, taskId),
  );
  const placedTasks = withGapClosed.map((taskRecord) => {
    if (taskRecord.id === taskId) return { ...taskRecord, parentId, position: targetPosition };
    if (taskRecord.parentId === parentId && taskRecord.position >= targetPosition) {
      return { ...taskRecord, position: taskRecord.position + 1 };
    }
    return taskRecord;
  });
  return parentId !== null && hasOpenTask(placedTasks, collectSubtreeIds(placedTasks, taskId))
    ? reopenTasks(placedTasks, collectAncestorIds(placedTasks, parentId))
    : placedTasks;
};

export const applyTaskChange = (
  taskRecords: readonly TaskRecord[],
  localChange: LocalTaskChange,
): TaskRecord[] => {
  switch (localChange.kind) {
    case 'add': {
      const addedTask = {
        ...localChange.taskRecord,
        position: countSiblings(
          taskRecords,
          localChange.taskRecord.parentId,
          localChange.taskRecord.id,
        ),
      };
      return reopenTasks(
        [...taskRecords, addedTask],
        collectAncestorIds(taskRecords, localChange.taskRecord.parentId),
      );
    }
    case 'update':
      return taskRecords.map((taskRecord) =>
        taskRecord.id === localChange.taskId
          ? {
              ...taskRecord,
              ...(localChange.taskName === undefined ? {} : { name: localChange.taskName }),
              ...(localChange.estimateMinutes === undefined
                ? {}
                : { estimateMinutes: localChange.estimateMinutes }),
            }
          : taskRecord,
      );
    case 'complete': {
      const subtreeIds = collectSubtreeIds(taskRecords, localChange.taskId);
      return taskRecords.map((taskRecord) =>
        subtreeIds.has(taskRecord.id) ? { ...taskRecord, isDone: true } : taskRecord,
      );
    }
    case 'reopen':
      return reopenTasks(taskRecords, collectAncestorIds(taskRecords, localChange.taskId));
    case 'delete':
    case 'leave':
      return removeSubtree(taskRecords, localChange.taskId);
    case 'move':
      return moveTask(taskRecords, localChange.taskId, localChange.parentId, localChange.position);
  }
};
