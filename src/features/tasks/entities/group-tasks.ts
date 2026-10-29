import type TaskRecord from '@/features/tasks/entities/task-record';

export type GroupTasks = {
  group: {
    id: string;
    name: string;
  };
  tasks: TaskRecord[];
  openCount: number;
  doneCount: number;
};

export type AffectedGroup = {
  id: string;
  openTaskCount: number;
  taskCount: number;
};

export type MovedGroupTasks = GroupTasks & {
  affectedGroups: AffectedGroup[];
};
