import apiClient from '@/core/api/api-client';
import type Board from '@/features/board/entities/board';
import type BoardRecord from '@/features/board/entities/board-record';
import type {
  BoardPropertyRecord,
  PropertyOptionRecord,
} from '@/features/board/entities/board-record';
import type BoardPropertyKind from '@/features/board/enums/board-property-kind';

export type NewPropertyOption = {
  name: string;
  color?: string;
};

export type NewBoardProperty = {
  name: string;
  kind: BoardPropertyKind;
  options?: NewPropertyOption[];
};

export type OptionChanges = {
  name?: string;
  color?: string | null;
};

const backendBoardPropertySource = {
  create: (boardId: Board['id'], newBoardProperty: NewBoardProperty) =>
    apiClient.post<BoardRecord>(`/boards/${boardId}/properties`, newBoardProperty),
  rename: (propertyId: BoardPropertyRecord['id'], propertyName: string) =>
    apiClient.patch<BoardRecord>(`/properties/${propertyId}`, { name: propertyName }),
  move: (propertyId: BoardPropertyRecord['id'], position: number) =>
    apiClient.post<BoardRecord>(`/properties/${propertyId}/move`, { position }),
  delete: (propertyId: BoardPropertyRecord['id']) =>
    apiClient.delete<BoardRecord>(`/properties/${propertyId}`),
  createOption: (propertyId: BoardPropertyRecord['id'], newPropertyOption: NewPropertyOption) =>
    apiClient.post<BoardRecord>(`/properties/${propertyId}/options`, newPropertyOption),
  updateOption: (optionId: PropertyOptionRecord['id'], optionChanges: OptionChanges) =>
    apiClient.patch<BoardRecord>(`/options/${optionId}`, optionChanges),
  moveOption: (optionId: PropertyOptionRecord['id'], position: number) =>
    apiClient.post<BoardRecord>(`/options/${optionId}/move`, { position }),
  deleteOption: (optionId: PropertyOptionRecord['id']) =>
    apiClient.delete<BoardRecord>(`/options/${optionId}`),
};

export default backendBoardPropertySource;
