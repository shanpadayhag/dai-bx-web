import { readPropertyName } from '@/features/board/actions/create-board-property';
import backendBoardPropertySource from '@/features/board/data_sources/backend/board-property-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardPropertyRecord } from '@/features/board/entities/board-record';

type RenameBoardPropertyParams = {
  propertyId: BoardPropertyRecord['id'];
  propertyName: string;
};

const renameBoardProperty = (params: RenameBoardPropertyParams): Promise<BoardRecord> =>
  backendBoardPropertySource.rename(params.propertyId, readPropertyName(params.propertyName));

export default renameBoardProperty;
