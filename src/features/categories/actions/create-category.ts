import AppError from '@/core/app-error';
import type { Category } from '@/core/category';
import backendCategorySource from '@/features/categories/data_sources/backend/category-source';

type CreateCategoryParams = {
  categoryName: string;
  categoryColor: string;
};

const createCategory = async (params: CreateCategoryParams): Promise<Category> => {
  const trimmedCategoryName = params.categoryName.trim();
  if (trimmedCategoryName === '') {
    throw new AppError('Name the category', 'Give it a name, like Health.');
  }
  return backendCategorySource.create({ name: trimmedCategoryName, color: params.categoryColor });
};

export default createCategory;
