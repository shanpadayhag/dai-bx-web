import AppError from '@/core/app-error';
import backendCardSource, {
  type CardValueInput,
} from '@/features/board/data_sources/backend/card-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardCardRecord, BoardPropertyRecord } from '@/features/board/entities/board-record';
import BoardPropertyKind from '@/features/board/enums/board-property-kind';

type SetCardValueParams = {
  cardId: BoardCardRecord['id'];
  propertyId: BoardPropertyRecord['id'];
  cardValueInput: CardValueInput;
};

const DECIMAL_PATTERN = /^-?0*\d{1,15}(\.\d{1,6})?$/;

export const readCardValueInput = (
  kind: BoardPropertyKind,
  enteredValue: string,
): CardValueInput | null => {
  const trimmedValue = enteredValue.trim();
  if (trimmedValue === '') return null;
  if (kind === BoardPropertyKind.Choice) return { optionId: trimmedValue };
  if (kind === BoardPropertyKind.Text) return { text: trimmedValue };
  if (!DECIMAL_PATTERN.test(trimmedValue)) {
    throw new AppError(
      'Check the number',
      'Use up to 15 digits before the point and 6 after, like 2.50.',
    );
  }
  return { number: trimmedValue };
};

const setCardValue = (params: SetCardValueParams): Promise<BoardRecord> =>
  backendCardSource.setValue(params.cardId, params.propertyId, params.cardValueInput);

export default setCardValue;
