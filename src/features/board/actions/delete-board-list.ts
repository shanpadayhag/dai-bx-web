import backendBoardListSource from '@/features/board/data_sources/backend/board-list-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardListRecord } from '@/features/board/entities/board-record';

const deleteBoardList = (listId: BoardListRecord['id']): Promise<BoardRecord> =>
  backendBoardListSource.delete(listId);

export default deleteBoardList;
