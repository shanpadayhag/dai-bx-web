import base64UrlToBytes from '@/features/notifications/entities/base64-url';
import type { PushEnvironment } from '@/features/notifications/entities/push-support';

const SERVICE_WORKER_PATH = '/sw.js';
const APPLE_MOBILE_PATTERN = /iPhone|iPad|iPod/;
const TOUCH_MAC_POINT_COUNT = 1;

export type BrowserSubscription = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type BrowserPermission = NotificationPermission;

const toBrowserSubscription = (pushSubscription: PushSubscription): BrowserSubscription => {
  const subscriptionJson = pushSubscription.toJSON();
  return {
    endpoint: pushSubscription.endpoint,
    keys: {
      p256dh: subscriptionJson.keys?.p256dh ?? '',
      auth: subscriptionJson.keys?.auth ?? '',
    },
  };
};

const readyRegistration = async (): Promise<ServiceWorkerRegistration> => {
  await navigator.serviceWorker.register(SERVICE_WORKER_PATH, { scope: '/' });
  return navigator.serviceWorker.ready;
};

const browserPushSource = {
  readEnvironment: (): PushEnvironment => ({
    hasServiceWorker: 'serviceWorker' in navigator,
    hasPushManager: 'PushManager' in window,
    hasNotification: 'Notification' in window,
    isAppleMobile:
      APPLE_MOBILE_PATTERN.test(navigator.userAgent) ||
      (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > TOUCH_MAC_POINT_COUNT),
    isStandalone: window.matchMedia('(display-mode: standalone)').matches,
  }),
  readPermission: (): BrowserPermission =>
    'Notification' in window ? Notification.permission : 'denied',
  askPermission: (): Promise<BrowserPermission> => Notification.requestPermission(),
  registerWorker: async (): Promise<void> => {
    await navigator.serviceWorker.register(SERVICE_WORKER_PATH, { scope: '/' });
  },
  findSubscription: async (): Promise<BrowserSubscription | null> => {
    const registration = await readyRegistration();
    const pushSubscription = await registration.pushManager.getSubscription();
    return pushSubscription === null ? null : toBrowserSubscription(pushSubscription);
  },
  subscribe: async (applicationServerKey: string): Promise<BrowserSubscription> => {
    const registration = await readyRegistration();
    const pushSubscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToBytes(applicationServerKey),
    });
    return toBrowserSubscription(pushSubscription);
  },
  unsubscribe: async (): Promise<void> => {
    if (!('serviceWorker' in navigator)) return;
    const registration = await navigator.serviceWorker.getRegistration('/');
    const pushSubscription = await registration?.pushManager.getSubscription();
    await pushSubscription?.unsubscribe();
  },
  deviceDetails: () => ({
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
  }),
};

export default browserPushSource;
