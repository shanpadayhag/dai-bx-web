import backendBoardSource from '@/features/board/data_sources/backend/board-source';
import type Board from '@/features/board/entities/board';
import type BoardRecord from '@/features/board/entities/board-record';

const findBoard = (boardId: Board['id']): Promise<BoardRecord> => backendBoardSource.find(boardId);

export default findBoard;
