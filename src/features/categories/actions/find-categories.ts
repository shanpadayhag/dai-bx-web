import type { Category } from '@/core/category';
import backendCategorySource from '@/features/categories/data_sources/backend/category-source';

const findCategories = (): Promise<Category[]> => backendCategorySource.findAll();

export default findCategories;
