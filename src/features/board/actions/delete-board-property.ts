import backendBoardPropertySource from '@/features/board/data_sources/backend/board-property-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardPropertyRecord } from '@/features/board/entities/board-record';

const deleteBoardProperty = (propertyId: BoardPropertyRecord['id']): Promise<BoardRecord> =>
  backendBoardPropertySource.delete(propertyId);

export default deleteBoardProperty;
