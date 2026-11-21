import apiClient from '@/core/api/api-client';
import type PushDevice from '@/features/notifications/entities/push-device';
import type { NewPushDevice } from '@/features/notifications/entities/push-device';

type StatusAnswer = { status: string };

const backendPushDeviceSource = {
  register: (newPushDevice: NewPushDevice) =>
    apiClient.post<PushDevice>('/push-devices', newPushDevice),
  remove: (deviceId: string) => apiClient.delete<StatusAnswer>(`/push-devices/${deviceId}`),
  sendTest: (deviceId: string) => apiClient.post<StatusAnswer>(`/push-devices/${deviceId}/test`),
};

export default backendPushDeviceSource;
