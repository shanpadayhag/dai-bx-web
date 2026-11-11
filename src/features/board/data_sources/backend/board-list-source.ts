import apiClient from '@/core/api/api-client';
import type Board from '@/features/board/entities/board';
import type BoardRecord from '@/features/board/entities/board-record';
import type { BoardListRecord } from '@/features/board/entities/board-record';
import type ListExport from '@/features/board/entities/list-export';

const backendBoardListSource = {
  create: (boardId: Board['id'], listName: string) =>
    apiClient.post<BoardRecord>(`/boards/${boardId}/lists`, { name: listName }),
  rename: (listId: BoardListRecord['id'], listName: string) =>
    apiClient.patch<BoardRecord>(`/lists/${listId}`, { name: listName }),
  setArchiveAfter: (listId: BoardListRecord['id'], archiveAfter: string | null) =>
    apiClient.patch<BoardRecord>(`/lists/${listId}`, { archiveAfter }),
  move: (listId: BoardListRecord['id'], position: number) =>
    apiClient.post<BoardRecord>(`/lists/${listId}/move`, { position }),
  delete: (listId: BoardListRecord['id']) => apiClient.delete<BoardRecord>(`/lists/${listId}`),
  export: (listId: BoardListRecord['id']) => apiClient.get<ListExport>(`/lists/${listId}/export`),
};

export default backendBoardListSource;
