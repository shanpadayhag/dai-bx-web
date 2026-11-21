import { useState } from 'react';
import type AppError from '@/core/app-error';
import type NotificationSettings from '@/features/notifications/entities/notification-settings';
import type { ThisDeviceFacts } from '@/features/notifications/entities/this-device-status';

export type NotificationBusyAction = 'turn-on' | 'turn-off' | 'test' | 'remove';

const useNotificationStates = () => {
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(
    null,
  );
  const [thisDeviceFacts, setThisDeviceFacts] = useState<ThisDeviceFacts | null>(null);
  const [loadError, setLoadError] = useState<AppError | null>(null);
  const [busyAction, setBusyAction] = useState<NotificationBusyAction | null>(null);
  const [removeTargetDeviceId, setRemoveTargetDeviceId] = useState<string | null>(null);

  return {
    notificationSettings,
    setNotificationSettings,
    thisDeviceFacts,
    setThisDeviceFacts,
    loadError,
    setLoadError,
    busyAction,
    setBusyAction,
    removeTargetDeviceId,
    setRemoveTargetDeviceId,
  };
};

export default useNotificationStates;
