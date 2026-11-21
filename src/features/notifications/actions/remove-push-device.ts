import backendPushDeviceSource from '@/features/notifications/data_sources/backend/push-device-source';
import thisDeviceStore from '@/features/notifications/data_sources/browser/this-device-store';
import unsubscribeThisBrowser from '@/features/notifications/actions/unsubscribe-this-browser';

type RemovePushDeviceParams = {
  deviceId: string;
};

const removePushDevice = async (params: RemovePushDeviceParams): Promise<void> => {
  await backendPushDeviceSource.remove(params.deviceId);
  if (thisDeviceStore.read() === params.deviceId) await unsubscribeThisBrowser();
};

export default removePushDevice;
