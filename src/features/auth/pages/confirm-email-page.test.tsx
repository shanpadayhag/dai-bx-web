import { screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { StrictMode } from 'react';
import { expect, test } from 'vitest';
import ConfirmEmailPage from '@/features/auth/pages/confirm-email-page';
import startBackendServer from '@/test-support/backend-server';
import renderWithToaster from '@/test-support/render-with-toaster';

const backendServer = startBackendServer();

test('opening the emailed link switches the email once and says so', async () => {
  window.history.pushState({}, '', '/confirm-email?token=change123');
  let confirmRequestCount = 0;
  let receivedConfirm: unknown;
  backendServer.use(
    http.post('/backend/account/email/confirm', async ({ request }) => {
      confirmRequestCount += 1;
      receivedConfirm = await request.json();
      return HttpResponse.json({ status: 'email_changed' });
    }),
  );

  renderWithToaster(
    <StrictMode>
      <ConfirmEmailPage />
    </StrictMode>,
  );

  expect(await screen.findByRole('heading', { name: 'Email changed' })).toBeInTheDocument();
  expect(receivedConfirm).toEqual({ token: 'change123' });
  expect(confirmRequestCount).toBe(1);
});

test('a used or expired link says so', async () => {
  window.history.pushState({}, '', '/confirm-email?token=used');
  backendServer.use(
    http.post('/backend/account/email/confirm', () =>
      HttpResponse.json({ error: 'this link is invalid or has expired' }, { status: 422 }),
    ),
  );

  renderWithToaster(<ConfirmEmailPage />);

  expect(await screen.findByRole('heading', { name: 'This link didn’t work' })).toBeInTheDocument();
  expect(screen.getByText('This link is invalid or has expired.')).toBeInTheDocument();
});

test('an address taken in the meantime is explained', async () => {
  window.history.pushState({}, '', '/confirm-email?token=taken');
  backendServer.use(
    http.post('/backend/account/email/confirm', () =>
      HttpResponse.json({ error: 'that email address is already in use' }, { status: 409 }),
    ),
  );

  renderWithToaster(<ConfirmEmailPage />);

  expect(await screen.findByText('That email address is already in use.')).toBeInTheDocument();
});

test('a link without a token says so', async () => {
  window.history.pushState({}, '', '/confirm-email');

  renderWithToaster(<ConfirmEmailPage />);

  expect(
    await screen.findByRole('heading', { name: 'This link is incomplete' }),
  ).toBeInTheDocument();
});
