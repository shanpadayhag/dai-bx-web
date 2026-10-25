import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { expect, test } from 'vitest';
import ForgotPasswordPage from '@/features/auth/pages/forgot-password-page';
import startBackendServer from '@/test-support/backend-server';
import renderWithToaster from '@/test-support/render-with-toaster';

const backendServer = startBackendServer();

const requestReset = async (resetAnswer: () => Response) => {
  let receivedReset: unknown;
  backendServer.use(
    http.post('/backend/auth/password-reset', async ({ request }) => {
      receivedReset = await request.json();
      return resetAnswer();
    }),
  );
  const user = userEvent.setup();
  renderWithToaster(<ForgotPasswordPage />);
  await user.type(screen.getByLabelText('Email'), 'shan@daibx.test');
  await user.click(screen.getByRole('button', { name: 'Send reset link' }));
  return () => receivedReset;
};

test('asking for a reset says to check the email, whether or not the account exists', async () => {
  const readReset = await requestReset(() =>
    HttpResponse.json({ status: 'reset_email_sent' }, { status: 202 }),
  );

  expect(await screen.findByRole('heading', { name: 'Check your email' })).toBeInTheDocument();
  expect(screen.getByText(/shan@daibx\.test/)).toBeInTheDocument();
  expect(readReset()).toEqual({ email: 'shan@daibx.test' });
});

test('asking too often shows how long to wait', async () => {
  await requestReset(() =>
    HttpResponse.json(
      { error: 'too many attempts, try again later' },
      { status: 429, headers: { 'Retry-After': '3600' } },
    ),
  );

  expect(await screen.findByText('Wait 1 hour and try again.')).toBeInTheDocument();
});
