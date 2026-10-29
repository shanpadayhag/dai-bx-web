import type { Category } from '@/core/category';
import backendCategorySource from '@/features/categories/data_sources/backend/category-source';

const deleteCategory = async (categoryId: Category['id']): Promise<void> => {
  await backendCategorySource.delete(categoryId);
};

export default deleteCategory;
