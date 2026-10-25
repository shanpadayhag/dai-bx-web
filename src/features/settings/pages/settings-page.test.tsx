import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { forgetAppearance } from '@/core/appearance';
import SettingsPage from '@/features/settings/pages/settings-page';
import startBackendServer from '@/test-support/backend-server';
import renderWithToaster from '@/test-support/render-with-toaster';

const routerReplace = vi.hoisted(() => vi.fn());
const stableRouter = vi.hoisted(() => ({ push: vi.fn(), replace: routerReplace }));
vi.mock('next/navigation', () => ({ useRouter: () => stableRouter }));

const backendServer = startBackendServer();

const storedAccount = {
  name: 'Shan Padayhag',
  email: 'shan@daibx.test',
  accentColor: 'blue',
  theme: 'system',
  security: { recoveryCodesRemaining: 7, activeSessionCount: 2 },
};

const newRecoveryCodes = [
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

let currentAccount = storedAccount;

beforeEach(() => {
  currentAccount = structuredClone(storedAccount);
  backendServer.use(http.get('/backend/account', () => HttpResponse.json(currentAccount)));
});
afterEach(() => {
  routerReplace.mockReset();
  forgetAppearance();
});

const captureRequest = (
  requestMethod: 'post' | 'patch',
  requestPath: string,
  answer: () => Response,
) => {
  let receivedBody: unknown;
  backendServer.use(
    http[requestMethod](requestPath, async ({ request }) => {
      receivedBody = await request.json();
      return answer();
    }),
  );
  return () => receivedBody;
};

const openSettings = async () => {
  const user = userEvent.setup();
  renderWithToaster(<SettingsPage />);
  await screen.findByText(/shan@daibx\.test/);
  return user;
};

const openDialog = async (user: ReturnType<typeof userEvent.setup>, dialogTitle: string) => {
  const dialogHeading = screen.getByRole('heading', { name: dialogTitle, hidden: true });
  const titledDialog = dialogHeading.closest<HTMLElement>('[role="dialog"]');
  const dialogTrigger = document.querySelector<HTMLElement>(
    `[popovertarget="${titledDialog?.id ?? ''}"]`,
  );
  if (titledDialog === null || dialogTrigger === null) {
    throw new Error(`${dialogTitle} has no dialog or no button that opens it`);
  }
  await user.click(dialogTrigger);
  return titledDialog;
};

test('the page shows the account, its recovery codes and its signed-in devices', async () => {
  await openSettings();

  expect(screen.getByLabelText('Name')).toHaveValue('Shan Padayhag');
  expect(screen.getByText('7 of 10 left')).toBeInTheDocument();
  expect(screen.getByText(/signed in on 2 devices/)).toBeInTheDocument();
});

test('choosing an accent saves it and recolors the page at once', async () => {
  const readPatch = captureRequest('patch', '/backend/account', () =>
    HttpResponse.json({ ...storedAccount, accentColor: 'teal' }),
  );
  const user = await openSettings();

  await user.click(screen.getByRole('radio', { name: /Teal/ }));

  expect(document.documentElement.dataset.accent).toBe('teal');
  await vi.waitFor(() => expect(readPatch()).toEqual({ accentColor: 'teal' }));
  expect(screen.getByRole('radio', { name: /Teal/ })).toHaveAttribute('aria-checked', 'true');
});

test('choosing dark mode saves it and switches the page at once', async () => {
  const readPatch = captureRequest('patch', '/backend/account', () =>
    HttpResponse.json({ ...storedAccount, theme: 'dark' }),
  );
  const user = await openSettings();

  await user.click(screen.getByRole('radio', { name: 'Dark' }));

  expect(document.documentElement.dataset.theme).toBe('dark');
  await vi.waitFor(() => expect(readPatch()).toEqual({ theme: 'dark' }));
});

test('an appearance change the backend refuses is undone and explained', async () => {
  captureRequest('patch', '/backend/account', () =>
    HttpResponse.json({ error: 'internal server error' }, { status: 500 }),
  );
  const user = await openSettings();

  await user.click(screen.getByRole('radio', { name: /Violet/ }));

  expect(await screen.findByText('Internal server error.')).toBeInTheDocument();
  expect(document.documentElement.dataset.accent).toBeUndefined();
  expect(screen.getByRole('radio', { name: /Blue/ })).toHaveAttribute('aria-checked', 'true');
});

test('two quick appearance changes both stick', async () => {
  backendServer.use(
    http.patch('/backend/account', async ({ request }) => {
      const profileChanges = (await request.json()) as Record<string, string>;
      currentAccount = { ...currentAccount, ...profileChanges };
      return HttpResponse.json(currentAccount);
    }),
  );
  const user = await openSettings();

  await Promise.all([
    user.click(screen.getByRole('radio', { name: /Teal/ })),
    user.click(screen.getByRole('radio', { name: 'Dark' })),
  ]);

  await vi.waitFor(() => {
    expect(document.documentElement.dataset.accent).toBe('teal');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });
});

test('a new name is saved when the field is left', async () => {
  const readPatch = captureRequest('patch', '/backend/account', () =>
    HttpResponse.json({ ...storedAccount, name: 'Shan P.' }),
  );
  const user = await openSettings();

  await user.clear(screen.getByLabelText('Name'));
  await user.type(screen.getByLabelText('Name'), 'Shan P.');
  await user.tab();

  expect(await screen.findByText('Name saved')).toBeInTheDocument();
  expect(readPatch()).toEqual({ name: 'Shan P.' });
});

test('changing the password reports success and the other devices signing out', async () => {
  const readChange = captureRequest('post', '/backend/account/password', () => {
    currentAccount = {
      ...currentAccount,
      security: { ...currentAccount.security, activeSessionCount: 1 },
    };
    return HttpResponse.json({ status: 'password_changed' });
  });
  const user = await openSettings();
  const passwordDialog = await openDialog(user, 'Change password');

  await user.type(
    within(passwordDialog).getByLabelText('Current password'),
    'violet lantern drifts past seven quiet docks',
  );
  await user.type(
    within(passwordDialog).getByLabelText('New password'),
    'amber kettle hums beneath nine slow bridges',
  );
  await user.click(within(passwordDialog).getByRole('button', { name: 'Change password' }));

  expect(await screen.findByText('Password changed')).toBeInTheDocument();
  expect(readChange()).toEqual({
    currentPassword: 'violet lantern drifts past seven quiet docks',
    newPassword: 'amber kettle hums beneath nine slow bridges',
  });
  expect(await screen.findByText(/signed in on 1 device\b/)).toBeInTheDocument();
});

test('a wrong current password shows the backend message', async () => {
  captureRequest('post', '/backend/account/password', () =>
    HttpResponse.json({ error: 'your current password is incorrect' }, { status: 422 }),
  );
  const user = await openSettings();
  const passwordDialog = await openDialog(user, 'Change password');

  await user.type(
    within(passwordDialog).getByLabelText('Current password'),
    'wrong wrong wrong wrong',
  );
  await user.type(
    within(passwordDialog).getByLabelText('New password'),
    'amber kettle hums beneath nine slow bridges',
  );
  await user.click(within(passwordDialog).getByRole('button', { name: 'Change password' }));

  expect(await screen.findByText('Your current password is incorrect.')).toBeInTheDocument();
});

test('changing the email sends a link to the new address', async () => {
  const readChange = captureRequest('post', '/backend/account/email', () =>
    HttpResponse.json({ status: 'confirmation_email_sent' }, { status: 202 }),
  );
  const user = await openSettings();
  const emailDialog = await openDialog(user, 'Change email');

  await user.type(within(emailDialog).getByLabelText('New email'), 'new@daibx.test');
  await user.type(
    within(emailDialog).getByLabelText('Password'),
    'violet lantern drifts past seven quiet docks',
  );
  await user.type(within(emailDialog).getByLabelText('Authenticator code'), '123456');
  await user.click(within(emailDialog).getByRole('button', { name: 'Send confirmation link' }));

  expect(await screen.findByText('Check new@daibx.test')).toBeInTheDocument();
  expect(readChange()).toEqual({
    newEmail: 'new@daibx.test',
    password: 'violet lantern drifts past seven quiet docks',
    code: '123456',
  });
});

test('making new recovery codes shows them once and resets the count', async () => {
  captureRequest('post', '/backend/account/recovery-codes', () => {
    currentAccount = {
      ...currentAccount,
      security: { ...currentAccount.security, recoveryCodesRemaining: 10 },
    };
    return HttpResponse.json({ recoveryCodes: newRecoveryCodes });
  });
  const user = await openSettings();
  const codesDialog = await openDialog(user, 'Make new recovery codes');

  await user.type(
    within(codesDialog).getByLabelText('Password'),
    'violet lantern drifts past seven quiet docks',
  );
  await user.type(within(codesDialog).getByLabelText('Authenticator code'), '123456');
  await user.click(within(codesDialog).getByRole('button', { name: 'Make new codes' }));

  expect(await screen.findByText('D4NF-8GKZ-5PQJ')).toBeInTheDocument();
  expect(await screen.findByText('10 of 10 left')).toBeInTheDocument();
});

test('replacing the authenticator walks through a new key and confirms it', async () => {
  const readStart = captureRequest('post', '/backend/account/authenticator', () =>
    HttpResponse.json({ next: 'set_up_authenticator' }),
  );
  backendServer.use(
    http.get('/backend/auth/mfa/setup', () =>
      HttpResponse.json({
        otpauthUri:
          'otpauth://totp/DaiBX:shan%40daibx.test?secret=JBSWY3DPEHPK3PXP&issuer=DaiBX&algorithm=SHA1&digits=6&period=30',
        manualEntryKey: 'JBSW Y3DP EHPK 3PXP',
      }),
    ),
  );
  const readConfirm = captureRequest('post', '/backend/account/authenticator/confirm', () =>
    HttpResponse.json({ status: 'authenticator_replaced' }),
  );
  const user = await openSettings();
  const replaceDialog = await openDialog(user, 'Replace authenticator');

  await user.type(
    within(replaceDialog).getByLabelText('Password'),
    'violet lantern drifts past seven quiet docks',
  );
  await user.type(
    within(replaceDialog).getByLabelText('Current code or a recovery code'),
    'K7QM-2XRD-9FTB',
  );
  await user.click(within(replaceDialog).getByRole('button', { name: 'Continue to setup' }));
  expect(
    await within(replaceDialog).findByTitle('QR code for your authenticator app'),
  ).toBeInTheDocument();
  await user.type(within(replaceDialog).getByLabelText('Code from the new app'), '654321');
  await user.click(within(replaceDialog).getByRole('button', { name: 'Replace authenticator' }));

  expect(await screen.findByText('Authenticator replaced')).toBeInTheDocument();
  expect(readStart()).toEqual({
    password: 'violet lantern drifts past seven quiet docks',
    code: 'K7QM-2XRD-9FTB',
  });
  expect(readConfirm()).toEqual({ code: '654321' });
});

test('signing out goes to sign in and forgets this browser’s appearance', async () => {
  captureRequest('post', '/backend/auth/sign-out', () =>
    HttpResponse.json({ status: 'signed_out' }),
  );
  window.localStorage.setItem(
    'daibx:appearance',
    JSON.stringify({ accentColor: 'teal', theme: 'dark' }),
  );
  const user = await openSettings();

  await user.click(screen.getByRole('button', { name: 'Sign out' }));

  await vi.waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/sign-in'));
  expect(window.localStorage.getItem('daibx:appearance')).toBeNull();
});

test('signing out everywhere goes to sign in', async () => {
  captureRequest('post', '/backend/auth/sign-out-everywhere', () =>
    HttpResponse.json({ status: 'signed_out' }),
  );
  const user = await openSettings();

  await user.click(
    within(await openDialog(user, 'Sign out everywhere?')).getByRole('button', {
      name: 'Sign out everywhere',
    }),
  );

  await vi.waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/sign-in'));
});

test('deleting the account needs the exact words and lands on the marketing page', async () => {
  const readDelete = captureRequest('post', '/backend/account/delete', () =>
    HttpResponse.json({ status: 'account_deleted' }),
  );
  const user = await openSettings();
  const deleteDialog = await openDialog(user, 'Delete your account?');

  await user.type(
    within(deleteDialog).getByLabelText('Password'),
    'violet lantern drifts past seven quiet docks',
  );
  await user.type(within(deleteDialog).getByLabelText('Authenticator code'), '123456');
  await user.type(
    within(deleteDialog).getByLabelText('Type “delete my account” to confirm'),
    'delete my account',
  );
  await user.click(within(deleteDialog).getByRole('button', { name: 'Delete account' }));

  await vi.waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/'));
  expect(readDelete()).toEqual({
    password: 'violet lantern drifts past seven quiet docks',
    code: '123456',
    confirmation: 'delete my account',
  });
});

test('deleting with the wrong words shows the backend message and stays', async () => {
  captureRequest('post', '/backend/account/delete', () =>
    HttpResponse.json({ error: 'type "delete my account" to confirm' }, { status: 422 }),
  );
  const user = await openSettings();
  const deleteDialog = await openDialog(user, 'Delete your account?');

  await user.type(
    within(deleteDialog).getByLabelText('Type “delete my account” to confirm'),
    'delete it',
  );
  await user.click(within(deleteDialog).getByRole('button', { name: 'Delete account' }));

  expect(await screen.findByText('Type "delete my account" to confirm.')).toBeInTheDocument();
  expect(routerReplace).not.toHaveBeenCalled();
});
