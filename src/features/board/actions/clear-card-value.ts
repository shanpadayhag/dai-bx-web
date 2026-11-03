import backendCardSource from '@/features/board/data_sources/backend/card-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardCardRecord, BoardPropertyRecord } from '@/features/board/entities/board-record';

type ClearCardValueParams = {
  cardId: BoardCardRecord['id'];
  propertyId: BoardPropertyRecord['id'];
};

const clearCardValue = (params: ClearCardValueParams): Promise<BoardRecord> =>
  backendCardSource.clearValue(params.cardId, params.propertyId);

export default clearCardValue;
