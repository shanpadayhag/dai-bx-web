type BoardCardLabel = {
  name: string;
  tone: 'primary' | 'success' | 'warning' | 'neutral';
};

type BoardCard = {
  id: string;
  title: string;
  labels: BoardCardLabel[];
  checklistDoneCount: number | null;
  checklistItemCount: number | null;
  dueLabel: string | null;
  recurrenceLabel: string | null;
  noteCount: number;
};

export type { BoardCardLabel };
export default BoardCard;
