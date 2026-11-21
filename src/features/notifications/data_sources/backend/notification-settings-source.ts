import apiClient from '@/core/api/api-client';
import type NotificationSettings from '@/features/notifications/entities/notification-settings';
import type { NotificationChanges } from '@/features/notifications/entities/notification-settings';

const backendNotificationSettingsSource = {
  find: () => apiClient.get<NotificationSettings>('/account/notifications'),
  update: (notificationChanges: NotificationChanges) =>
    apiClient.patch<NotificationSettings>('/account/notifications', notificationChanges),
};

export default backendNotificationSettingsSource;
