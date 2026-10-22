import type { Category } from '@/core/category';

type AgendaItem = {
  id: string;
  timeLabel: string;
  title: string;
  kind: 'tracked' | 'running' | 'planned';
  category: Category;
};

export default AgendaItem;
