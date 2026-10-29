import backendTaskSource, {
  type MoveTarget,
} from '@/features/tasks/data_sources/backend/task-source';
import type { MovedGroupTasks } from '@/features/tasks/entities/group-tasks';

type MoveTaskParams = {
  taskId: string;
  moveTarget: MoveTarget;
};

const moveTask = (params: MoveTaskParams): Promise<MovedGroupTasks> =>
  backendTaskSource.move(params.taskId, params.moveTarget);

export default moveTask;
