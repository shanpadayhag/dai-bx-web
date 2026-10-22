import type { Category } from '@/core/category';

type TaskGroup = {
  id: string;
  name: string;
  category: Category;
  openTaskCount: number;
};

export default TaskGroup;
