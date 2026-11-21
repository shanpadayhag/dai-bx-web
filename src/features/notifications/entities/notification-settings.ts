import type PushDevice from '@/features/notifications/entities/push-device';

export type NotificationSwitches = {
  checkIns: boolean;
  scheduleRuns: boolean;
  blocksStarting: boolean;
  quietOutsideWorkingHours: boolean;
};

export type NotificationChanges = Partial<NotificationSwitches>;

type NotificationSettings = NotificationSwitches & {
  applicationServerKey: string;
  devices: PushDevice[];
};

export default NotificationSettings;
