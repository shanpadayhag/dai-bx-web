import AppError from '@/core/app-error';
import backendBoardSource from '@/features/board/data_sources/backend/board-source';
import type BoardRecord from '@/features/board/entities/board-record';

type CreateBoardParams = {
  boardName: string;
};

export const readBoardName = (boardName: string): string => {
  const trimmedBoardName = boardName.trim();
  if (trimmedBoardName === '') {
    throw new AppError('Name the board', 'Give it a name, like Personal or Work.');
  }
  return trimmedBoardName;
};

const createBoard = (params: CreateBoardParams): Promise<BoardRecord> =>
  backendBoardSource.create(readBoardName(params.boardName));

export default createBoard;
