import apiClient from '@/core/api/api-client';
import type Board from '@/features/board/entities/board';
import type BoardRecord from '@/features/board/entities/board-record';

type DeletedAnswer = {
  status: 'deleted';
};

const backendBoardSource = {
  findAll: () => apiClient.get<Board[]>('/boards'),
  find: (boardId: Board['id']) => apiClient.get<BoardRecord>(`/boards/${boardId}`),
  create: (boardName: string) => apiClient.post<BoardRecord>('/boards', { name: boardName }),
  rename: (boardId: Board['id'], boardName: string) =>
    apiClient.patch<BoardRecord>(`/boards/${boardId}`, { name: boardName }),
  delete: (boardId: Board['id']) => apiClient.delete<DeletedAnswer>(`/boards/${boardId}`),
};

export default backendBoardSource;
