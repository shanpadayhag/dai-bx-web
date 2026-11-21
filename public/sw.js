const BACKEND_PATH = '/backend';
const REFRESH_PATH = '/auth/refresh';
const PUSH_DEVICES_PATH = '/push-devices';
const TODAY_PATH = '/today';
const SIGN_IN_PATH = '/sign-in';
const NOTIFICATION_ICON_PATH = '/icons/icon-192.png';
const UNAUTHORIZED_STATUS = 401;
const ANSWER_PATH_PATTERN =
  /^\/(?:tracking\/[0-9a-f-]{36}\/(?:check-in|finish)|(?:tasks|cards)\/[0-9a-f-]{36}\/start)$/;
const FINISH_PATH_SUFFIX = '/finish';
const CHECK_IN_KIND = 'check_in';
const RESUBSCRIBED_DEVICE_NAME = 'This browser';

const isAppPath = (appPath) =>
  typeof appPath === 'string' &&
  appPath.startsWith('/') &&
  !appPath.startsWith('//') &&
  !appPath.includes('\\');

const deviceTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;

const answerBody = (answerPath) =>
  answerPath.endsWith(FINISH_PATH_SUFFIX) ? { endsAt: new Date().toISOString() } : {};

const postToBackend = (requestPath, requestBody) =>
  self.fetch(`${BACKEND_PATH}${requestPath}`, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-Time-Zone': deviceTimeZone() },
    body: JSON.stringify(requestBody),
  });

const sendAnswer = async (answerPath) => {
  const answerResponse = await postToBackend(answerPath, answerBody(answerPath));
  if (answerResponse.status !== UNAUTHORIZED_STATUS) return answerResponse;
  const refreshResponse = await postToBackend(REFRESH_PATH, {});
  if (!refreshResponse.ok) return refreshResponse;
  return postToBackend(answerPath, answerBody(answerPath));
};

const destinationAfterAnswer = async (answerPath, successPath) => {
  try {
    const answerResponse = await sendAnswer(answerPath);
    if (answerResponse.ok) return successPath;
    return answerResponse.status === UNAUTHORIZED_STATUS ? SIGN_IN_PATH : TODAY_PATH;
  } catch {
    return TODAY_PATH;
  }
};

const showApp = async (appPath) => {
  const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const appWindow = windowClients.find(
    (windowClient) => new URL(windowClient.url).origin === self.location.origin,
  );
  if (!appWindow) {
    await self.clients.openWindow(appPath);
    return;
  }
  const focusedWindow = await appWindow.focus();
  await (focusedWindow ?? appWindow).navigate(appPath);
};

const readPushMessage = (pushEvent) => {
  try {
    return pushEvent.data ? pushEvent.data.json() : null;
  } catch {
    return null;
  }
};

const handlePush = (pushEvent) => {
  const pushMessage = readPushMessage(pushEvent);
  if (!pushMessage || typeof pushMessage.title !== 'string') return;
  pushEvent.waitUntil(
    self.registration.showNotification(pushMessage.title, {
      body: pushMessage.body,
      tag: pushMessage.tag,
      renotify: pushMessage.kind === CHECK_IN_KIND,
      icon: NOTIFICATION_ICON_PATH,
      badge: NOTIFICATION_ICON_PATH,
      data: { url: pushMessage.url, answer: pushMessage.answer ?? {} },
      actions: Array.isArray(pushMessage.actions) ? pushMessage.actions : [],
    }),
  );
};

const handleNotificationClick = (clickEvent) => {
  clickEvent.notification.close();
  const notificationData = clickEvent.notification.data ?? {};
  const successPath = isAppPath(notificationData.url) ? notificationData.url : TODAY_PATH;
  const answers = notificationData.answer ?? {};
  const chosenAction = clickEvent.action || answers.default;
  const answerPath = chosenAction ? answers[chosenAction]?.path : undefined;
  clickEvent.waitUntil(
    (async () => {
      const appPath =
        typeof answerPath === 'string' && ANSWER_PATH_PATTERN.test(answerPath)
          ? await destinationAfterAnswer(answerPath, successPath)
          : successPath;
      await showApp(appPath);
    })(),
  );
};

const handleSubscriptionChange = (changeEvent) => {
  const previousOptions = changeEvent.oldSubscription?.options;
  if (!previousOptions?.applicationServerKey) return;
  changeEvent.waitUntil(
    (async () => {
      const newSubscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: previousOptions.applicationServerKey,
      });
      const subscriptionJson = newSubscription.toJSON();
      await postToBackend(PUSH_DEVICES_PATH, {
        endpoint: subscriptionJson.endpoint,
        keys: subscriptionJson.keys,
        deviceName: RESUBSCRIBED_DEVICE_NAME,
        timeZone: deviceTimeZone(),
      });
    })(),
  );
};

self.addEventListener('push', handlePush);
self.addEventListener('notificationclick', handleNotificationClick);
self.addEventListener('pushsubscriptionchange', handleSubscriptionChange);
