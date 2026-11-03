import backendBoardListSource from '@/features/board/data_sources/backend/board-list-source';
import type { BoardListRecord } from '@/features/board/entities/board-record';
import { formatListForPlanning } from '@/features/board/entities/list-for-planning';

const findListForPlanning = async (listId: BoardListRecord['id']): Promise<string> =>
  formatListForPlanning(await backendBoardListSource.export(listId));

export default findListForPlanning;
