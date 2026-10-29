import type Task from '@/features/tasks/entities/task';
import type TaskRecord from '@/features/tasks/entities/task-record';

const TOP_LEVEL_KEY = '';

export const buildTaskTree = (
  taskRecords: readonly TaskRecord[],
  collapsedTaskIds: ReadonlySet<string>,
): Task[] => {
  const childRecordsByParentKey = new Map<string, TaskRecord[]>();
  for (const taskRecord of taskRecords) {
    const parentKey = taskRecord.parentId ?? TOP_LEVEL_KEY;
    const siblingRecords = childRecordsByParentKey.get(parentKey) ?? [];
    siblingRecords.push(taskRecord);
    childRecordsByParentKey.set(parentKey, siblingRecords);
  }
  const buildChildren = (parentKey: string): Task[] =>
    (childRecordsByParentKey.get(parentKey) ?? [])
      .sort((firstRecord, secondRecord) => firstRecord.position - secondRecord.position)
      .map((taskRecord) => ({
        id: taskRecord.id,
        parentId: taskRecord.parentId,
        position: taskRecord.position,
        name: taskRecord.name,
        isDone: taskRecord.isDone,
        isOpen: !collapsedTaskIds.has(taskRecord.id),
        isTracking: false,
        estimateMinutes: taskRecord.estimateMinutes,
        tasks: buildChildren(taskRecord.id),
      }));
  return buildChildren(TOP_LEVEL_KEY);
};
