import apiClient from '@/core/api/api-client';
import type { Category } from '@/core/category';
import type CategoryChanges from '@/features/categories/entities/category-changes';

type DeletedAnswer = {
  status: 'deleted';
};

const backendCategorySource = {
  findAll: () => apiClient.get<Category[]>('/categories'),
  create: (newCategory: Pick<Category, 'name' | 'color'>) =>
    apiClient.post<Category>('/categories', newCategory),
  update: (categoryId: Category['id'], categoryChanges: CategoryChanges) =>
    apiClient.patch<Category>(`/categories/${categoryId}`, categoryChanges),
  delete: (categoryId: Category['id']) =>
    apiClient.delete<DeletedAnswer>(`/categories/${categoryId}`),
};

export default backendCategorySource;
