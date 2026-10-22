import BoardCard from '@/features/board/entities/board-card';

type BoardList = {
  id: string;
  name: string;
  cards: BoardCard[];
};

export default BoardList;
