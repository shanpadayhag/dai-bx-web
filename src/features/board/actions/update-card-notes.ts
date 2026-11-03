import AppError from '@/core/app-error';
import backendCardSource from '@/features/board/data_sources/backend/card-source';
import type { BoardCardRecord } from '@/features/board/entities/board-record';

export const CARD_NOTES_MAX_CHARACTERS = 20000;

type UpdateCardNotesParams = {
  cardId: BoardCardRecord['id'];
  notes: string;
};

const updateCardNotes = async (params: UpdateCardNotesParams): Promise<void> => {
  if ([...params.notes].length > CARD_NOTES_MAX_CHARACTERS) {
    throw new AppError('Notes are too long', 'Keep a card’s notes under 20,000 characters.');
  }
  await backendCardSource.update(params.cardId, { notes: params.notes });
};

export default updateCardNotes;
