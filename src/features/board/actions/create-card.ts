import AppError from '@/core/app-error';
import backendCardSource from '@/features/board/data_sources/backend/card-source';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardListRecord } from '@/features/board/entities/board-record';

type CreateCardParams = {
  listId: BoardListRecord['id'];
  cardTitle: string;
};

export const readCardTitle = (cardTitle: string): string => {
  const trimmedCardTitle = cardTitle.trim();
  if (trimmedCardTitle === '') {
    throw new AppError('Name the card', 'A card needs a title.');
  }
  return trimmedCardTitle;
};

const createCard = (params: CreateCardParams): Promise<BoardRecord> =>
  backendCardSource.create(params.listId, readCardTitle(params.cardTitle));

export default createCard;
