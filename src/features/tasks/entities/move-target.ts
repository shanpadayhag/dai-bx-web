import { collectSubtreeIds } from '@/features/tasks/entities/task-record-changes';
import type TaskRecord from '@/features/tasks/entities/task-record';

type MoveTarget = {
  id: string;
  name: string;
  depth: number;
  isDone: boolean;
};

const TOP_LEVEL_KEY = '';

export const buildMoveTargets = (
  taskRecords: readonly TaskRecord[],
  movingTaskId: string | null,
): MoveTarget[] => {
  const excludedIds =
    movingTaskId === null ? new Set<string>() : collectSubtreeIds(taskRecords, movingTaskId);
  const childRecordsByParentKey = new Map<string, TaskRecord[]>();
  for (const taskRecord of taskRecords) {
    if (excludedIds.has(taskRecord.id)) continue;
    const parentKey = taskRecord.parentId ?? TOP_LEVEL_KEY;
    const siblingRecords = childRecordsByParentKey.get(parentKey) ?? [];
    siblingRecords.push(taskRecord);
    childRecordsByParentKey.set(parentKey, siblingRecords);
  }
  const moveTargets: MoveTarget[] = [];
  const appendChildren = (parentKey: string, depth: number) => {
    const sortedRecords = [...(childRecordsByParentKey.get(parentKey) ?? [])].sort(
      (firstRecord, secondRecord) => firstRecord.position - secondRecord.position,
    );
    for (const taskRecord of sortedRecords) {
      moveTargets.push({
        id: taskRecord.id,
        name: taskRecord.name,
        depth,
        isDone: taskRecord.isDone,
      });
      appendChildren(taskRecord.id, depth + 1);
    }
  };
  appendChildren(TOP_LEVEL_KEY, 0);
  return moveTargets;
};

export default MoveTarget;
