import apiClient from '@/core/api/api-client';
import type { GroupTasks } from '@/features/tasks/entities/group-tasks';
import type { GroupShows, GroupUnchecks } from '@/features/tasks/entities/group-schedule';
import type TaskGroup from '@/features/tasks/entities/task-group';

export type TaskGroupDraft = {
  name: string;
  shows: GroupShows | null;
  unchecks: GroupUnchecks | null;
};

type DeletedAnswer = {
  status: 'deleted';
};

const backendTaskGroupSource = {
  findAll: () => apiClient.get<TaskGroup[]>('/task-groups'),
  create: (taskGroupDraft: TaskGroupDraft) =>
    apiClient.post<TaskGroup>('/task-groups', taskGroupDraft),
  update: (taskGroupId: TaskGroup['id'], taskGroupDraft: TaskGroupDraft) =>
    apiClient.patch<TaskGroup>(`/task-groups/${taskGroupId}`, taskGroupDraft),
  delete: (taskGroupId: TaskGroup['id']) =>
    apiClient.delete<DeletedAnswer>(`/task-groups/${taskGroupId}`),
  importFile: (importFile: unknown) =>
    apiClient.post<GroupTasks>('/task-groups/import', importFile),
};

export default backendTaskGroupSource;
