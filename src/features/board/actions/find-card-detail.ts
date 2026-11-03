import backendCardSource from '@/features/board/data_sources/backend/card-source';
import type { BoardCardRecord } from '@/features/board/entities/board-record';
import type CardDetailRecord from '@/features/board/entities/card-detail-record';

const findCardDetail = (cardId: BoardCardRecord['id']): Promise<CardDetailRecord> =>
  backendCardSource.find(cardId);

export default findCardDetail;
