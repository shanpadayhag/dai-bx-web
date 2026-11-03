import type Board from '@/features/board/entities/board';
import type BoardList from '@/features/board/entities/board-list';
import type BoardProperty from '@/features/board/entities/board-property';

type BoardContents = {
  board: Board;
  lists: BoardList[];
  properties: BoardProperty[];
};

export default BoardContents;
