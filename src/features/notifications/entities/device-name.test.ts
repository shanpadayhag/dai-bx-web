import { expect, test } from 'vitest';
import deviceName from '@/features/notifications/entities/device-name';

const deviceCases: { userAgent: string; maxTouchPoints: number; expectedName: string }[] = [
  {
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
    maxTouchPoints: 5,
    expectedName: 'iPhone · Safari',
  },
  {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
    maxTouchPoints: 5,
    expectedName: 'iPad · Safari',
  },
  {
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    maxTouchPoints: 0,
    expectedName: 'Mac · Chrome',
  },
  {
    userAgent:
      'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36',
    maxTouchPoints: 5,
    expectedName: 'Android · Chrome',
  },
  {
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0',
    maxTouchPoints: 0,
    expectedName: 'Windows · Edge',
  },
  {
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:133.0) Gecko/20100101 Firefox/133.0',
    maxTouchPoints: 0,
    expectedName: 'Linux · Firefox',
  },
  { userAgent: 'curl/8.7.1', maxTouchPoints: 0, expectedName: 'This device · Browser' },
];

test.each(deviceCases)('names $expectedName', ({ userAgent, maxTouchPoints, expectedName }) => {
  expect(deviceName(userAgent, maxTouchPoints)).toBe(expectedName);
});
