import type { Category } from '@/core/category';

type Workflow = {
  id: string;
  name: string;
  description: string;
  category: Category;
  triggerLabel: string;
  nextRunLabel: string;
  stepCount: number;
  checklistItemCount: number;
  averageDurationLabel: string;
  isPaused: boolean;
};

export default Workflow;
