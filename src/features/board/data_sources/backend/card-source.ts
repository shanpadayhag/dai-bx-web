import apiClient from '@/core/api/api-client';
import type BoardRecord from '@/features/board/entities/board-record';
import type {
  BoardCardRecord,
  BoardListRecord,
  BoardPropertyRecord,
} from '@/features/board/entities/board-record';
import type Board from '@/features/board/entities/board';
import type { ArchivedCardsRecord } from '@/features/board/entities/card-archive';
import type CardDetailRecord from '@/features/board/entities/card-detail-record';
import type { CardHistoryRecord } from '@/features/board/entities/card-move';
import type CardTriggers from '@/features/board/entities/card-triggers';

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

export type TriggerChoice = {
  startedListId: BoardListRecord['id'] | null;
  finishedListId: BoardListRecord['id'] | null;
};

const beforeSearch = (beforeId: string | null) =>
  beforeId === null ? '' : `?${new URLSearchParams({ before: beforeId }).toString()}`;

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
  saveTriggers: (cardId: BoardCardRecord['id'], triggerChoice: TriggerChoice) =>
    apiClient.put<{ triggers: CardTriggers }>(`/cards/${cardId}/triggers`, triggerChoice),
  findHistory: (cardId: BoardCardRecord['id'], beforeMoveId: string | null) =>
    apiClient.get<CardHistoryRecord>(`/cards/${cardId}/history${beforeSearch(beforeMoveId)}`),
  archive: (cardId: BoardCardRecord['id']) =>
    apiClient.post<{ status: 'archived' }>(`/cards/${cardId}/archive`),
  restore: (cardId: BoardCardRecord['id']) =>
    apiClient.post<BoardRecord>(`/cards/${cardId}/restore`),
  listArchived: (boardId: Board['id'], beforeCardId: string | null) =>
    apiClient.get<ArchivedCardsRecord>(
      `/boards/${boardId}/archived-cards${beforeSearch(beforeCardId)}`,
    ),
};

export default backendCardSource;
