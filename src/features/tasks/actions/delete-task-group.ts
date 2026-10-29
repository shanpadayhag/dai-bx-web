import backendTaskGroupSource from '@/features/tasks/data_sources/backend/task-group-source';
import type TaskGroup from '@/features/tasks/entities/task-group';

const deleteTaskGroup = async (taskGroupId: TaskGroup['id']): Promise<void> => {
  await backendTaskGroupSource.delete(taskGroupId);
};

export default deleteTaskGroup;
