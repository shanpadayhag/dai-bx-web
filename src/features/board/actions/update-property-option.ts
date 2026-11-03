import { readOptionName } from '@/features/board/actions/create-board-property';
import backendBoardPropertySource from '@/features/board/data_sources/backend/board-property-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type { PropertyOptionRecord } from '@/features/board/entities/board-record';

type UpdatePropertyOptionParams = {
  optionId: PropertyOptionRecord['id'];
  optionName?: string;
  color?: string | null;
};

const updatePropertyOption = (params: UpdatePropertyOptionParams): Promise<BoardRecord> =>
  backendBoardPropertySource.updateOption(params.optionId, {
    ...(params.optionName === undefined ? {} : { name: readOptionName(params.optionName) }),
    ...(params.color === undefined ? {} : { color: params.color }),
  });

export default updatePropertyOption;
