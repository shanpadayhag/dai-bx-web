import backendCardSource from '@/features/board/data_sources/backend/card-source';
import type { BoardCardRecord } from '@/features/board/entities/board-record';
import type CardMove from '@/features/board/entities/card-move';
import { cardMoveFromRecord } from '@/features/board/entities/card-move';

type CardHistory = {
  moves: CardMove[];
  hasOlderMoves: boolean;
};

const findCardHistory = async (
  cardId: BoardCardRecord['id'],
  olderThanMoveId: string | null,
): Promise<CardHistory> => {
  const historyRecord = await backendCardSource.findHistory(cardId, olderThanMoveId);
  return {
    moves: historyRecord.moves.map(cardMoveFromRecord),
    hasOlderMoves: historyRecord.hasMore,
  };
};

export default findCardHistory;
