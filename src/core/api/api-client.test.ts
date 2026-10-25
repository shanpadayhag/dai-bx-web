import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest';
import { createApiClient } from '@/core/api/api-client';
import { ApiError, SIGNED_OUT_EVENT_NAME, SignedOutError } from '@/core/api/api-error';
import UnauthorizedHandling from '@/core/api/unauthorized-handling';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const listenForSignedOut = () => {
  const signedOutListener = vi.fn();
  window.addEventListener(SIGNED_OUT_EVENT_NAME, signedOutListener);
  return {
    signedOutListener,
    stopListening: () => window.removeEventListener(SIGNED_OUT_EVENT_NAME, signedOutListener),
  };
};

test('three requests that hit an expired session share one refresh and all retry', async () => {
  let isSessionRenewed = false;
  let refreshRequestCount = 0;
  const receivedRequestCounts = new Map<string, number>();
  const countRequest = (requestPath: string) =>
    receivedRequestCounts.set(requestPath, (receivedRequestCounts.get(requestPath) ?? 0) + 1);
  server.use(
    http.post('/backend/auth/refresh', () => {
      refreshRequestCount += 1;
      isSessionRenewed = true;
      return HttpResponse.json({ status: 'refreshed' });
    }),
    ...['/backend/tasks', '/backend/board', '/backend/calendar'].map((requestPath) =>
      http.get(requestPath, () => {
        countRequest(requestPath);
        return isSessionRenewed
          ? HttpResponse.json({ path: requestPath })
          : HttpResponse.json({ error: 'unauthorized' }, { status: 401 });
      }),
    ),
  );
  const apiClient = createApiClient();

  const retriedResponses = await Promise.all([
    apiClient.get<{ path: string }>('/tasks'),
    apiClient.get<{ path: string }>('/board'),
    apiClient.get<{ path: string }>('/calendar'),
  ]);

  expect(refreshRequestCount).toBe(1);
  expect(retriedResponses.map((retriedResponse) => retriedResponse.path)).toEqual([
    '/backend/tasks',
    '/backend/board',
    '/backend/calendar',
  ]);
  expect([...receivedRequestCounts.values()]).toEqual([2, 2, 2]);
});

test('a second 401 after the refresh signs the visitor out', async () => {
  server.use(
    http.post('/backend/auth/refresh', () => HttpResponse.json({ status: 'refreshed' })),
    http.get('/backend/tasks', () => HttpResponse.json({ error: 'unauthorized' }, { status: 401 })),
  );
  const { signedOutListener, stopListening } = listenForSignedOut();

  await expect(createApiClient().get('/tasks')).rejects.toBeInstanceOf(SignedOutError);

  expect(signedOutListener).toHaveBeenCalledTimes(1);
  stopListening();
});

test('a refresh that fails signs the visitor out without retrying', async () => {
  let taskRequestCount = 0;
  server.use(
    http.post('/backend/auth/refresh', () =>
      HttpResponse.json({ error: 'unauthorized' }, { status: 401 }),
    ),
    http.get('/backend/tasks', () => {
      taskRequestCount += 1;
      return HttpResponse.json({ error: 'unauthorized' }, { status: 401 });
    }),
  );
  const { signedOutListener, stopListening } = listenForSignedOut();

  await expect(createApiClient().get('/tasks')).rejects.toBeInstanceOf(SignedOutError);

  expect(taskRequestCount).toBe(1);
  expect(signedOutListener).toHaveBeenCalledTimes(1);
  stopListening();
});

test('a request that only reports 401s never refreshes or signs out', async () => {
  let refreshRequestCount = 0;
  server.use(
    http.post('/backend/auth/refresh', () => {
      refreshRequestCount += 1;
      return HttpResponse.json({ status: 'refreshed' });
    }),
    http.post('/backend/auth/sign-in', () =>
      HttpResponse.json({ error: 'the email or password is incorrect' }, { status: 401 }),
    ),
  );
  const { signedOutListener, stopListening } = listenForSignedOut();

  const signInFailure = await createApiClient()
    .post(
      '/auth/sign-in',
      { email: 'a@b.test', password: 'wrong' },
      {
        unauthorizedHandling: UnauthorizedHandling.Report,
      },
    )
    .catch((requestError: unknown) => requestError);

  expect(signInFailure).toBeInstanceOf(ApiError);
  expect(signInFailure).toMatchObject({
    status: 401,
    description: 'The email or password is incorrect.',
  });
  expect(refreshRequestCount).toBe(0);
  expect(signedOutListener).not.toHaveBeenCalled();
  stopListening();
});

test('a request that renews or reports gives back the 401 instead of signing out', async () => {
  server.use(
    http.post('/backend/auth/refresh', () =>
      HttpResponse.json({ error: 'unauthorized' }, { status: 401 }),
    ),
    http.get('/backend/auth/session', () =>
      HttpResponse.json({ error: 'unauthorized' }, { status: 401 }),
    ),
  );
  const { signedOutListener, stopListening } = listenForSignedOut();

  const sessionFailure = await createApiClient()
    .get('/auth/session', { unauthorizedHandling: UnauthorizedHandling.RenewOrReport })
    .catch((requestError: unknown) => requestError);

  expect(sessionFailure).toMatchObject({ status: 401 });
  expect(signedOutListener).not.toHaveBeenCalled();
  stopListening();
});

test('posts JSON to the same-origin backend path with the cookies', async () => {
  let receivedRequest: Request | undefined;
  server.use(
    http.post('/backend/auth/verify-email', ({ request }) => {
      receivedRequest = request;
      return HttpResponse.json({ next: 'set_up_authenticator' });
    }),
  );

  const verifyResponse = await createApiClient().post<{ next: string }>('/auth/verify-email', {
    token: 'abc',
  });

  expect(verifyResponse).toEqual({ next: 'set_up_authenticator' });
  expect(receivedRequest?.headers.get('content-type')).toBe('application/json');
  expect(receivedRequest?.credentials).toBe('same-origin');
  expect(await receivedRequest?.json()).toEqual({ token: 'abc' });
});

test('a post without a body still sends an empty JSON object', async () => {
  let receivedBody: unknown;
  server.use(
    http.post('/backend/auth/sign-out', async ({ request }) => {
      receivedBody = await request.json();
      return HttpResponse.json({ status: 'signed_out' });
    }),
  );

  await createApiClient().post('/auth/sign-out');

  expect(receivedBody).toEqual({});
});

test('an error response becomes an ApiError with the backend message and retry time', async () => {
  server.use(
    http.post('/backend/auth/password-reset', () =>
      HttpResponse.json(
        { error: 'too many attempts, try again later' },
        { status: 429, headers: { 'Retry-After': '120' } },
      ),
    ),
  );

  const resetFailure = await createApiClient()
    .post('/auth/password-reset', { email: 'a@b.test' })
    .catch((requestError: unknown) => requestError);

  expect(resetFailure).toBeInstanceOf(ApiError);
  expect(resetFailure).toMatchObject({
    status: 429,
    title: 'Too many attempts',
    description: 'Wait 2 minutes and try again.',
    retryAfterSeconds: 120,
  });
});

test('an unreachable backend becomes an ApiError the page can show', async () => {
  server.use(http.get('/backend/account', () => HttpResponse.error()));

  const accountFailure = await createApiClient()
    .get('/account')
    .catch((requestError: unknown) => requestError);

  expect(accountFailure).toBeInstanceOf(ApiError);
  expect(accountFailure).toMatchObject({ status: 0, title: "Couldn't reach DaiBX" });
});
