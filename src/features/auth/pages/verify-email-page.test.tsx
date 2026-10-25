import { screen } from '@testing-library/react';
import { StrictMode } from 'react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, expect, test, vi } from 'vitest';
import VerifyEmailPage from '@/features/auth/pages/verify-email-page';
import startBackendServer from '@/test-support/backend-server';
import renderWithToaster from '@/test-support/render-with-toaster';

const routerReplace = vi.hoisted(() => vi.fn());
const stableRouter = vi.hoisted(() => ({ push: vi.fn(), replace: routerReplace }));
vi.mock('next/navigation', () => ({ useRouter: () => stableRouter }));

const backendServer = startBackendServer();

afterEach(() => {
  routerReplace.mockReset();
  window.sessionStorage.clear();
});

const PENDING_EMAIL_KEY = 'daibx:pending-email';

test('after sign-up the page names the address and can send the link again', async () => {
  window.history.pushState({}, '', '/verify-email');
  window.sessionStorage.setItem(PENDING_EMAIL_KEY, 'shan@daibx.test');
  let receivedResend: unknown;
  backendServer.use(
    http.post('/backend/auth/verify-email/resend', async ({ request }) => {
      receivedResend = await request.json();
      return HttpResponse.json({ status: 'verification_email_sent' }, { status: 202 });
    }),
  );
  const user = userEvent.setup();

  renderWithToaster(<VerifyEmailPage />);
  expect(await screen.findByText('shan@daibx.test')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Send the link again' }));

  expect(await screen.findByText('Link sent')).toBeInTheDocument();
  expect(receivedResend).toEqual({ email: 'shan@daibx.test' });
});

test('sending the link again too often shows how long to wait', async () => {
  window.history.pushState({}, '', '/verify-email');
  window.sessionStorage.setItem(PENDING_EMAIL_KEY, 'shan@daibx.test');
  backendServer.use(
    http.post('/backend/auth/verify-email/resend', () =>
      HttpResponse.json(
        { error: 'too many attempts, try again later' },
        { status: 429, headers: { 'Retry-After': '45' } },
      ),
    ),
  );
  const user = userEvent.setup();

  renderWithToaster(<VerifyEmailPage />);
  await user.click(await screen.findByRole('button', { name: 'Send the link again' }));

  expect(await screen.findByText('Wait 45 seconds and try again.')).toBeInTheDocument();
});

test('opening the emailed link confirms the address and moves on to the authenticator', async () => {
  window.history.pushState({}, '', '/verify-email?token=abc123');
  let receivedVerify: unknown;
  backendServer.use(
    http.post('/backend/auth/verify-email', async ({ request }) => {
      receivedVerify = await request.json();
      return HttpResponse.json({ next: 'set_up_authenticator' });
    }),
  );

  renderWithToaster(<VerifyEmailPage />);

  await vi.waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/set-up-authenticator'));
  expect(receivedVerify).toEqual({ token: 'abc123' });
});

test('the link is sent once, even when React runs effects twice', async () => {
  window.history.pushState({}, '', '/verify-email?token=once');
  let verifyRequestCount = 0;
  backendServer.use(
    http.post('/backend/auth/verify-email', () => {
      verifyRequestCount += 1;
      return HttpResponse.json({ next: 'set_up_authenticator' });
    }),
  );

  renderWithToaster(
    <StrictMode>
      <VerifyEmailPage />
    </StrictMode>,
  );

  await vi.waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/set-up-authenticator'));
  expect(verifyRequestCount).toBe(1);
});

test('an expired or used link says so on the page', async () => {
  window.history.pushState({}, '', '/verify-email?token=used');
  backendServer.use(
    http.post('/backend/auth/verify-email', () =>
      HttpResponse.json({ error: 'this link is invalid or has expired' }, { status: 422 }),
    ),
  );

  renderWithToaster(<VerifyEmailPage />);

  expect(await screen.findByRole('heading', { name: 'This link didn’t work' })).toBeInTheDocument();
  expect(screen.getByText('This link is invalid or has expired.')).toBeInTheDocument();
  expect(routerReplace).not.toHaveBeenCalled();
});
