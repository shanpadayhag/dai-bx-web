import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, test, vi } from 'vitest';
import SessionGate from '@/features/auth/components/session-gate';

const routerReplace = vi.hoisted(() => vi.fn());

const stableRouter = vi.hoisted(() => ({ replace: routerReplace }));
vi.mock('next/navigation', () => ({ useRouter: () => stableRouter }));

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => window.history.pushState({}, '', '/tasks?view=open'));
afterEach(() => {
  server.resetHandlers();
  routerReplace.mockReset();
});
afterAll(() => server.close());

const renderGate = () =>
  render(
    <SessionGate>
      <p>Your tasks</p>
    </SessionGate>,
  );

const signedInSession = {
  user: { name: 'Shan Padayhag', email: 'shan@daibx.test', accentColor: 'teal', theme: 'dark' },
};

test('a signed-out visitor is sent to sign in and never sees the app', async () => {
  server.use(
    http.get('/backend/auth/session', () =>
      HttpResponse.json({ error: 'unauthorized' }, { status: 401 }),
    ),
    http.post('/backend/auth/refresh', () =>
      HttpResponse.json({ error: 'unauthorized' }, { status: 401 }),
    ),
  );

  renderGate();

  expect(screen.getByRole('status', { name: 'Checking your session' })).toBeInTheDocument();
  await vi.waitFor(() =>
    expect(routerReplace).toHaveBeenCalledWith('/sign-in?next=%2Ftasks%3Fview%3Dopen'),
  );
  expect(screen.queryByText('Your tasks')).not.toBeInTheDocument();
});

test('a signed-in visitor sees the app', async () => {
  server.use(http.get('/backend/auth/session', () => HttpResponse.json(signedInSession)));

  renderGate();

  expect(await screen.findByText('Your tasks')).toBeInTheDocument();
  expect(routerReplace).not.toHaveBeenCalled();
  expect(document.documentElement.dataset.accent).toBe('teal');
  expect(document.documentElement.dataset.theme).toBe('dark');
});

test('a visitor whose access token expired is renewed and sees the app', async () => {
  let isSessionRenewed = false;
  server.use(
    http.get('/backend/auth/session', () =>
      isSessionRenewed
        ? HttpResponse.json(signedInSession)
        : HttpResponse.json({ error: 'unauthorized' }, { status: 401 }),
    ),
    http.post('/backend/auth/refresh', () => {
      isSessionRenewed = true;
      return HttpResponse.json({ status: 'refreshed' });
    }),
  );

  renderGate();

  expect(await screen.findByText('Your tasks')).toBeInTheDocument();
});

test('a backend failure offers a retry instead of the app', async () => {
  let sessionRequestCount = 0;
  server.use(
    http.get('/backend/auth/session', () => {
      sessionRequestCount += 1;
      return sessionRequestCount === 1
        ? HttpResponse.json({ error: 'internal server error' }, { status: 500 })
        : HttpResponse.json(signedInSession);
    }),
  );
  const user = userEvent.setup();

  renderGate();
  await user.click(await screen.findByRole('button', { name: 'Try again' }));

  expect(await screen.findByText('Your tasks')).toBeInTheDocument();
});

test('being signed out later, by any request, sends the visitor to sign in', async () => {
  server.use(http.get('/backend/auth/session', () => HttpResponse.json(signedInSession)));
  renderGate();
  await screen.findByText('Your tasks');

  window.dispatchEvent(new Event('daibx:signed-out'));

  expect(routerReplace).toHaveBeenCalledWith('/sign-in?next=%2Ftasks%3Fview%3Dopen');
});
