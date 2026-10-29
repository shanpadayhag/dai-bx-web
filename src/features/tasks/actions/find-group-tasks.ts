import backendTaskSource from '@/features/tasks/data_sources/backend/task-source';
import type { GroupTasks } from '@/features/tasks/entities/group-tasks';

const findGroupTasks = (taskGroupId: string): Promise<GroupTasks> =>
  backendTaskSource.findGroupTasks(taskGroupId);

export default findGroupTasks;
