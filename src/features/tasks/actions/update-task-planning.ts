import backendTaskSource from '@/features/tasks/data_sources/backend/task-source';
import type { GroupTasks } from '@/features/tasks/entities/group-tasks';
import type { TaskPlanning } from '@/features/tasks/entities/task-planning';

const updateTaskPlanning = (taskId: string, taskPlanning: TaskPlanning): Promise<GroupTasks> =>
  backendTaskSource.update(taskId, {
    priority: taskPlanning.priority,
    due: taskPlanning.due,
    planBetween: taskPlanning.planBetween,
  });

export default updateTaskPlanning;
