import type CardPropertyValue from '@/features/board/entities/card-property-value';
import type NextMove from '@/features/board/entities/next-move';

type BoardCard = {
  id: string;
  title: string;
  dueDate: string | null;
  dueTime: string | null;
  values: CardPropertyValue[];
  linkedTaskCount: number;
  doneLinkedTaskCount: number;
  nextMove: NextMove | null;
};

export default BoardCard;
