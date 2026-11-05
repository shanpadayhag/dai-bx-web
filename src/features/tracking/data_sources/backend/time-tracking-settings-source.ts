import apiClient from '@/core/api/api-client';
import type TimeTrackingSettings from '@/features/tracking/entities/time-tracking-settings';
import type { TimeTrackingChanges } from '@/features/tracking/entities/time-tracking-settings';

const backendTimeTrackingSettingsSource = {
  find: () => apiClient.get<TimeTrackingSettings>('/account/time-tracking'),
  update: (timeTrackingChanges: TimeTrackingChanges) =>
    apiClient.patch<TimeTrackingSettings>('/account/time-tracking', timeTrackingChanges),
};

export default backendTimeTrackingSettingsSource;
