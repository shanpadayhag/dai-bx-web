import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import SignInPage from '@/features/auth/pages/sign-in-page';
import startBackendServer from '@/test-support/backend-server';
import renderWithToaster from '@/test-support/render-with-toaster';

const routerPush = vi.hoisted(() => vi.fn());
const routerReplace = vi.hoisted(() => vi.fn());
const stableRouter = vi.hoisted(() => ({ push: routerPush, replace: routerReplace }));
vi.mock('next/navigation', () => ({ useRouter: () => stableRouter }));

const backendServer = startBackendServer();

beforeEach(() => {
  backendServer.use(
    http.get('/backend/auth/session', () =>
      HttpResponse.json({ error: 'unauthorized' }, { status: 401 }),
    ),
    http.post('/backend/auth/refresh', () =>
      HttpResponse.json({ error: 'unauthorized' }, { status: 401 }),
    ),
  );
});
afterEach(() => {
  routerPush.mockReset();
  routerReplace.mockReset();
  window.sessionStorage.clear();
});

const signInAt = async (signInUrl: string, signInAnswer: () => Response) => {
  window.history.pushState({}, '', signInUrl);
  let receivedSignIn: unknown;
  backendServer.use(
    http.post('/backend/auth/sign-in', async ({ request }) => {
      receivedSignIn = await request.json();
      return signInAnswer();
    }),
  );
  const user = userEvent.setup();
  renderWithToaster(<SignInPage />);
  await user.type(screen.getByLabelText('Email'), 'shan@daibx.test');
  await user.type(
    screen.getByLabelText('Password'),
    'violet lantern drifts past seven quiet docks',
  );
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
  return () => receivedSignIn;
};

test('a correct password moves on to the code, keeping where the visitor was going', async () => {
  const readSignIn = await signInAt('/sign-in?next=%2Ftasks', () =>
    HttpResponse.json({ next: 'enter_code' }),
  );

  await vi.waitFor(() => expect(routerPush).toHaveBeenCalledWith('/enter-code?next=%2Ftasks'));
  expect(readSignIn()).toEqual({
    email: 'shan@daibx.test',
    password: 'violet lantern drifts past seven quiet docks',
  });
});

test('a remembered device goes straight to where the visitor was going', async () => {
  await signInAt('/sign-in?next=%2Ftasks', () => HttpResponse.json({ next: 'signed_in' }));

  await vi.waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/tasks'));
});

test('an account that never finished setup goes to the authenticator', async () => {
  await signInAt('/sign-in', () => HttpResponse.json({ next: 'set_up_authenticator' }));

  await vi.waitFor(() => expect(routerPush).toHaveBeenCalledWith('/set-up-authenticator'));
});

test('an unverified account goes to check its email', async () => {
  await signInAt('/sign-in', () => HttpResponse.json({ next: 'verify_email' }));

  await vi.waitFor(() => expect(routerPush).toHaveBeenCalledWith('/verify-email'));
  expect(window.sessionStorage.getItem('daibx:pending-email')).toBe('shan@daibx.test');
});

test('a wrong password shows one generic message and never signs anyone out', async () => {
  const signedOutListener = vi.fn();
  window.addEventListener('daibx:signed-out', signedOutListener);

  await signInAt('/sign-in', () =>
    HttpResponse.json({ error: 'the email or password is incorrect' }, { status: 401 }),
  );

  expect(await screen.findByText('The email or password is incorrect.')).toBeInTheDocument();
  expect(signedOutListener).not.toHaveBeenCalled();
  window.removeEventListener('daibx:signed-out', signedOutListener);
});

test('repeated failures show how long to wait', async () => {
  await signInAt('/sign-in', () =>
    HttpResponse.json(
      { error: 'too many attempts, try again later' },
      { status: 429, headers: { 'Retry-After': '60' } },
    ),
  );

  expect(await screen.findByText('Wait 1 minute and try again.')).toBeInTheDocument();
});
