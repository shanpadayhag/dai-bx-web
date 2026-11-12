import {
  readTaskGroupDraft,
  type GroupFormEntry,
} from '@/features/tasks/actions/create-task-group';
import backendTaskGroupSource from '@/features/tasks/data_sources/backend/task-group-source';
import type TaskGroup from '@/features/tasks/entities/task-group';

type UpdateTaskGroupParams = GroupFormEntry & {
  taskGroupId: TaskGroup['id'];
};

const updateTaskGroup = async (params: UpdateTaskGroupParams): Promise<TaskGroup> =>
  backendTaskGroupSource.update(
    params.taskGroupId,
    readTaskGroupDraft(params, 'A group needs a name.'),
  );

export default updateTaskGroup;
