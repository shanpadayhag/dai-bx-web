import backendTaskSource from '@/features/tasks/data_sources/backend/task-source';
import type { GroupTasks } from '@/features/tasks/entities/group-tasks';

const deleteTask = (taskId: string): Promise<GroupTasks> => backendTaskSource.delete(taskId);

export default deleteTask;
