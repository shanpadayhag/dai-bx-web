import type TaskCard from '@/features/tasks/entities/task-card';
import type { TaskPlanning } from '@/features/tasks/entities/task-planning';

type Task = TaskPlanning & {
  id: string;
  parentId: string | null;
  position: number;
  name: string;
  isDone: boolean;
  isOpen: boolean;
  isTracking: boolean;
  estimateMinutes: number | null;
  card: TaskCard | null;
  tasks: Task[];
};

export default Task;
