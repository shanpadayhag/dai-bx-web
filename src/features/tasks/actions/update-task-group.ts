import AppError from '@/core/app-error';
import backendTaskGroupSource from '@/features/tasks/data_sources/backend/task-group-source';
import type TaskGroup from '@/features/tasks/entities/task-group';

type UpdateTaskGroupParams = {
  taskGroupId: TaskGroup['id'];
  taskGroupName: string;
};

const updateTaskGroup = async (params: UpdateTaskGroupParams): Promise<TaskGroup> => {
  const trimmedTaskGroupName = params.taskGroupName.trim();
  if (trimmedTaskGroupName === '') {
    throw new AppError('Name the group', 'A group needs a name.');
  }
  return backendTaskGroupSource.update(params.taskGroupId, {
    name: trimmedTaskGroupName,
  });
};

export default updateTaskGroup;
