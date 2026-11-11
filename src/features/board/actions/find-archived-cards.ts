import backendCardSource from '@/features/board/data_sources/backend/card-source';
import type Board from '@/features/board/entities/board';
import {
  archivedCardFromRecord,
  type ArchivedCardsPage,
} from '@/features/board/entities/card-archive';

const findArchivedCards = async (
  boardId: Board['id'],
  olderThanCardId: string | null,
): Promise<ArchivedCardsPage> => {
  const archivedRecord = await backendCardSource.listArchived(boardId, olderThanCardId);
  return {
    cards: archivedRecord.cards.map(archivedCardFromRecord),
    hasOlderCards: archivedRecord.hasMore,
  };
};

export default findArchivedCards;
