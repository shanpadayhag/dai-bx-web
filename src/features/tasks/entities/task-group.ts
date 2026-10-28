import type { Category } from '@/core/category';

type TaskGroup = {
  id: string;
  name: string;
  category: Category | null;
  openTaskCount: number;
  taskCount: number;
};

export default TaskGroup;
