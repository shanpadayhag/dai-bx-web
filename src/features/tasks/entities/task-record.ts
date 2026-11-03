import type TaskCard from '@/features/tasks/entities/task-card';

type TaskRecord = {
  id: string;
  parentId: string | null;
  position: number;
  name: string;
  isDone: boolean;
  estimateMinutes: number | null;
  card: TaskCard | null;
};

export default TaskRecord;
