import apiClient from '@/core/api/api-client';
import type FinishedItemRecord from '@/features/tracking/entities/finished-item-record';
import type RunningItemRecord from '@/features/tracking/entities/running-item-record';

type FinishRequest = {
  endsAt: string;
  markDone: boolean;
};

const backendTrackingSource = {
  listRunning: () => apiClient.get<RunningItemRecord[]>('/tracking/running'),
  startTask: (taskId: string) => apiClient.post<RunningItemRecord>(`/tasks/${taskId}/start`),
  startCard: (cardId: string) => apiClient.post<RunningItemRecord>(`/cards/${cardId}/start`),
  checkIn: (eventId: RunningItemRecord['id']) =>
    apiClient.post<RunningItemRecord>(`/tracking/${eventId}/check-in`),
  finish: (eventId: RunningItemRecord['id'], finishRequest: FinishRequest) =>
    apiClient.post<FinishedItemRecord>(`/tracking/${eventId}/finish`, finishRequest),
};

export type { FinishRequest };
export default backendTrackingSource;
