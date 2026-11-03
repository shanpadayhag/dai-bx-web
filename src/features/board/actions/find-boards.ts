import backendBoardSource from '@/features/board/data_sources/backend/board-source';
import type Board from '@/features/board/entities/board';

const findBoards = (): Promise<Board[]> => backendBoardSource.findAll();

export default findBoards;
