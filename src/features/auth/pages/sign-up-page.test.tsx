import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import SignUpPage from '@/features/auth/pages/sign-up-page';
import startBackendServer from '@/test-support/backend-server';
import renderWithToaster from '@/test-support/render-with-toaster';

const routerPush = vi.hoisted(() => vi.fn());
const stableRouter = vi.hoisted(() => ({ push: routerPush, replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => stableRouter }));

const backendServer = startBackendServer();

beforeEach(() => {
  window.history.pushState({}, '', '/sign-up');
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
  window.sessionStorage.clear();
});

const fillAndSubmitSignUp = async () => {
  const user = userEvent.setup();
  renderWithToaster(<SignUpPage />);
  await user.type(screen.getByLabelText('Invite code'), 'K7QM-2XRD-9FTB-0011');
  await user.type(screen.getByLabelText('Name'), 'Shan Padayhag');
  await user.type(screen.getByLabelText('Email'), 'shan@daibx.test');
  await user.type(
    screen.getByLabelText('Password'),
    'violet lantern drifts past seven quiet docks',
  );
  await user.click(screen.getByRole('button', { name: 'Create account' }));
};

test('creating an account sends the visitor to check their email', async () => {
  let receivedSignUp: unknown;
  backendServer.use(
    http.post('/backend/auth/sign-up', async ({ request }) => {
      receivedSignUp = await request.json();
      return HttpResponse.json({ status: 'verification_email_sent' }, { status: 202 });
    }),
  );

  await fillAndSubmitSignUp();

  await vi.waitFor(() => expect(routerPush).toHaveBeenCalledWith('/verify-email'));
  expect(receivedSignUp).toEqual({
    inviteCode: 'K7QM-2XRD-9FTB-0011',
    name: 'Shan Padayhag',
    email: 'shan@daibx.test',
    password: 'violet lantern drifts past seven quiet docks',
  });
});

test('an invalid invite shows the backend message', async () => {
  backendServer.use(
    http.post('/backend/auth/sign-up', () =>
      HttpResponse.json({ error: 'this invite code is invalid or has expired' }, { status: 422 }),
    ),
  );

  await fillAndSubmitSignUp();

  expect(
    await screen.findByText('This invite code is invalid or has expired.'),
  ).toBeInTheDocument();
  expect(routerPush).not.toHaveBeenCalled();
});

test('too many attempts shows how long to wait', async () => {
  backendServer.use(
    http.post('/backend/auth/sign-up', () =>
      HttpResponse.json(
        { error: 'too many attempts, try again later' },
        { status: 429, headers: { 'Retry-After': '120' } },
      ),
    ),
  );

  await fillAndSubmitSignUp();

  expect(await screen.findByText('Wait 2 minutes and try again.')).toBeInTheDocument();
});
