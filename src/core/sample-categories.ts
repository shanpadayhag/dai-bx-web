import type { Category } from '@/core/category';

const sampleCategories = {
  goals: { id: 'goals', name: 'Goals', color: '#7c95bd' },
  personal: { id: 'personal', name: 'Personal', color: '#3a405a' },
  studies: { id: 'studies', name: 'Studies', color: '#be7e86' },
  work: { id: 'work', name: 'Work', color: '#c6afa3' },
} satisfies Record<string, Category>;

export default sampleCategories;
