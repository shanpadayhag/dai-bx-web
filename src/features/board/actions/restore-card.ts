import backendCardSource from '@/features/board/data_sources/backend/card-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardCardRecord } from '@/features/board/entities/board-record';

const restoreCard = (cardId: BoardCardRecord['id']): Promise<BoardRecord> =>
  backendCardSource.restore(cardId);

export default restoreCard;
