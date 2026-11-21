import backendNotificationSettingsSource from '@/features/notifications/data_sources/backend/notification-settings-source';
import type NotificationSettings from '@/features/notifications/entities/notification-settings';
import type { NotificationChanges } from '@/features/notifications/entities/notification-settings';

type UpdateNotificationSettingsParams = {
  notificationChanges: NotificationChanges;
};

const updateNotificationSettings = (
  params: UpdateNotificationSettingsParams,
): Promise<NotificationSettings> =>
  backendNotificationSettingsSource.update(params.notificationChanges);

export default updateNotificationSettings;
