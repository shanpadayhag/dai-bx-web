import backendBoardPropertySource from '@/features/board/data_sources/backend/board-property-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type { PropertyOptionRecord } from '@/features/board/entities/board-record';

const deletePropertyOption = (optionId: PropertyOptionRecord['id']): Promise<BoardRecord> =>
  backendBoardPropertySource.deleteOption(optionId);

export default deletePropertyOption;
