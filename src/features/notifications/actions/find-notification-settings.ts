import backendNotificationSettingsSource from '@/features/notifications/data_sources/backend/notification-settings-source';
import type NotificationSettings from '@/features/notifications/entities/notification-settings';

const findNotificationSettings = (): Promise<NotificationSettings> =>
  backendNotificationSettingsSource.find();

export default findNotificationSettings;
