import type CardPropertyValue from '@/features/board/entities/card-property-value';

type BoardCard = {
  id: string;
  title: string;
  dueDate: string | null;
  dueTime: string | null;
  values: CardPropertyValue[];
  linkedTaskCount: number;
  doneLinkedTaskCount: number;
};

export default BoardCard;
