import type { Category } from '@/core/category';

type CategoryChanges = Partial<Pick<Category, 'name' | 'color'>>;

export default CategoryChanges;
