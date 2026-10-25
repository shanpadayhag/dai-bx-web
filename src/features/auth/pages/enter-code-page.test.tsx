import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, expect, test, vi } from 'vitest';
import EnterCodePage from '@/features/auth/pages/enter-code-page';
import startBackendServer from '@/test-support/backend-server';
import renderWithToaster from '@/test-support/render-with-toaster';

const routerReplace = vi.hoisted(() => vi.fn());
const stableRouter = vi.hoisted(() => ({ push: vi.fn(), replace: routerReplace }));
vi.mock('next/navigation', () => ({ useRouter: () => stableRouter }));

const backendServer = startBackendServer();

afterEach(() => routerReplace.mockReset());

const answerVerify = (verifyAnswer: () => Response) => {
  let receivedVerify: unknown;
  backendServer.use(
    http.post('/backend/auth/mfa/verify', async ({ request }) => {
      receivedVerify = await request.json();
      return verifyAnswer();
    }),
  );
  return () => receivedVerify;
};

test('an authenticator code signs in and remembers the device when ticked', async () => {
  window.history.pushState({}, '', '/enter-code?next=%2Fboard');
  const readVerify = answerVerify(() => HttpResponse.json({ next: 'signed_in' }));
  const user = userEvent.setup();

  renderWithToaster(<EnterCodePage />);
  await user.type(screen.getByLabelText('Authenticator code'), '123456');
  await user.click(screen.getByLabelText('Remember this device for 30 days'));
  await user.click(screen.getByRole('button', { name: 'Verify' }));

  await vi.waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/board'));
  expect(readVerify()).toEqual({ code: '123456', rememberDevice: true });
});

test('a recovery code signs in and says how many codes are left', async () => {
  window.history.pushState({}, '', '/enter-code');
  const readVerify = answerVerify(() =>
    HttpResponse.json({ next: 'signed_in', remainingRecoveryCodes: 3 }),
  );
  const user = userEvent.setup();

  renderWithToaster(<EnterCodePage />);
  await user.click(screen.getByText('Lost your phone? Use a recovery code'));
  await user.type(screen.getByLabelText('Recovery code'), 'k7qm-2xrd-9ftb');
  await user.click(screen.getByRole('button', { name: 'Use recovery code' }));

  expect(await screen.findByRole('heading', { name: 'You’re in' })).toBeInTheDocument();
  expect(screen.getByText(/3 recovery codes left/)).toBeInTheDocument();
  expect(readVerify()).toEqual({ code: 'k7qm-2xrd-9ftb', rememberDevice: false });
  await user.click(screen.getByRole('button', { name: 'Continue to DaiBX' }));
  expect(routerReplace).toHaveBeenCalledWith('/today');
});

test('a wrong code shows the backend message', async () => {
  window.history.pushState({}, '', '/enter-code');
  answerVerify(() =>
    HttpResponse.json(
      { error: "that code didn't work, check your authenticator app" },
      { status: 422 },
    ),
  );
  const user = userEvent.setup();

  renderWithToaster(<EnterCodePage />);
  await user.type(screen.getByLabelText('Authenticator code'), '000000');
  await user.click(screen.getByRole('button', { name: 'Verify' }));

  expect(
    await screen.findByText("That code didn't work, check your authenticator app."),
  ).toBeInTheDocument();
  expect(routerReplace).not.toHaveBeenCalled();
});

test('an expired sign-in step tells the visitor to start over', async () => {
  window.history.pushState({}, '', '/enter-code');
  answerVerify(() => HttpResponse.json({ error: 'unauthorized' }, { status: 401 }));
  const user = userEvent.setup();

  renderWithToaster(<EnterCodePage />);
  await user.type(screen.getByLabelText('Authenticator code'), '123456');
  await user.click(screen.getByRole('button', { name: 'Verify' }));

  expect(await screen.findByText('This step has expired')).toBeInTheDocument();
  expect(screen.getByText('Start over from the sign-in page.')).toBeInTheDocument();
});

test('too many wrong codes shows how long to wait', async () => {
  window.history.pushState({}, '', '/enter-code');
  answerVerify(() =>
    HttpResponse.json(
      { error: 'too many attempts, try again later' },
      { status: 429, headers: { 'Retry-After': '900' } },
    ),
  );
  const user = userEvent.setup();

  renderWithToaster(<EnterCodePage />);
  await user.type(screen.getByLabelText('Authenticator code'), '123456');
  await user.click(screen.getByRole('button', { name: 'Verify' }));

  expect(await screen.findByText('Wait 15 minutes and try again.')).toBeInTheDocument();
});
