import backendBoardSource from '@/features/board/data_sources/backend/board-source';
import type Board from '@/features/board/entities/board';

const deleteBoard = async (boardId: Board['id']): Promise<void> => {
  await backendBoardSource.delete(boardId);
};

export default deleteBoard;
