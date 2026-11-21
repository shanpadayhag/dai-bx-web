import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, expect, test } from 'vitest';
import NotificationsSection from '@/features/notifications/components/notifications-section';
import thisDeviceStore from '@/features/notifications/data_sources/browser/this-device-store';
import type NotificationSettings from '@/features/notifications/entities/notification-settings';
import startBackendServer from '@/test-support/backend-server';
import installFakeBrowserPush, { removeFakeBrowserPush } from '@/test-support/fake-browser-push';
import renderWithToaster from '@/test-support/render-with-toaster';

const backendServer = startBackendServer();
const IPHONE_SAFARI_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';

const storedSettings: NotificationSettings = {
  applicationServerKey:
    'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM',
  checkIns: true,
  scheduleRuns: true,
  blocksStarting: true,
  quietOutsideWorkingHours: true,
  devices: [
    {
      id: 'device-1',
      deviceName: 'Mac · Chrome',
      createdAt: '2026-11-20T10:00:00Z',
      lastDeliveredAt: null,
    },
    {
      id: 'device-2',
      deviceName: 'iPhone · Safari',
      createdAt: '2026-11-21T10:00:00Z',
      lastDeliveredAt: null,
    },
  ],
};

let currentSettings = storedSettings;
let settingsPatches: unknown[] = [];

beforeEach(() => {
  currentSettings = structuredClone(storedSettings);
  settingsPatches = [];
  backendServer.use(
    http.get('/backend/account/notifications', () => HttpResponse.json(currentSettings)),
    http.patch('/backend/account/notifications', async ({ request }) => {
      const settingsPatch = (await request.json()) as Partial<NotificationSettings>;
      settingsPatches.push(settingsPatch);
      currentSettings = { ...currentSettings, ...settingsPatch };
      return HttpResponse.json(currentSettings);
    }),
  );
});

afterEach(() => {
  removeFakeBrowserPush();
  window.localStorage.clear();
});

const openSection = async () => {
  const user = userEvent.setup();
  renderWithToaster(
    <NotificationsSection
      workingHoursStart="16:00"
      workingHoursEnd="02:00"
      workingHoursSectionId="working-hours"
    />,
  );
  await screen.findByText('Mac · Chrome');
  return user;
};

const thisDeviceRow = () =>
  screen.getByText('This device', { selector: 'div' }).closest<HTMLElement>('.flex.items-start');

test('a registered device shows On with Send a test and Turn off', async () => {
  installFakeBrowserPush({ permission: 'granted', hasSubscription: true });
  thisDeviceStore.write('device-1');
  await openSection();

  const row = within(thisDeviceRow() ?? document.body);
  expect(row.getByText('On')).toBeInTheDocument();
  expect(row.getByRole('button', { name: 'Send a test' })).toBeInTheDocument();
  expect(row.getByRole('button', { name: 'Turn off' })).toBeInTheDocument();
  expect(screen.getByText('This device', { selector: 'span' })).toBeInTheDocument();
});

test('an unregistered device shows Off and turns on from the button', async () => {
  installFakeBrowserPush();
  backendServer.use(
    http.post('/backend/push-devices', () => {
      currentSettings = {
        ...currentSettings,
        devices: [
          ...currentSettings.devices,
          {
            id: 'device-3',
            deviceName: 'Mac · Chrome',
            createdAt: '2026-11-22T10:00:00Z',
            lastDeliveredAt: null,
          },
        ],
      };
      return HttpResponse.json(currentSettings.devices[2], { status: 201 });
    }),
  );
  const user = await openSection();

  expect(screen.getByText('Off')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Turn on' }));

  expect(await screen.findByText('Notifications are on')).toBeInTheDocument();
  expect(await screen.findByText('On')).toBeInTheDocument();
});

test('a refused permission shows Blocked with no button to turn on', async () => {
  installFakeBrowserPush({ permission: 'denied' });
  await openSection();

  expect(screen.getByText('Blocked')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Turn on' })).not.toBeInTheDocument();
});

test('an iPhone in Safari shows the Home Screen steps', async () => {
  installFakeBrowserPush({ userAgent: IPHONE_SAFARI_USER_AGENT });
  await openSection();

  expect(screen.getByText('Needs Home Screen')).toBeInTheDocument();
  expect(
    within(screen.getByRole('list', { name: 'Add DaiBX to your Home Screen' })).getAllByRole(
      'listitem',
    ),
  ).toHaveLength(3);
});

test('a browser without push says it is not supported', async () => {
  await openSection();

  expect(screen.getByText('Not supported')).toBeInTheDocument();
});

test('each switch saves only its own change', async () => {
  installFakeBrowserPush();
  const user = await openSection();

  await user.click(screen.getByRole('switch', { name: 'Schedule runs' }));
  await user.click(screen.getByRole('switch', { name: 'Quiet outside working hours' }));

  expect(settingsPatches).toEqual([{ scheduleRuns: false }, { quietOutsideWorkingHours: false }]);
  expect(screen.getByRole('switch', { name: 'Schedule runs' })).toHaveAttribute(
    'aria-checked',
    'false',
  );
});

test('Remove asks first, then removes the device', async () => {
  installFakeBrowserPush();
  const removedPaths: string[] = [];
  backendServer.use(
    http.delete('/backend/push-devices/:deviceId', ({ request }) => {
      removedPaths.push(new URL(request.url).pathname);
      currentSettings = {
        ...currentSettings,
        devices: currentSettings.devices.filter((pushDevice) => pushDevice.id !== 'device-2'),
      };
      return HttpResponse.json({ status: 'deleted' });
    }),
  );
  const user = await openSection();

  await user.click(screen.getByRole('button', { name: 'Remove iPhone · Safari' }));
  expect(removedPaths).toEqual([]);
  await user.click(screen.getByRole('button', { name: 'Remove device', hidden: true }));

  expect(removedPaths).toEqual(['/backend/push-devices/device-2']);
  await screen.findByText('Mac · Chrome');
  expect(screen.queryByText('iPhone · Safari')).not.toBeInTheDocument();
});
