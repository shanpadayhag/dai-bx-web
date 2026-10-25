import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { announceProfileChange } from '@/core/profile-change';
import SessionGate from '@/features/auth/components/session-gate';
import SidebarAccount from '@/features/auth/components/sidebar-account';
import startBackendServer from '@/test-support/backend-server';
import renderWithToaster from '@/test-support/render-with-toaster';

const routerReplace = vi.hoisted(() => vi.fn());
const stableRouter = vi.hoisted(() => ({ push: vi.fn(), replace: routerReplace }));
vi.mock('next/navigation', () => ({ useRouter: () => stableRouter }));

const backendServer = startBackendServer();

beforeEach(() => {
  window.history.pushState({}, '', '/today');
  backendServer.use(
    http.get('/backend/auth/session', () =>
      HttpResponse.json({
        user: {
          name: 'Shan Padayhag',
          email: 'shan@daibx.test',
          accentColor: 'blue',
          theme: 'system',
        },
      }),
    ),
  );
});
afterEach(() => routerReplace.mockReset());

const renderSignedInSidebar = () =>
  renderWithToaster(
    <SessionGate>
      <SidebarAccount />
    </SessionGate>,
  );

test('the sidebar shows who is signed in', async () => {
  renderSignedInSidebar();

  expect(await screen.findByText('Shan Padayhag')).toBeInTheDocument();
  expect(screen.getByText('shan@daibx.test')).toBeInTheDocument();
  expect(screen.getByText('SP')).toBeInTheDocument();
});

test('signing out from the sidebar ends the session and goes to sign in', async () => {
  let signOutRequestCount = 0;
  backendServer.use(
    http.post('/backend/auth/sign-out', () => {
      signOutRequestCount += 1;
      return HttpResponse.json({ status: 'signed_out' });
    }),
  );
  const user = userEvent.setup();
  renderSignedInSidebar();

  await user.click(await screen.findByRole('button', { name: 'Sign out' }));

  await vi.waitFor(() => expect(routerReplace).toHaveBeenCalledWith('/sign-in'));
  expect(signOutRequestCount).toBe(1);
});

test('a name changed in settings shows in the sidebar straight away', async () => {
  renderSignedInSidebar();
  await screen.findByText('Shan Padayhag');

  act(() => announceProfileChange({ name: 'Shan P.' }));

  expect(await screen.findByText('Shan P.')).toBeInTheDocument();
});
