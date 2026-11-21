import { vi } from 'vitest';

type FakeSubscription = {
  endpoint: string;
  toJSON: () => { endpoint: string; keys: { p256dh: string; auth: string } };
  unsubscribe: () => Promise<boolean>;
};

type FakeBrowserPushOptions = {
  permission?: NotificationPermission;
  answeredPermission?: NotificationPermission;
  hasSubscription?: boolean;
  userAgent?: string;
};

export const FAKE_ENDPOINT = 'https://fcm.googleapis.com/fcm/send/this-browser';
export const MAC_CHROME_USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const installFakeBrowserPush = (fakeOptions: FakeBrowserPushOptions = {}) => {
  let currentSubscription: FakeSubscription | null = null;
  const unsubscribe = vi.fn(async () => {
    currentSubscription = null;
    return true;
  });
  const makeSubscription = (): FakeSubscription => ({
    endpoint: FAKE_ENDPOINT,
    toJSON: () => ({
      endpoint: FAKE_ENDPOINT,
      keys: { p256dh: 'device-key', auth: 'auth-secret' },
    }),
    unsubscribe,
  });
  if (fakeOptions.hasSubscription) currentSubscription = makeSubscription();
  const subscribe = vi.fn(async () => {
    currentSubscription = makeSubscription();
    return currentSubscription;
  });
  const pushManager = { getSubscription: vi.fn(async () => currentSubscription), subscribe };
  const registration = { pushManager };
  const register = vi.fn(async () => registration);
  const fakeNotification: {
    permission: NotificationPermission;
    requestPermission: () => Promise<NotificationPermission>;
  } = {
    permission: fakeOptions.permission ?? 'default',
    requestPermission: async () => fakeNotification.permission,
  };
  const requestPermission = vi.fn(async () => {
    fakeNotification.permission = fakeOptions.answeredPermission ?? 'granted';
    return fakeNotification.permission;
  });
  fakeNotification.requestPermission = requestPermission;

  vi.stubGlobal('PushManager', class {});
  vi.stubGlobal('Notification', fakeNotification);
  Object.defineProperty(window.navigator, 'serviceWorker', {
    configurable: true,
    value: {
      register,
      ready: Promise.resolve(registration),
      getRegistration: vi.fn(async () => registration),
    },
  });
  vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(
    fakeOptions.userAgent ?? MAC_CHROME_USER_AGENT,
  );

  return {
    subscribe,
    unsubscribe,
    register,
    requestPermission,
    hasSubscription: () => currentSubscription !== null,
  };
};

export const removeFakeBrowserPush = () => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  Reflect.deleteProperty(window.navigator, 'serviceWorker');
};

export default installFakeBrowserPush;
