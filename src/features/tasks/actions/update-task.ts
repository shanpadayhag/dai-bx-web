import AppError from '@/core/app-error';
import backendTaskSource from '@/features/tasks/data_sources/backend/task-source';
import { parseEstimate } from '@/features/tasks/entities/estimate';
import type { GroupTasks } from '@/features/tasks/entities/group-tasks';

type UpdateTaskParams = {
  taskId: string;
  taskName: string;
  estimateText: string;
};

export type ReadTaskEdit = {
  taskName: string;
  estimateMinutes: number | null;
};

export const readTaskEdit = (taskName: string, estimateText: string): ReadTaskEdit => {
  const trimmedTaskName = taskName.trim();
  if (trimmedTaskName === '') {
    throw new AppError('Name the task', 'A task needs a name.');
  }
  const estimateParse = parseEstimate(estimateText);
  if (estimateParse.kind === 'invalid') {
    throw new AppError('Check the estimate', 'Write it like 45m, 2h or 1h 30m, up to 24h.');
  }
  return {
    taskName: trimmedTaskName,
    estimateMinutes: estimateParse.kind === 'minutes' ? estimateParse.minutes : null,
  };
};

const updateTask = (params: UpdateTaskParams): Promise<GroupTasks> => {
  const taskEdit = readTaskEdit(params.taskName, params.estimateText);
  return backendTaskSource.update(params.taskId, {
    name: taskEdit.taskName,
    estimateMinutes: taskEdit.estimateMinutes,
  });
};

export default updateTask;
