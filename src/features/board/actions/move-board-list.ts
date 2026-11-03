import backendBoardListSource from '@/features/board/data_sources/backend/board-list-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardListRecord } from '@/features/board/entities/board-record';

type MoveBoardListParams = {
  listId: BoardListRecord['id'];
  position: number;
};

const moveBoardList = (params: MoveBoardListParams): Promise<BoardRecord> =>
  backendBoardListSource.move(params.listId, params.position);

export default moveBoardList;
