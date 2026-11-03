import backendBoardSource from '@/features/board/data_sources/backend/board-source';
import { readBoardName } from '@/features/board/actions/create-board';
import type Board from '@/features/board/entities/board';
import type BoardRecord from '@/features/board/entities/board-record';

type RenameBoardParams = {
  boardId: Board['id'];
  boardName: string;
};

const renameBoard = (params: RenameBoardParams): Promise<BoardRecord> =>
  backendBoardSource.rename(params.boardId, readBoardName(params.boardName));

export default renameBoard;
