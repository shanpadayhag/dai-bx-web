import { http, HttpResponse } from 'msw';
import { afterEach, expect, test } from 'vitest';
import signOut from '@/features/auth/actions/sign-out';
import reRegisterThisDevice from '@/features/notifications/actions/re-register-this-device';
import removePushDevice from '@/features/notifications/actions/remove-push-device';
import turnOffNotifications from '@/features/notifications/actions/turn-off-notifications';
import turnOnNotifications from '@/features/notifications/actions/turn-on-notifications';
import thisDeviceStore from '@/features/notifications/data_sources/browser/this-device-store';
import type PushDevice from '@/features/notifications/entities/push-device';
import startBackendServer from '@/test-support/backend-server';
import installFakeBrowserPush, {
  FAKE_ENDPOINT,
  removeFakeBrowserPush,
} from '@/test-support/fake-browser-push';

const backendServer = startBackendServer();
const APPLICATION_SERVER_KEY =
  'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM';

const thisDevice: PushDevice = {
  id: 'device-1',
  deviceName: 'Mac · Chrome',
  createdAt: '2026-11-22T10:00:00Z',
  lastDeliveredAt: null,
};

const recordRegistrations = (responseStatus = 201) => {
  const receivedBodies: unknown[] = [];
  backendServer.use(
    http.post('/backend/push-devices', async ({ request }) => {
      receivedBodies.push(await request.json());
      return responseStatus === 409
        ? HttpResponse.json({ error: 'too many devices' }, { status: 409 })
        : HttpResponse.json(thisDevice, { status: responseStatus });
    }),
  );
  return receivedBodies;
};

afterEach(() => {
  removeFakeBrowserPush();
  window.localStorage.clear();
});

test('turning on asks permission, subscribes with the key and registers this device', async () => {
  const fakeBrowserPush = installFakeBrowserPush();
  const receivedBodies = recordRegistrations();

  const pushDevice = await turnOnNotifications({ applicationServerKey: APPLICATION_SERVER_KEY });

  expect(pushDevice).toEqual(thisDevice);
  expect(fakeBrowserPush.requestPermission).toHaveBeenCalled();
  expect(fakeBrowserPush.subscribe).toHaveBeenCalledWith({
    userVisibleOnly: true,
    applicationServerKey: expect.any(Uint8Array),
  });
  expect(receivedBodies).toEqual([
    {
      endpoint: FAKE_ENDPOINT,
      keys: { p256dh: 'device-key', auth: 'auth-secret' },
      deviceName: 'Mac · Chrome',
      timeZone: expect.any(String),
    },
  ]);
  expect(thisDeviceStore.read()).toBe('device-1');
});

test('a refused permission stops before subscribing', async () => {
  const fakeBrowserPush = installFakeBrowserPush({ answeredPermission: 'denied' });

  await expect(
    turnOnNotifications({ applicationServerKey: APPLICATION_SERVER_KEY }),
  ).rejects.toThrow('Notifications are blocked');
  expect(fakeBrowserPush.subscribe).not.toHaveBeenCalled();
});

test('the tenth-device limit unsubscribes the browser again and says what to do', async () => {
  const fakeBrowserPush = installFakeBrowserPush();
  recordRegistrations(409);

  await expect(
    turnOnNotifications({ applicationServerKey: APPLICATION_SERVER_KEY }),
  ).rejects.toThrow('Ten devices already');
  expect(fakeBrowserPush.hasSubscription()).toBe(false);
  expect(thisDeviceStore.read()).toBeNull();
});

test('turning off removes this device and unsubscribes the browser', async () => {
  const fakeBrowserPush = installFakeBrowserPush({ permission: 'granted', hasSubscription: true });
  thisDeviceStore.write('device-1');
  const removedPaths: string[] = [];
  backendServer.use(
    http.delete('/backend/push-devices/:deviceId', ({ request }) => {
      removedPaths.push(new URL(request.url).pathname);
      return HttpResponse.json({ status: 'deleted' });
    }),
  );

  await turnOffNotifications();

  expect(removedPaths).toEqual(['/backend/push-devices/device-1']);
  expect(fakeBrowserPush.hasSubscription()).toBe(false);
  expect(thisDeviceStore.read()).toBeNull();
});

test('opening the app registers the worker and re-registers an existing subscription', async () => {
  const fakeBrowserPush = installFakeBrowserPush({ permission: 'granted', hasSubscription: true });
  const receivedBodies = recordRegistrations(200);

  const thisDeviceId = await reRegisterThisDevice();

  expect(fakeBrowserPush.register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
  expect(thisDeviceId).toBe('device-1');
  expect(receivedBodies).toHaveLength(1);
});

test('opening the app without a subscription forgets the device id and sends nothing', async () => {
  installFakeBrowserPush({ permission: 'granted' });
  thisDeviceStore.write('device-1');
  const receivedBodies = recordRegistrations();

  expect(await reRegisterThisDevice()).toBeNull();
  expect(receivedBodies).toEqual([]);
  expect(thisDeviceStore.read()).toBeNull();
});

test('removing this device from the list also unsubscribes the browser', async () => {
  const fakeBrowserPush = installFakeBrowserPush({ permission: 'granted', hasSubscription: true });
  thisDeviceStore.write('device-1');
  backendServer.use(
    http.delete('/backend/push-devices/device-1', () => HttpResponse.json({ status: 'deleted' })),
  );

  await removePushDevice({ deviceId: 'device-1' });

  expect(fakeBrowserPush.hasSubscription()).toBe(false);
});

test('signing out unsubscribes the browser after the API ends the session', async () => {
  const fakeBrowserPush = installFakeBrowserPush({ permission: 'granted', hasSubscription: true });
  thisDeviceStore.write('device-1');
  backendServer.use(
    http.post('/backend/auth/sign-out', () => HttpResponse.json({ status: 'signed_out' })),
  );

  await signOut();

  expect(fakeBrowserPush.hasSubscription()).toBe(false);
  expect(thisDeviceStore.read()).toBeNull();
});
