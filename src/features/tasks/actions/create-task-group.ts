import AppError from '@/core/app-error';
import backendTaskGroupSource from '@/features/tasks/data_sources/backend/task-group-source';
import type TaskGroup from '@/features/tasks/entities/task-group';

type CreateTaskGroupParams = {
  taskGroupName: string;
  categoryId: string | null;
};

const createTaskGroup = async (params: CreateTaskGroupParams): Promise<TaskGroup> => {
  const trimmedTaskGroupName = params.taskGroupName.trim();
  if (trimmedTaskGroupName === '') {
    throw new AppError('Name the group', 'Give it a name, like a project or a day.');
  }
  return backendTaskGroupSource.create({
    name: trimmedTaskGroupName,
    categoryId: params.categoryId,
  });
};

export default createTaskGroup;
