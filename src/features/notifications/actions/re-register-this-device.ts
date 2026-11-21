import { deviceTimeZone } from '@/core/time-zone';
import backendPushDeviceSource from '@/features/notifications/data_sources/backend/push-device-source';
import browserPushSource from '@/features/notifications/data_sources/browser/browser-push-source';
import thisDeviceStore from '@/features/notifications/data_sources/browser/this-device-store';
import deviceName from '@/features/notifications/entities/device-name';
import pushSupport from '@/features/notifications/entities/push-support';

const reRegisterThisDevice = async (): Promise<string | null> => {
  if (pushSupport(browserPushSource.readEnvironment()) !== 'supported') return null;
  await browserPushSource.registerWorker();
  const browserSubscription =
    browserPushSource.readPermission() === 'granted'
      ? await browserPushSource.findSubscription()
      : null;
  if (browserSubscription === null) {
    thisDeviceStore.write(null);
    return null;
  }
  const deviceDetails = browserPushSource.deviceDetails();
  const pushDevice = await backendPushDeviceSource.register({
    ...browserSubscription,
    deviceName: deviceName(deviceDetails.userAgent, deviceDetails.maxTouchPoints),
    timeZone: deviceTimeZone(),
  });
  thisDeviceStore.write(pushDevice.id);
  return pushDevice.id;
};

export default reRegisterThisDevice;
