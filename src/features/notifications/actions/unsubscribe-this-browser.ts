import browserPushSource from '@/features/notifications/data_sources/browser/browser-push-source';
import thisDeviceStore from '@/features/notifications/data_sources/browser/this-device-store';

const unsubscribeThisBrowser = async (): Promise<void> => {
  thisDeviceStore.write(null);
  try {
    await browserPushSource.unsubscribe();
  } catch {
    return;
  }
};

export default unsubscribeThisBrowser;
