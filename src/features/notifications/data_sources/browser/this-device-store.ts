const THIS_DEVICE_KEY = 'daibx:push-device-id';

const thisDeviceStore = {
  read: (): string | null => {
    try {
      return window.localStorage.getItem(THIS_DEVICE_KEY);
    } catch {
      return null;
    }
  },
  write: (deviceId: string | null) => {
    try {
      if (deviceId === null) window.localStorage.removeItem(THIS_DEVICE_KEY);
      else window.localStorage.setItem(THIS_DEVICE_KEY, deviceId);
    } catch {
      return;
    }
  },
};

export default thisDeviceStore;
