import apiClient from '@/core/api/api-client';
import type { GroupTasks, MovedGroupTasks } from '@/features/tasks/entities/group-tasks';
import type TaskRecord from '@/features/tasks/entities/task-record';

export type NewTask = {
  name: string;
  parentId: string | null;
};

export type TaskChanges = {
  name?: string;
  estimateMinutes?: number | null;
};

export type MoveTarget = {
  groupId: string;
  parentId: string | null;
  position: number;
};

const backendTaskSource = {
  findGroupTasks: (taskGroupId: string) =>
    apiClient.get<GroupTasks>(`/task-groups/${taskGroupId}/tasks`),
  add: (taskGroupId: string, newTask: NewTask) =>
    apiClient.post<GroupTasks>(`/task-groups/${taskGroupId}/tasks`, newTask),
  update: (taskId: TaskRecord['id'], taskChanges: TaskChanges) =>
    apiClient.patch<GroupTasks>(`/tasks/${taskId}`, taskChanges),
  complete: (taskId: TaskRecord['id']) => apiClient.post<GroupTasks>(`/tasks/${taskId}/complete`),
  reopen: (taskId: TaskRecord['id']) => apiClient.post<GroupTasks>(`/tasks/${taskId}/reopen`),
  delete: (taskId: TaskRecord['id']) => apiClient.delete<GroupTasks>(`/tasks/${taskId}`),
  move: (taskId: TaskRecord['id'], moveTarget: MoveTarget) =>
    apiClient.post<MovedGroupTasks>(`/tasks/${taskId}/move`, moveTarget),
};

export default backendTaskSource;
