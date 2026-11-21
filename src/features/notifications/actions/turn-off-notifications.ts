import { ApiError } from '@/core/api/api-error';
import backendPushDeviceSource from '@/features/notifications/data_sources/backend/push-device-source';
import browserPushSource from '@/features/notifications/data_sources/browser/browser-push-source';
import thisDeviceStore from '@/features/notifications/data_sources/browser/this-device-store';

const NOT_FOUND_STATUS = 404;

const turnOffNotifications = async (): Promise<void> => {
  const thisDeviceId = thisDeviceStore.read();
  if (thisDeviceId !== null) {
    try {
      await backendPushDeviceSource.remove(thisDeviceId);
    } catch (removeError) {
      if (!(removeError instanceof ApiError && removeError.status === NOT_FOUND_STATUS)) {
        throw removeError;
      }
    }
  }
  await browserPushSource.unsubscribe();
  thisDeviceStore.write(null);
};

export default turnOffNotifications;
