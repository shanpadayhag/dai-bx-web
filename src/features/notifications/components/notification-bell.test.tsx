import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, test } from 'vitest';
import NotificationBell from '@/features/notifications/components/notification-bell';
import installFakeBrowserPush, { removeFakeBrowserPush } from '@/test-support/fake-browser-push';

beforeEach(() => installFakeBrowserPush({ permission: 'denied' }));
afterEach(() => removeFakeBrowserPush());

test('the bell shows this device and closes when its settings link is followed', async () => {
  const user = userEvent.setup();
  render(<NotificationBell />);

  await user.click(screen.getByRole('button', { name: 'Notifications' }));
  const bellPanel = screen.getByRole('dialog', { name: 'Notifications' });
  expect(bellPanel).toHaveTextContent('Your browser blocks DaiBX');

  await user.click(screen.getByRole('link', { name: 'Notification settings' }));

  expect(bellPanel).not.toBeVisible();
});
