import backendCardSource from '@/features/board/data_sources/backend/card-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardCardRecord } from '@/features/board/entities/board-record';

type UpdateCardDueParams = {
  cardId: BoardCardRecord['id'];
  dueDate: string | null;
  dueTime: string | null;
};

const updateCardDue = (params: UpdateCardDueParams): Promise<BoardRecord> =>
  backendCardSource.update(params.cardId, {
    dueDate: params.dueDate,
    dueTime: params.dueDate === null ? null : params.dueTime,
  });

export default updateCardDue;
