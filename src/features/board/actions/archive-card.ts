import backendCardSource from '@/features/board/data_sources/backend/card-source';
import type { BoardCardRecord } from '@/features/board/entities/board-record';

const archiveCard = async (cardId: BoardCardRecord['id']): Promise<void> => {
  await backendCardSource.archive(cardId);
};

export default archiveCard;
