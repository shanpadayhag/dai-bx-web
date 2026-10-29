import AppError from '@/core/app-error';
import type { Category } from '@/core/category';
import backendCategorySource from '@/features/categories/data_sources/backend/category-source';
import type CategoryChanges from '@/features/categories/entities/category-changes';

type UpdateCategoryParams = {
  categoryId: Category['id'];
  categoryChanges: CategoryChanges;
};

const updateCategory = async (params: UpdateCategoryParams): Promise<Category> => {
  const trimmedCategoryName = params.categoryChanges.name?.trim();
  if (trimmedCategoryName === '') {
    throw new AppError('Name the category', 'A category needs a name.');
  }
  return backendCategorySource.update(params.categoryId, {
    ...params.categoryChanges,
    ...(trimmedCategoryName === undefined ? {} : { name: trimmedCategoryName }),
  });
};

export default updateCategory;
