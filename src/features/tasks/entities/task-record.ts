import type TaskCard from '@/features/tasks/entities/task-card';
import type { TaskPlanning } from '@/features/tasks/entities/task-planning';

type TaskRecord = TaskPlanning & {
  id: string;
  parentId: string | null;
  position: number;
  name: string;
  isDone: boolean;
  estimateMinutes: number | null;
  card: TaskCard | null;
  trackedEventCount: number;
};

export default TaskRecord;
