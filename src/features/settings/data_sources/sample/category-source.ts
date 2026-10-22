import type { Category } from '@/core/category';
import sampleCategories from '@/core/sample-categories';

const sampleCategorySource = {
  findAll: (): Category[] => Object.values(sampleCategories),
};

export default sampleCategorySource;
