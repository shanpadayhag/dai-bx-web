import type { Category } from '@/core/category';

type BoardCard = {
  id: string;
  title: string;
  category: Category;
  labels: string[];
  checklistDoneCount: number | null;
  checklistItemCount: number | null;
  dueLabel: string | null;
  recurrenceLabel: string | null;
  noteCount: number;
};

export default BoardCard;
