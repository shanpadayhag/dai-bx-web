import type { Category } from '@/core/category';

type UpNextTask = {
  id: string;
  name: string;
  groupName: string;
  category: Category;
  estimate: string | null;
};

export default UpNextTask;
