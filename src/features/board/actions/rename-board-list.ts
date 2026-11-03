import backendBoardListSource from '@/features/board/data_sources/backend/board-list-source';
import { readListName } from '@/features/board/actions/create-board-list';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardListRecord } from '@/features/board/entities/board-record';

type RenameBoardListParams = {
  listId: BoardListRecord['id'];
  listName: string;
};

const renameBoardList = (params: RenameBoardListParams): Promise<BoardRecord> =>
  backendBoardListSource.rename(params.listId, readListName(params.listName));

export default renameBoardList;
