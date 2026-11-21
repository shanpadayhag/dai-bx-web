import { useCallback, useState } from 'react';
import { toast } from 'sonner';
import reportAppError from '@/core/report-app-error';
import findNotificationSettings from '@/features/notifications/actions/find-notification-settings';
import findThisDevice from '@/features/notifications/actions/find-this-device';
import turnOnNotifications from '@/features/notifications/actions/turn-on-notifications';
import type { ThisDeviceFacts } from '@/features/notifications/entities/this-device-status';

const useNotificationBellEvents = () => {
  const [thisDeviceFacts, setThisDeviceFacts] = useState<ThisDeviceFacts | null>(null);
  const [isTurningOn, setIsTurningOn] = useState(false);

  const handleRefresh = useCallback(() => setThisDeviceFacts(findThisDevice()), []);

  const handleTurnOn = useCallback(async () => {
    setIsTurningOn(true);
    try {
      const notificationSettings = await findNotificationSettings();
      await turnOnNotifications({
        applicationServerKey: notificationSettings.applicationServerKey,
      });
      toast.success('Notifications are on', {
        description: 'Check-ins and reminders now reach this device.',
      });
    } catch (turnOnError) {
      reportAppError(turnOnError);
    } finally {
      setIsTurningOn(false);
      setThisDeviceFacts(findThisDevice());
    }
  }, []);

  return { thisDeviceFacts, isTurningOn, handleRefresh, handleTurnOn };
};

export default useNotificationBellEvents;
