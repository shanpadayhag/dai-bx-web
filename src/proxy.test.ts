import { NextRequest } from 'next/server';
import {
  getRewrittenUrl,
  isRewrite,
  unstable_doesMiddlewareMatch,
} from 'next/experimental/testing/server';
import { afterEach, expect, test, vi } from 'vitest';
import nextConfig from '../next.config';
import { config, proxy } from '@/proxy';

const APP_URL = 'https://dai-bx.vercel.app';
const ORIGIN_SECRET = 'web-test-origin-secret-of-at-least-32-chars';
const FORWARDED_SECRET_HEADER = 'x-middleware-request-x-daibx-origin-secret';

afterEach(() => vi.unstubAllEnvs());

const stubApiSettings = () => {
  vi.stubEnv('API_ORIGIN', 'https://lambda.example');
  vi.stubEnv('ORIGIN_SECRET', ORIGIN_SECRET);
};

test('the proxy runs for /backend paths only', () => {
  for (const backendPath of ['/backend', '/backend/health', '/backend/auth/sign-in']) {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig, url: backendPath })).toBe(true);
  }
  for (const pagePath of ['/', '/board', '/backends', '/sign-in']) {
    expect(unstable_doesMiddlewareMatch({ config, nextConfig, url: pagePath })).toBe(false);
  }
});

test('a /backend call is rewritten to the API without the prefix, keeping its query', () => {
  stubApiSettings();

  const response = proxy(new NextRequest(`${APP_URL}/backend/task-groups?page=2`));

  expect(isRewrite(response)).toBe(true);
  expect(getRewrittenUrl(response)).toBe('https://lambda.example/task-groups?page=2');
});

test('the rewrite carries the origin secret and replaces one the browser sent', () => {
  stubApiSettings();

  const response = proxy(
    new NextRequest(`${APP_URL}/backend/auth/session`, {
      headers: { 'x-daibx-origin-secret': 'guessed-by-the-browser', cookie: 'session=abc' },
    }),
  );

  expect(response.headers.get(FORWARDED_SECRET_HEADER)).toBe(ORIGIN_SECRET);
  expect(response.headers.get('x-middleware-request-cookie')).toBe('session=abc');
});

test('with no API configured, /backend is left to 404', () => {
  vi.stubEnv('API_ORIGIN', '');

  const response = proxy(new NextRequest(`${APP_URL}/backend/health`));

  expect(isRewrite(response)).toBe(false);
  expect(response.headers.get(FORWARDED_SECRET_HEADER)).toBeNull();
});

test('an API without an origin secret fails loudly instead of calling the API unsigned', () => {
  vi.stubEnv('API_ORIGIN', 'https://lambda.example');
  vi.stubEnv('ORIGIN_SECRET', ' ');

  expect(() => proxy(new NextRequest(`${APP_URL}/backend/health`))).toThrow(
    'ORIGIN_SECRET must be set',
  );
});
