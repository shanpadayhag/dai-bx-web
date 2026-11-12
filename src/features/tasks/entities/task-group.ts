import type { GroupSchedule } from '@/features/tasks/entities/group-schedule';

type TaskGroup = GroupSchedule & {
  id: string;
  name: string;
  openTaskCount: number;
  taskCount: number;
};

export default TaskGroup;
