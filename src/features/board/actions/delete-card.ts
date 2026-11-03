import backendCardSource from '@/features/board/data_sources/backend/card-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardCardRecord } from '@/features/board/entities/board-record';

const deleteCard = (cardId: BoardCardRecord['id']): Promise<BoardRecord> =>
  backendCardSource.delete(cardId);

export default deleteCard;
