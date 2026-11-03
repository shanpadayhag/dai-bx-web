import type TaskCard from '@/features/tasks/entities/task-card';

type Task = {
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
