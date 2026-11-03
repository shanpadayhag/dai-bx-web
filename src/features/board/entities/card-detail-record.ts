import type { BoardCardRecord } from '@/features/board/entities/board-record';
import type LinkedTask from '@/features/board/entities/linked-task';

type CardDetailRecord = {
  card: BoardCardRecord;
  notes: string;
  linkedTasks: LinkedTask[];
};

export default CardDetailRecord;
