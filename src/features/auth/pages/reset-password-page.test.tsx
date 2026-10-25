import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, expect, test, vi } from 'vitest';
import ResetPasswordPage from '@/features/auth/pages/reset-password-page';
import startBackendServer from '@/test-support/backend-server';
import renderWithToaster from '@/test-support/render-with-toaster';

const routerPush = vi.hoisted(() => vi.fn());
const stableRouter = vi.hoisted(() => ({ push: routerPush, replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => stableRouter }));

const backendServer = startBackendServer();

afterEach(() => routerPush.mockReset());

const NEW_PASSWORD = 'amber kettle hums beneath nine slow bridges';

const saveNewPassword = async (completeAnswer: () => Response) => {
  window.history.pushState({}, '', '/reset-password?token=reset123');
  let receivedComplete: unknown;
  backendServer.use(
    http.post('/backend/auth/password-reset/complete', async ({ request }) => {
      receivedComplete = await request.json();
      return completeAnswer();
    }),
  );
  const user = userEvent.setup();
  renderWithToaster(<ResetPasswordPage />);
  await user.type(screen.getByLabelText('New password'), NEW_PASSWORD);
  await user.click(screen.getByRole('button', { name: 'Save new password' }));
  return () => receivedComplete;
};

test('a new password moves on to the code step', async () => {
  const readComplete = await saveNewPassword(() => HttpResponse.json({ next: 'enter_code' }));

  await vi.waitFor(() => expect(routerPush).toHaveBeenCalledWith('/enter-code'));
  expect(readComplete()).toEqual({ token: 'reset123', password: NEW_PASSWORD });
});

test('a refused password shows the backend message', async () => {
  await saveNewPassword(() =>
    HttpResponse.json(
      { error: 'this password appears in known data breaches, choose another' },
      { status: 422 },
    ),
  );

  expect(
    await screen.findByText('This password appears in known data breaches, choose another.'),
  ).toBeInTheDocument();
  expect(routerPush).not.toHaveBeenCalled();
});

test('a link without a token says so instead of showing the form', async () => {
  window.history.pushState({}, '', '/reset-password');

  renderWithToaster(<ResetPasswordPage />);

  expect(
    await screen.findByRole('heading', { name: 'This link is incomplete' }),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
});
