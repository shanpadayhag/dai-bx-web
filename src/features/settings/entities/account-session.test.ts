import { expect, test } from 'vitest';
import {
  describeLastActive,
  describeSessionDevice,
} from '@/features/settings/entities/account-session';

test.each([
  [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36',
    'Chrome on macOS',
  ],
  [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    'Safari on iOS',
  ],
  [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
    'Firefox on Windows',
  ],
  [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 Edg/131.0',
    'Edge on Windows',
  ],
  ['curl/8.4.0', 'Unknown device'],
])('the user agent %s reads as %s', (userAgent, expectedDevice) => {
  expect(describeSessionDevice(userAgent)).toBe(expectedDevice);
});

test('a missing user agent reads as an unknown device', () => {
  expect(describeSessionDevice(null)).toBe('Unknown device');
});

test.each([
  ['2026-10-25T11:59:30Z', 'Active now'],
  ['2026-10-25T11:40:00Z', 'Active 20 minutes ago'],
  ['2026-10-25T07:00:00Z', 'Active 5 hours ago'],
  ['2026-10-24T12:00:00Z', 'Active yesterday'],
  ['2026-10-20T12:00:00Z', 'Active 5 days ago'],
])('a session last seen at %s reads as %s', (lastSeenAt, expectedLabel) => {
  expect(describeLastActive(lastSeenAt, new Date('2026-10-25T12:00:00Z'))).toBe(expectedLabel);
});
