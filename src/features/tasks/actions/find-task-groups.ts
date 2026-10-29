import backendTaskGroupSource from '@/features/tasks/data_sources/backend/task-group-source';
import type TaskGroup from '@/features/tasks/entities/task-group';

const findTaskGroups = (): Promise<TaskGroup[]> => backendTaskGroupSource.findAll();

export default findTaskGroups;
