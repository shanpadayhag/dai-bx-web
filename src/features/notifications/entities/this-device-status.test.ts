import { expect, test } from 'vitest';
import thisDeviceStatus, {
  type ThisDeviceFacts,
} from '@/features/notifications/entities/this-device-status';

const registeredFacts: ThisDeviceFacts = {
  pushSupport: 'supported',
  permission: 'granted',
  thisDeviceId: 'device-1',
};

test('a registered device with permission is on', () => {
  expect(thisDeviceStatus(registeredFacts)).toBe('on');
  expect(thisDeviceStatus(registeredFacts, ['device-1', 'device-2'])).toBe('on');
});

test('a device the list no longer has, or that never registered, is off', () => {
  expect(thisDeviceStatus(registeredFacts, ['device-2'])).toBe('off');
  expect(thisDeviceStatus({ ...registeredFacts, thisDeviceId: null })).toBe('off');
  expect(thisDeviceStatus({ ...registeredFacts, permission: 'default' })).toBe('off');
});

test('a refused permission is blocked', () => {
  expect(thisDeviceStatus({ ...registeredFacts, permission: 'denied' })).toBe('blocked');
});

test('support problems come before permission', () => {
  expect(
    thisDeviceStatus({
      ...registeredFacts,
      pushSupport: 'needs-home-screen',
      permission: 'denied',
    }),
  ).toBe('needs-home-screen');
  expect(thisDeviceStatus({ ...registeredFacts, pushSupport: 'unsupported' })).toBe('unsupported');
});
