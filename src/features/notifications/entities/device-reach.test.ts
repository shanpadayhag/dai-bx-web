import { expect, test } from 'vitest';
import describeDeviceReach from '@/features/notifications/entities/device-reach';
import type PushDevice from '@/features/notifications/entities/push-device';

const currentTime = new Date('2026-11-22T12:00:00Z');
const pushDevice: PushDevice = {
  id: 'device-1',
  deviceName: 'iPhone · Safari',
  createdAt: '2026-11-20T12:00:00Z',
  lastDeliveredAt: null,
};

test('says when a device was added and when a notification last reached it', () => {
  expect(describeDeviceReach(pushDevice, currentTime)).toBe('Added Nov 20 · Not reached yet');
  expect(
    describeDeviceReach({ ...pushDevice, lastDeliveredAt: '2026-11-22T11:59:30Z' }, currentTime),
  ).toBe('Added Nov 20 · Reached just now');
  expect(
    describeDeviceReach({ ...pushDevice, lastDeliveredAt: '2026-11-22T11:15:00Z' }, currentTime),
  ).toBe('Added Nov 20 · Reached 45 minutes ago');
  expect(
    describeDeviceReach({ ...pushDevice, lastDeliveredAt: '2026-11-22T09:00:00Z' }, currentTime),
  ).toBe('Added Nov 20 · Reached 3 hours ago');
  expect(
    describeDeviceReach({ ...pushDevice, lastDeliveredAt: '2026-11-21T09:00:00Z' }, currentTime),
  ).toBe('Added Nov 20 · Reached yesterday');
});
