import apiClient from '@/core/api/api-client';
import type BoardRecord from '@/features/board/entities/board-record';
import type {
  BoardCardRecord,
  BoardListRecord,
  BoardPropertyRecord,
} from '@/features/board/entities/board-record';
import type CardDetailRecord from '@/features/board/entities/card-detail-record';

export type CardChanges = {
  title?: string;
  notes?: string;
  dueDate?: string | null;
  dueTime?: string | null;
  renameEvents?: boolean;
};

export type CardMoveTarget = {
  listId: BoardListRecord['id'];
  position: number;
};

export type CardValueInput = { optionId: string } | { text: string } | { number: string };

const backendCardSource = {
  create: (listId: BoardListRecord['id'], cardTitle: string) =>
    apiClient.post<BoardRecord>(`/lists/${listId}/cards`, { title: cardTitle }),
  find: (cardId: BoardCardRecord['id']) => apiClient.get<CardDetailRecord>(`/cards/${cardId}`),
  update: (cardId: BoardCardRecord['id'], cardChanges: CardChanges) =>
    apiClient.patch<BoardRecord>(`/cards/${cardId}`, cardChanges),
  move: (cardId: BoardCardRecord['id'], cardMoveTarget: CardMoveTarget) =>
    apiClient.post<BoardRecord>(`/cards/${cardId}/move`, cardMoveTarget),
  delete: (cardId: BoardCardRecord['id']) => apiClient.delete<BoardRecord>(`/cards/${cardId}`),
  setValue: (
    cardId: BoardCardRecord['id'],
    propertyId: BoardPropertyRecord['id'],
    cardValueInput: CardValueInput,
  ) => apiClient.put<BoardRecord>(`/cards/${cardId}/values/${propertyId}`, cardValueInput),
  clearValue: (cardId: BoardCardRecord['id'], propertyId: BoardPropertyRecord['id']) =>
    apiClient.delete<BoardRecord>(`/cards/${cardId}/values/${propertyId}`),
};

export default backendCardSource;
