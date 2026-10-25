import { render } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest';
import SignedInRedirect from '@/features/auth/components/signed-in-redirect';

const routerReplace = vi.hoisted(() => vi.fn());

const stableRouter = vi.hoisted(() => ({ replace: routerReplace }));
vi.mock('next/navigation', () => ({ useRouter: () => stableRouter }));

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  routerReplace.mockReset();
});
afterAll(() => server.close());

const signedInSession = {
  user: { name: 'Shan Padayhag', email: 'shan@daibx.test', accentColor: 'teal', theme: 'dark' },
};

const visitSignIn = (signInUrl: string) => {
  window.history.pushState({}, '', signInUrl);
  render(<SignedInRedirect />);
};

test('a signed-in visitor to sign-in goes to the app', async () => {
  server.use(http.get('/backend/auth/session', () => HttpResponse.json(signedInSession)));

  visitSignIn('/sign-in');

  await vi.waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/today'));
});

test('a signed-in visitor goes back to the page they asked for', async () => {
  server.use(http.get('/backend/auth/session', () => HttpResponse.json(signedInSession)));

  visitSignIn('/sign-in?next=%2Ftasks%3Fview%3Dopen');

  await vi.waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/tasks?view=open'));
});

test.each(['//evil.example/steal', 'https://evil.example/steal', '/\\evil.example', 'tasks'])(
  'a next of %s is ignored in favour of the app',
  async (unsafeNextPath) => {
    server.use(http.get('/backend/auth/session', () => HttpResponse.json(signedInSession)));

    visitSignIn(`/sign-in?next=${encodeURIComponent(unsafeNextPath)}`);

    await vi.waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/today'));
  },
);

test('a signed-out visitor stays on sign-in, even when the refresh fails', async () => {
  let sessionRequestCount = 0;
  server.use(
    http.get('/backend/auth/session', () => {
      sessionRequestCount += 1;
      return HttpResponse.json({ error: 'unauthorized' }, { status: 401 });
    }),
    http.post('/backend/auth/refresh', () =>
      HttpResponse.json({ error: 'unauthorized' }, { status: 401 }),
    ),
  );
  const signedOutListener = vi.fn();
  window.addEventListener('daibx:signed-out', signedOutListener);

  visitSignIn('/sign-in');

  await vi.waitFor(() => expect(sessionRequestCount).toBe(1));
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(routerReplace).not.toHaveBeenCalled();
  expect(signedOutListener).not.toHaveBeenCalled();
  window.removeEventListener('daibx:signed-out', signedOutListener);
});
