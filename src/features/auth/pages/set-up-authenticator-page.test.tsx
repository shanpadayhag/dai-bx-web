import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import RecoveryCodesPage from '@/features/auth/pages/recovery-codes-page';
import SetUpAuthenticatorPage from '@/features/auth/pages/set-up-authenticator-page';
import startBackendServer from '@/test-support/backend-server';
import renderWithToaster from '@/test-support/render-with-toaster';

const routerPush = vi.hoisted(() => vi.fn());
const stableRouter = vi.hoisted(() => ({ push: routerPush, replace: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => stableRouter }));

const backendServer = startBackendServer();

const recoveryCodes = [
  'K7QM-2XRD-9FTB',
  'P4VN-8HWC-3JZE',
  'T9AR-6KXQ-1MDW',
  'B2HS-5NPY-7CGV',
  'W8ZE-4QTJ-2RKA',
  'M3XD-9BVF-6HNP',
  'R6CK-1WZM-8TQY',
  'G5JP-7AEH-4SXB',
  'Y1TW-3MRC-9VDK',
  'D4NF-8GKZ-5PQJ',
];

beforeEach(() => {
  window.history.pushState({}, '', '/set-up-authenticator');
  backendServer.use(
    http.get('/backend/auth/mfa/setup', () =>
      HttpResponse.json({
        otpauthUri:
          'otpauth://totp/DaiBX:shan%40daibx.test?secret=JBSWY3DPEHPK3PXP&issuer=DaiBX&algorithm=SHA1&digits=6&period=30',
        manualEntryKey: 'JBSW Y3DP EHPK 3PXP',
      }),
    ),
  );
});
afterEach(() => routerPush.mockReset());

test('the setup shows the QR code and key, and a correct code leads to the recovery codes', async () => {
  let receivedConfirm: unknown;
  backendServer.use(
    http.post('/backend/auth/mfa/setup/confirm', async ({ request }) => {
      receivedConfirm = await request.json();
      return HttpResponse.json({ recoveryCodes });
    }),
  );
  const user = userEvent.setup();

  renderWithToaster(<SetUpAuthenticatorPage />);
  expect(await screen.findByTitle('QR code for your authenticator app')).toBeInTheDocument();
  expect(screen.getByText('JBSW Y3DP EHPK 3PXP')).toBeInTheDocument();
  expect(screen.getByText(/shan@daibx\.test/)).toBeInTheDocument();
  await user.type(screen.getByLabelText('Code from the app'), '123456');
  await user.click(screen.getByRole('button', { name: 'Turn on and continue' }));

  await vi.waitFor(() => expect(routerPush).toHaveBeenCalledWith('/recovery-codes'));
  expect(receivedConfirm).toEqual({ code: '123456' });
  renderWithToaster(<RecoveryCodesPage />);
  expect(await screen.findByText('D4NF-8GKZ-5PQJ')).toBeInTheDocument();
});

test('a wrong code shows the backend message', async () => {
  backendServer.use(
    http.post('/backend/auth/mfa/setup/confirm', () =>
      HttpResponse.json(
        { error: "that code didn't work, check your authenticator app" },
        { status: 422 },
      ),
    ),
  );
  const user = userEvent.setup();

  renderWithToaster(<SetUpAuthenticatorPage />);
  await user.type(await screen.findByLabelText('Code from the app'), '000000');
  await user.click(screen.getByRole('button', { name: 'Turn on and continue' }));

  expect(
    await screen.findByText("That code didn't work, check your authenticator app."),
  ).toBeInTheDocument();
  expect(routerPush).not.toHaveBeenCalled();
});

test('an expired setup step says so and points back to sign in', async () => {
  backendServer.use(
    http.get('/backend/auth/mfa/setup', () =>
      HttpResponse.json({ error: 'unauthorized' }, { status: 401 }),
    ),
  );

  renderWithToaster(<SetUpAuthenticatorPage />);

  expect(await screen.findByRole('heading', { name: 'This step has expired' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Sign in again' })).toHaveAttribute('href', '/sign-in');
});
