import type BoardCard from '@/features/board/entities/board-card';
import type LinkedTask from '@/features/board/entities/linked-task';

type CardDetail = {
  card: BoardCard;
  listName: string;
  notes: string;
  linkedTasks: LinkedTask[];
};

export default CardDetail;
