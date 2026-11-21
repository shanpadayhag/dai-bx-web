import { useCallback } from 'react';
import { toast } from 'sonner';
import AppError from '@/core/app-error';
import hidePopover, { showPopover } from '@/core/popover';
import reportAppError from '@/core/report-app-error';
import findNotificationSettings from '@/features/notifications/actions/find-notification-settings';
import findThisDevice from '@/features/notifications/actions/find-this-device';
import removePushDevice from '@/features/notifications/actions/remove-push-device';
import sendTestNotification from '@/features/notifications/actions/send-test-notification';
import turnOffNotifications from '@/features/notifications/actions/turn-off-notifications';
import turnOnNotifications from '@/features/notifications/actions/turn-on-notifications';
import updateNotificationSettings from '@/features/notifications/actions/update-notification-settings';
import { REMOVE_DEVICE_DIALOG_ID } from '@/features/notifications/components/remove-device-dialog';
import type { NotificationSwitches } from '@/features/notifications/entities/notification-settings';
import type useNotificationStates from '@/features/notifications/states/use-notification-states';
import type { NotificationBusyAction } from '@/features/notifications/states/use-notification-states';

const LOAD_FAILED_ERROR = new AppError(
  'Couldn’t load notifications',
  'Check your connection and try again.',
);

const useNotificationEvents = (states: ReturnType<typeof useNotificationStates>) => {
  const {
    notificationSettings,
    setNotificationSettings,
    setThisDeviceFacts,
    setLoadError,
    setBusyAction,
    removeTargetDeviceId,
    setRemoveTargetDeviceId,
  } = states;

  const handleLoad = useCallback(async () => {
    setLoadError(null);
    setThisDeviceFacts(findThisDevice());
    try {
      setNotificationSettings(await findNotificationSettings());
    } catch (loadError) {
      setLoadError(loadError instanceof AppError ? loadError : LOAD_FAILED_ERROR);
    }
  }, [setLoadError, setNotificationSettings, setThisDeviceFacts]);

  const runBusy = useCallback(
    async (busyAction: NotificationBusyAction, busyWork: () => Promise<void>) => {
      setBusyAction(busyAction);
      try {
        await busyWork();
      } catch (busyError) {
        reportAppError(busyError);
      } finally {
        setBusyAction(null);
        await handleLoad();
      }
    },
    [handleLoad, setBusyAction],
  );

  const handleTurnOn = useCallback(() => {
    if (notificationSettings === null) return;
    void runBusy('turn-on', async () => {
      await turnOnNotifications({
        applicationServerKey: notificationSettings.applicationServerKey,
      });
      toast.success('Notifications are on', {
        description: 'Check-ins and reminders now reach this device.',
      });
    });
  }, [notificationSettings, runBusy]);

  const handleTurnOff = useCallback(() => {
    void runBusy('turn-off', async () => {
      await turnOffNotifications();
      toast.success('Notifications are off on this device');
    });
  }, [runBusy]);

  const handleSendTest = useCallback(
    (deviceId: string) => {
      void runBusy('test', async () => {
        await sendTestNotification({ deviceId });
        toast.success('Test sent', { description: 'It should arrive in a few seconds.' });
      });
    },
    [runBusy],
  );

  const handleToggleSwitch = useCallback(
    (switchName: keyof NotificationSwitches) => {
      if (notificationSettings === null) return;
      const changedValue = !notificationSettings[switchName];
      setNotificationSettings({ ...notificationSettings, [switchName]: changedValue });
      void updateNotificationSettings({ notificationChanges: { [switchName]: changedValue } })
        .then(setNotificationSettings)
        .catch((saveError: unknown) => {
          setNotificationSettings(notificationSettings);
          reportAppError(saveError);
        });
    },
    [notificationSettings, setNotificationSettings],
  );

  const handleRequestRemove = useCallback(
    (deviceId: string) => {
      setRemoveTargetDeviceId(deviceId);
      showPopover(REMOVE_DEVICE_DIALOG_ID);
    },
    [setRemoveTargetDeviceId],
  );

  const handleConfirmRemove = useCallback(() => {
    if (removeTargetDeviceId === null) return;
    void runBusy('remove', async () => {
      await removePushDevice({ deviceId: removeTargetDeviceId });
      hidePopover(REMOVE_DEVICE_DIALOG_ID);
      setRemoveTargetDeviceId(null);
    });
  }, [removeTargetDeviceId, runBusy, setRemoveTargetDeviceId]);

  return {
    handleLoad,
    handleTurnOn,
    handleTurnOff,
    handleSendTest,
    handleToggleSwitch,
    handleRequestRemove,
    handleConfirmRemove,
  };
};

export default useNotificationEvents;
