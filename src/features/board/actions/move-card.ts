import backendCardSource, {
  type CardMoveTarget,
} from '@/features/board/data_sources/backend/card-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardCardRecord } from '@/features/board/entities/board-record';

type MoveCardParams = {
  cardId: BoardCardRecord['id'];
  moveTarget: CardMoveTarget;
};

const moveCard = (params: MoveCardParams): Promise<BoardRecord> =>
  backendCardSource.move(params.cardId, params.moveTarget);

export default moveCard;
