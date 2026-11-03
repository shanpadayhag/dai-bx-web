import backendBoardPropertySource from '@/features/board/data_sources/backend/board-property-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type { PropertyOptionRecord } from '@/features/board/entities/board-record';

type MovePropertyOptionParams = {
  optionId: PropertyOptionRecord['id'];
  position: number;
};

const movePropertyOption = (params: MovePropertyOptionParams): Promise<BoardRecord> =>
  backendBoardPropertySource.moveOption(params.optionId, params.position);

export default movePropertyOption;
