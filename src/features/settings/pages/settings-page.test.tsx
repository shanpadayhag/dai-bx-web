import { fireEvent, screen, waitFor, within } from '@testing-library/react';
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

const storedSessions = [
  {
    id: 'session-laptop',
    createdAt: '2026-10-20T08:00:00Z',
    lastSeenAt: new Date().toISOString(),
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
    isCurrent: true,
  },
  {
    id: 'session-phone',
    createdAt: '2026-10-21T08:00:00Z',
    lastSeenAt: '2026-10-24T08:00:00Z',
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    isCurrent: false,
  },
];

const storedCategories = [
  { id: 'category-goals', name: 'Goals', color: '#7c95bd' },
  { id: 'category-studies', name: 'Studies', color: '#be7e86' },
];

let currentAccount = storedAccount;
let currentSessions = storedSessions;

beforeEach(() => {
  currentAccount = structuredClone(storedAccount);
  currentSessions = structuredClone(storedSessions);
  backendServer.use(
    http.get('/backend/account', () => HttpResponse.json(currentAccount)),
    http.get('/backend/account/sessions', () => HttpResponse.json({ sessions: currentSessions })),
    http.get('/backend/categories', () => HttpResponse.json(storedCategories)),
  );
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
  const profileChangedListener = vi.fn();
  window.addEventListener('daibx:profile-changed', profileChangedListener);
  const readPatch = captureRequest('patch', '/backend/account', () =>
    HttpResponse.json({ ...storedAccount, name: 'Shan P.' }),
  );
  const user = await openSettings();

  await user.clear(screen.getByLabelText('Name'));
  await user.type(screen.getByLabelText('Name'), 'Shan P.');
  await user.tab();

  expect(await screen.findByText('Name saved')).toBeInTheDocument();
  expect(readPatch()).toEqual({ name: 'Shan P.' });
  expect(profileChangedListener).toHaveBeenCalledTimes(1);
  window.removeEventListener('daibx:profile-changed', profileChangedListener);
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

test('the devices dialog lists every session, marking this one', async () => {
  const user = await openSettings();

  const sessionsDialog = await openDialog(user, 'Signed-in devices');

  expect(within(sessionsDialog).getByText('Chrome on macOS')).toBeInTheDocument();
  expect(within(sessionsDialog).getByText('Safari on iOS')).toBeInTheDocument();
  expect(within(sessionsDialog).getByText('This device')).toBeInTheDocument();
  expect(within(sessionsDialog).getAllByRole('button', { name: /^End / })).toHaveLength(1);
});

test('ending another device needs the password and refreshes the list', async () => {
  const readEnd = captureRequest('post', '/backend/account/sessions/end', () => {
    currentSessions = currentSessions.filter((listedSession) => listedSession.isCurrent);
    return HttpResponse.json({ status: 'session_ended' });
  });
  const user = await openSettings();
  const sessionsDialog = await openDialog(user, 'Signed-in devices');

  await user.type(
    within(sessionsDialog).getByLabelText('Your password'),
    'violet lantern drifts past seven quiet docks',
  );
  await user.click(within(sessionsDialog).getByRole('button', { name: 'End Safari on iOS' }));

  expect(await screen.findByText('Device signed out')).toBeInTheDocument();
  expect(readEnd()).toEqual({
    sessionId: 'session-phone',
    password: 'violet lantern drifts past seven quiet docks',
  });
  await vi.waitFor(() =>
    expect(within(sessionsDialog).queryByText('Safari on iOS')).not.toBeInTheDocument(),
  );
});

test('signing out everywhere needs the password and goes to sign in', async () => {
  const readEndAll = captureRequest('post', '/backend/account/sessions/end-all', () =>
    HttpResponse.json({ status: 'signed_out' }),
  );
  const user = await openSettings();
  const sessionsDialog = await openDialog(user, 'Signed-in devices');

  await user.type(
    within(sessionsDialog).getByLabelText('Your password'),
    'violet lantern drifts past seven quiet docks',
  );
  await user.click(within(sessionsDialog).getByRole('button', { name: 'Sign out everywhere' }));

  await vi.waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/sign-in'));
  expect(readEndAll()).toEqual({ password: 'violet lantern drifts past seven quiet docks' });
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

test('the categories section lists the categories from the API', async () => {
  await openSettings();

  expect(screen.getByRole('textbox', { name: 'Rename Goals' })).toHaveValue('Goals');
  expect(screen.getByRole('textbox', { name: 'Rename Studies' })).toHaveValue('Studies');
});

test('adding a category sends its trimmed name and color and lists it', async () => {
  const readCreateBody = captureRequest('post', '/backend/categories', () =>
    HttpResponse.json({ id: 'category-health', name: 'Health', color: '#8fae9a' }, { status: 201 }),
  );
  const user = await openSettings();

  await user.type(screen.getByRole('textbox', { name: 'New category name' }), '  Health  ');
  await user.click(screen.getByRole('button', { name: 'Add category' }));

  expect(await screen.findByRole('textbox', { name: 'Rename Health' })).toHaveValue('Health');
  expect(readCreateBody()).toEqual({ name: 'Health', color: '#8fae9a' });
  expect(screen.getByRole('textbox', { name: 'New category name' })).toHaveValue('');
});

test('a name already in use shows under the new category field', async () => {
  backendServer.use(
    http.post('/backend/categories', () =>
      HttpResponse.json({ error: 'you already have a category with that name' }, { status: 409 }),
    ),
  );
  const user = await openSettings();

  await user.type(screen.getByRole('textbox', { name: 'New category name' }), 'goals');
  await user.click(screen.getByRole('button', { name: 'Add category' }));

  expect(await screen.findByText('You already have a category with that name.')).toBeVisible();
  expect(screen.getByRole('textbox', { name: 'New category name' })).toHaveAttribute(
    'aria-invalid',
    'true',
  );
});

test('renaming a category saves on Enter and a clash shows on its row', async () => {
  const readRenameBody = captureRequest('patch', '/backend/categories/category-studies', () =>
    HttpResponse.json({ id: 'category-studies', name: 'Chinese', color: '#be7e86' }),
  );
  const user = await openSettings();
  const studiesNameInput = screen.getByRole('textbox', { name: 'Rename Studies' });

  await user.clear(studiesNameInput);
  await user.type(studiesNameInput, 'Chinese{Enter}');

  expect(await screen.findByRole('textbox', { name: 'Rename Chinese' })).toHaveValue('Chinese');
  expect(readRenameBody()).toEqual({ name: 'Chinese' });

  backendServer.use(
    http.patch('/backend/categories/category-goals', () =>
      HttpResponse.json({ error: 'you already have a category with that name' }, { status: 409 }),
    ),
  );
  const goalsNameInput = screen.getByRole('textbox', { name: 'Rename Goals' });
  await user.clear(goalsNameInput);
  await user.type(goalsNameInput, 'Chinese{Enter}');

  expect(await screen.findByText('You already have a category with that name.')).toBeVisible();
  expect(goalsNameInput).toHaveAttribute('aria-invalid', 'true');
});

test('choosing a new color saves it', async () => {
  const readRecolorBody = captureRequest('patch', '/backend/categories/category-goals', () =>
    HttpResponse.json({ id: 'category-goals', name: 'Goals', color: '#123456' }),
  );
  await openSettings();
  const goalsColorInput = screen.getByLabelText('Goals color');

  fireEvent.input(goalsColorInput, { target: { value: '#123456' } });
  fireEvent.change(goalsColorInput, { target: { value: '#123456' } });

  await waitFor(() => expect(readRecolorBody()).toEqual({ color: '#123456' }));
});

test('deleting a category asks first, then removes it', async () => {
  let isDeleted = false;
  backendServer.use(
    http.delete('/backend/categories/category-studies', () => {
      isDeleted = true;
      return HttpResponse.json({ status: 'deleted' });
    }),
  );
  const user = await openSettings();

  await user.click(screen.getByRole('button', { name: 'Delete Studies' }));
  const deleteDialog = screen.getByRole('dialog', { name: 'Delete category', hidden: true });
  expect(within(deleteDialog).getByText('Delete “Studies”?')).toBeInTheDocument();
  await user.click(
    within(deleteDialog).getByRole('button', { name: 'Delete category', hidden: true }),
  );

  await waitFor(() =>
    expect(screen.queryByRole('textbox', { name: 'Rename Studies' })).not.toBeInTheDocument(),
  );
  expect(isDeleted).toBe(true);
});
