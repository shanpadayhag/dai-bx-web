import { readCardTitle } from '@/features/board/actions/create-card';
import backendCardSource from '@/features/board/data_sources/backend/card-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardCardRecord } from '@/features/board/entities/board-record';

type RenameCardParams = {
  cardId: BoardCardRecord['id'];
  cardTitle: string;
};

const renameCard = (params: RenameCardParams): Promise<BoardRecord> =>
  backendCardSource.update(params.cardId, { title: readCardTitle(params.cardTitle) });

export default renameCard;
