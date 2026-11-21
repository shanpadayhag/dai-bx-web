import { expect, test } from 'vitest';
import pushSupport, { type PushEnvironment } from '@/features/notifications/entities/push-support';

const desktopChrome: PushEnvironment = {
  hasServiceWorker: true,
  hasPushManager: true,
  hasNotification: true,
  isAppleMobile: false,
  isStandalone: false,
};

test('a browser with a service worker, push and notifications is supported', () => {
  expect(pushSupport(desktopChrome)).toBe('supported');
});

test('an iPhone in Safari needs DaiBX on the Home Screen first', () => {
  expect(pushSupport({ ...desktopChrome, hasPushManager: false, isAppleMobile: true })).toBe(
    'needs-home-screen',
  );
});

test('an iPhone opened from the Home Screen is supported', () => {
  expect(pushSupport({ ...desktopChrome, isAppleMobile: true, isStandalone: true })).toBe(
    'supported',
  );
});

test('a browser without push or notifications is not supported', () => {
  expect(pushSupport({ ...desktopChrome, hasPushManager: false })).toBe('unsupported');
  expect(pushSupport({ ...desktopChrome, hasNotification: false })).toBe('unsupported');
  expect(pushSupport({ ...desktopChrome, hasServiceWorker: false })).toBe('unsupported');
});
