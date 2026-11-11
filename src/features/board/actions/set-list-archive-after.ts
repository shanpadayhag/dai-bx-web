import { ApiError } from '@/core/api/api-error';
import backendBoardListSource from '@/features/board/data_sources/backend/board-list-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardListRecord } from '@/features/board/entities/board-record';

const UNPROCESSABLE_STATUS = 422;

type ArchiveAfterAnswer = { boardRecord: BoardRecord } | { hint: string };

const setListArchiveAfter = async (
  listId: BoardListRecord['id'],
  enteredText: string,
): Promise<ArchiveAfterAnswer> => {
  const trimmedText = enteredText.trim();
  try {
    return {
      boardRecord: await backendBoardListSource.setArchiveAfter(
        listId,
        trimmedText === '' ? null : trimmedText,
      ),
    };
  } catch (saveError) {
    if (saveError instanceof ApiError && saveError.status === UNPROCESSABLE_STATUS) {
      return { hint: saveError.description };
    }
    throw saveError;
  }
};

export type { ArchiveAfterAnswer };
export default setListArchiveAfter;
