import AppError from '@/core/app-error';
import backendBoardListSource from '@/features/board/data_sources/backend/board-list-source';
import type Board from '@/features/board/entities/board';
import type BoardRecord from '@/features/board/entities/board-record';

type CreateBoardListParams = {
  boardId: Board['id'];
  listName: string;
};

export const readListName = (listName: string): string => {
  const trimmedListName = listName.trim();
  if (trimmedListName === '') {
    throw new AppError('Name the list', 'Give it a name, like Backlog or Doing.');
  }
  return trimmedListName;
};

const createBoardList = (params: CreateBoardListParams): Promise<BoardRecord> =>
  backendBoardListSource.create(params.boardId, readListName(params.listName));

export default createBoardList;
