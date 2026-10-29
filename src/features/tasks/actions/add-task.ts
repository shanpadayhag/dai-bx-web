import AppError from '@/core/app-error';
import backendTaskSource from '@/features/tasks/data_sources/backend/task-source';
import type { GroupTasks } from '@/features/tasks/entities/group-tasks';

type AddTaskParams = {
  taskGroupId: string;
  taskName: string;
  parentTaskId: string | null;
};

const addTask = async (params: AddTaskParams): Promise<GroupTasks> => {
  const trimmedTaskName = params.taskName.trim();
  if (trimmedTaskName === '') {
    throw new AppError('Name the task', 'Type what needs doing first.');
  }
  return backendTaskSource.add(params.taskGroupId, {
    name: trimmedTaskName,
    parentId: params.parentTaskId,
  });
};

export default addTask;
