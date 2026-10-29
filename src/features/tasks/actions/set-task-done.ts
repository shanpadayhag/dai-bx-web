import backendTaskSource from '@/features/tasks/data_sources/backend/task-source';
import type { GroupTasks } from '@/features/tasks/entities/group-tasks';

type SetTaskDoneParams = {
  taskId: string;
  isDone: boolean;
};

const setTaskDone = (params: SetTaskDoneParams): Promise<GroupTasks> =>
  params.isDone
    ? backendTaskSource.complete(params.taskId)
    : backendTaskSource.reopen(params.taskId);

export default setTaskDone;
