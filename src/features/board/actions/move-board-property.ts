import backendBoardPropertySource from '@/features/board/data_sources/backend/board-property-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardPropertyRecord } from '@/features/board/entities/board-record';

type MoveBoardPropertyParams = {
  propertyId: BoardPropertyRecord['id'];
  position: number;
};

const moveBoardProperty = (params: MoveBoardPropertyParams): Promise<BoardRecord> =>
  backendBoardPropertySource.move(params.propertyId, params.position);

export default moveBoardProperty;
