import apiClient from '@/core/api/api-client';
import type { GroupTasks } from '@/features/tasks/entities/group-tasks';
import type TaskGroup from '@/features/tasks/entities/task-group';

export type NewTaskGroup = {
  name: string;
};

export type TaskGroupChanges = {
  name: string;
};

type DeletedAnswer = {
  status: 'deleted';
};

const backendTaskGroupSource = {
  findAll: () => apiClient.get<TaskGroup[]>('/task-groups'),
  create: (newTaskGroup: NewTaskGroup) => apiClient.post<TaskGroup>('/task-groups', newTaskGroup),
  update: (taskGroupId: TaskGroup['id'], taskGroupChanges: TaskGroupChanges) =>
    apiClient.patch<TaskGroup>(`/task-groups/${taskGroupId}`, taskGroupChanges),
  delete: (taskGroupId: TaskGroup['id']) =>
    apiClient.delete<DeletedAnswer>(`/task-groups/${taskGroupId}`),
  importFile: (importFile: unknown) =>
    apiClient.post<GroupTasks>('/task-groups/import', importFile),
};

export default backendTaskGroupSource;
