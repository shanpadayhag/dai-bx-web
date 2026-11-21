import browserPushSource from '@/features/notifications/data_sources/browser/browser-push-source';
import thisDeviceStore from '@/features/notifications/data_sources/browser/this-device-store';
import pushSupport from '@/features/notifications/entities/push-support';
import type { ThisDeviceFacts } from '@/features/notifications/entities/this-device-status';

const findThisDevice = (): ThisDeviceFacts => ({
  pushSupport: pushSupport(browserPushSource.readEnvironment()),
  permission: browserPushSource.readPermission(),
  thisDeviceId: thisDeviceStore.read(),
});

export default findThisDevice;
