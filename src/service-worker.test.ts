import { readFileSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';

const SERVICE_WORKER_SOURCE = readFileSync(path.join(process.cwd(), 'public/sw.js'), 'utf8');
const APP_ORIGIN = 'https://dai-bx.vercel.app';
const EVENT_ID = '0196a8f2-4c1d-7e3a-9b2f-1c2d3e4f5a6b';
const CHECK_IN_PATH = `/tracking/${EVENT_ID}/check-in`;
const FINISH_PATH = `/tracking/${EVENT_ID}/finish`;

type WorkerEvent = Record<string, unknown> & { waitUntil: (pending: Promise<unknown>) => void };
type WorkerHandler = (workerEvent: WorkerEvent) => void;
type SentRequest = { path: string; body: unknown };
type FakeWindow = {
  url: string;
  focus: () => Promise<FakeWindow>;
  navigate: (path: string) => void;
};

const checkInAnswers = {
  default: 'check-in',
  'check-in': { path: CHECK_IN_PATH },
  finish: { path: FINISH_PATH },
};

const loadServiceWorker = (responseStatuses: Record<string, number[]> = {}) => {
  const workerHandlers = new Map<string, WorkerHandler>();
  const sentRequests: SentRequest[] = [];
  const openWindows: FakeWindow[] = [];
  const fakeSelf = {
    addEventListener: (eventType: string, workerHandler: WorkerHandler) =>
      workerHandlers.set(eventType, workerHandler),
    fetch: vi.fn(async (requestUrl: string, requestInit: { body: string }) => {
      const requestPath = requestUrl.replace('/backend', '');
      sentRequests.push({ path: requestPath, body: JSON.parse(requestInit.body) });
      const responseStatus = responseStatuses[requestPath]?.shift() ?? 200;
      return { ok: responseStatus < 300, status: responseStatus };
    }),
    registration: {
      showNotification: vi.fn(async () => undefined),
      pushManager: { subscribe: vi.fn() },
    },
    clients: {
      matchAll: vi.fn(async () => openWindows),
      openWindow: vi.fn(async () => null),
    },
    location: { origin: APP_ORIGIN },
  };
  new Function('self', SERVICE_WORKER_SOURCE)(fakeSelf);

  const dispatch = async (eventType: string, eventFields: Record<string, unknown>) => {
    let pendingWork: Promise<unknown> = Promise.resolve();
    workerHandlers.get(eventType)?.({
      ...eventFields,
      waitUntil: (pending: Promise<unknown>) => {
        pendingWork = pending;
      },
    });
    await pendingWork;
  };

  const clickNotification = (notificationData: unknown, chosenAction = '') =>
    dispatch('notificationclick', {
      action: chosenAction,
      notification: { data: notificationData, close: vi.fn() },
    });

  const addOpenWindow = () => {
    const openWindow: FakeWindow = {
      url: `${APP_ORIGIN}/board`,
      focus: vi.fn(async () => openWindow),
      navigate: vi.fn(),
    };
    openWindows.push(openWindow);
    return openWindow;
  };

  return { fakeSelf, sentRequests, dispatch, clickNotification, addOpenWindow };
};

describe('push', () => {
  test('shows the notification with its actions and keeps the answers for a tap', async () => {
    const serviceWorker = loadServiceWorker();
    const pushMessage = {
      kind: 'check_in',
      tag: `check-in:${EVENT_ID}`,
      title: 'Still on Write the spec?',
      body: 'DaiBX · 45m so far',
      url: '/today',
      actions: [{ action: 'check-in', title: 'Check in' }],
      answer: checkInAnswers,
    };

    await serviceWorker.dispatch('push', { data: { json: () => pushMessage } });

    expect(serviceWorker.fakeSelf.registration.showNotification).toHaveBeenCalledWith(
      'Still on Write the spec?',
      expect.objectContaining({
        body: 'DaiBX · 45m so far',
        tag: `check-in:${EVENT_ID}`,
        renotify: true,
        actions: [{ action: 'check-in', title: 'Check in' }],
        data: { url: '/today', answer: checkInAnswers },
      }),
    );
  });

  test('shows nothing for a message it cannot read', async () => {
    const serviceWorker = loadServiceWorker();

    await serviceWorker.dispatch('push', {
      data: {
        json: () => {
          throw new SyntaxError('not json');
        },
      },
    });

    expect(serviceWorker.fakeSelf.registration.showNotification).not.toHaveBeenCalled();
  });
});

describe('notificationclick', () => {
  beforeEach(() => vi.useRealTimers());

  test('a tap sends the default answer, then opens the app at the notification link', async () => {
    const serviceWorker = loadServiceWorker();

    await serviceWorker.clickNotification({ url: '/today', answer: checkInAnswers });

    expect(serviceWorker.sentRequests).toEqual([{ path: CHECK_IN_PATH, body: {} }]);
    expect(serviceWorker.fakeSelf.clients.openWindow).toHaveBeenCalledWith('/today');
  });

  test('Finish ends the item now and brings an open window to the link', async () => {
    vi.useFakeTimers({ now: new Date('2026-11-22T10:00:00Z'), toFake: ['Date'] });
    const serviceWorker = loadServiceWorker();
    const openWindow = serviceWorker.addOpenWindow();

    await serviceWorker.clickNotification({ url: '/today', answer: checkInAnswers }, 'finish');

    expect(serviceWorker.sentRequests).toEqual([
      { path: FINISH_PATH, body: { endsAt: '2026-11-22T10:00:00.000Z' } },
    ]);
    expect(openWindow.focus).toHaveBeenCalled();
    expect(openWindow.navigate).toHaveBeenCalledWith('/today');
  });

  test('an expired session is refreshed once and the answer sent again', async () => {
    const serviceWorker = loadServiceWorker({ [CHECK_IN_PATH]: [401, 200] });

    await serviceWorker.clickNotification({ url: '/today', answer: checkInAnswers });

    expect(serviceWorker.sentRequests.map((sentRequest) => sentRequest.path)).toEqual([
      CHECK_IN_PATH,
      '/auth/refresh',
      CHECK_IN_PATH,
    ]);
    expect(serviceWorker.fakeSelf.clients.openWindow).toHaveBeenCalledWith('/today');
  });

  test('a failed refresh opens sign-in', async () => {
    const serviceWorker = loadServiceWorker({ [CHECK_IN_PATH]: [401], '/auth/refresh': [401] });

    await serviceWorker.clickNotification({ url: '/board?card=1', answer: checkInAnswers });

    expect(serviceWorker.fakeSelf.clients.openWindow).toHaveBeenCalledWith('/sign-in');
  });

  test('an item that already ended opens Today instead of the link', async () => {
    const serviceWorker = loadServiceWorker({ [CHECK_IN_PATH]: [404] });

    await serviceWorker.clickNotification({ url: '/board?card=1', answer: checkInAnswers });

    expect(serviceWorker.fakeSelf.clients.openWindow).toHaveBeenCalledWith('/today');
  });

  test('never sends an answer outside the tracking, task and card start paths', async () => {
    const serviceWorker = loadServiceWorker();

    await serviceWorker.clickNotification({
      url: '/today',
      answer: { default: 'delete', delete: { path: '/account/delete' } },
    });
    await serviceWorker.clickNotification({
      url: '/today',
      answer: { default: 'start', start: { path: `/tasks/${EVENT_ID}/start/../../account` } },
    });

    expect(serviceWorker.sentRequests).toEqual([]);
    expect(serviceWorker.fakeSelf.clients.openWindow).toHaveBeenCalledTimes(2);
  });

  test('a link to another site opens Today', async () => {
    const serviceWorker = loadServiceWorker();

    await serviceWorker.clickNotification({ url: '//example.com/phish', answer: {} });

    expect(serviceWorker.fakeSelf.clients.openWindow).toHaveBeenCalledWith('/today');
  });
});

describe('pushsubscriptionchange', () => {
  test('subscribes again with the same key and registers the new endpoint', async () => {
    const serviceWorker = loadServiceWorker();
    serviceWorker.fakeSelf.registration.pushManager.subscribe.mockResolvedValue({
      toJSON: () => ({
        endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/new',
        keys: { p256dh: 'device-key', auth: 'auth-secret' },
      }),
    });

    await serviceWorker.dispatch('pushsubscriptionchange', {
      oldSubscription: { options: { applicationServerKey: 'server-key' } },
    });

    expect(serviceWorker.fakeSelf.registration.pushManager.subscribe).toHaveBeenCalledWith({
      userVisibleOnly: true,
      applicationServerKey: 'server-key',
    });
    expect(serviceWorker.sentRequests).toEqual([
      {
        path: '/push-devices',
        body: expect.objectContaining({
          endpoint: 'https://updates.push.services.mozilla.com/wpush/v2/new',
          keys: { p256dh: 'device-key', auth: 'auth-secret' },
        }),
      },
    ]);
  });
});
