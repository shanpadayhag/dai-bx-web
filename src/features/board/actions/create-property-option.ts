import { readOptionName } from '@/features/board/actions/create-board-property';
import backendBoardPropertySource from '@/features/board/data_sources/backend/board-property-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardPropertyRecord } from '@/features/board/entities/board-record';

type CreatePropertyOptionParams = {
  propertyId: BoardPropertyRecord['id'];
  optionName: string;
};

const createPropertyOption = (params: CreatePropertyOptionParams): Promise<BoardRecord> =>
  backendBoardPropertySource.createOption(params.propertyId, {
    name: readOptionName(params.optionName),
  });

export default createPropertyOption;
