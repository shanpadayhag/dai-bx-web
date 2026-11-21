import { ApiError } from '@/core/api/api-error';
import backendPushDeviceSource from '@/features/notifications/data_sources/backend/push-device-source';
import thisDeviceStore from '@/features/notifications/data_sources/browser/this-device-store';

const GONE_STATUS = 410;

type SendTestNotificationParams = {
  deviceId: string;
};

const sendTestNotification = async (params: SendTestNotificationParams): Promise<void> => {
  try {
    await backendPushDeviceSource.sendTest(params.deviceId);
  } catch (sendError) {
    const isGone = sendError instanceof ApiError && sendError.status === GONE_STATUS;
    if (isGone && thisDeviceStore.read() === params.deviceId) thisDeviceStore.write(null);
    throw sendError;
  }
};

export default sendTestNotification;
