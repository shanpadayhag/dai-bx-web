import { ApiError } from '@/core/api/api-error';
import AppError from '@/core/app-error';
import { deviceTimeZone } from '@/core/time-zone';
import backendPushDeviceSource from '@/features/notifications/data_sources/backend/push-device-source';
import browserPushSource from '@/features/notifications/data_sources/browser/browser-push-source';
import thisDeviceStore from '@/features/notifications/data_sources/browser/this-device-store';
import deviceName from '@/features/notifications/entities/device-name';
import type PushDevice from '@/features/notifications/entities/push-device';
import pushSupport from '@/features/notifications/entities/push-support';

const CONFLICT_STATUS = 409;

type TurnOnNotificationsParams = {
  applicationServerKey: string;
};

const turnOnNotifications = async (params: TurnOnNotificationsParams): Promise<PushDevice> => {
  if (pushSupport(browserPushSource.readEnvironment()) !== 'supported') {
    throw new AppError(
      'Not on this browser',
      'This browser can’t show DaiBX notifications. Try Chrome, Edge, Firefox or Safari.',
    );
  }
  const permission = await browserPushSource.askPermission();
  if (permission !== 'granted') {
    throw new AppError(
      'Notifications are blocked',
      'Allow notifications for DaiBX in your browser’s site settings, then try again.',
    );
  }
  const browserSubscription = await browserPushSource.subscribe(params.applicationServerKey);
  const deviceDetails = browserPushSource.deviceDetails();
  try {
    const pushDevice = await backendPushDeviceSource.register({
      ...browserSubscription,
      deviceName: deviceName(deviceDetails.userAgent, deviceDetails.maxTouchPoints),
      timeZone: deviceTimeZone(),
    });
    thisDeviceStore.write(pushDevice.id);
    return pushDevice;
  } catch (registerError) {
    await browserPushSource.unsubscribe();
    if (registerError instanceof ApiError && registerError.status === CONFLICT_STATUS) {
      throw new AppError(
        'Ten devices already',
        'Remove a device below, then turn notifications on here.',
      );
    }
    throw registerError;
  }
};

export default turnOnNotifications;
