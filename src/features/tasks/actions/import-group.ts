import backendTaskGroupSource from '@/features/tasks/data_sources/backend/task-group-source';
import type { GroupTasks } from '@/features/tasks/entities/group-tasks';

const importGroup = (importFile: unknown): Promise<GroupTasks> =>
  backendTaskGroupSource.importFile(importFile);

export default importGroup;
