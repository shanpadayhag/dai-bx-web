import { unstable_getResponseFromNextConfig } from 'next/experimental/testing/server';
import { expect, test } from 'vitest';
import nextConfig from '../next.config';
import { buildContentSecurityPolicy } from '@/core/security/security-headers';

const APP_URL = 'https://dai-bx.vercel.app';
const PAGE_PATHS = ['/', '/sign-in', '/set-up-authenticator', '/tasks', '/board', '/calendar'];

const PRODUCTION_CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

const readPageHeaders = async (pagePath: string): Promise<Headers> => {
  const configResponse = await unstable_getResponseFromNextConfig({
    url: `${APP_URL}${pagePath}`,
    nextConfig,
  });
  return configResponse.headers;
};

test.each(PAGE_PATHS)('%s gets the security headers', async (pagePath) => {
  const pageHeaders = await readPageHeaders(pagePath);

  expect(pageHeaders.get('content-security-policy')).toBe(buildContentSecurityPolicy(false));
  expect(pageHeaders.get('x-content-type-options')).toBe('nosniff');
  expect(pageHeaders.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
  expect(pageHeaders.get('permissions-policy')).toBe('camera=(), microphone=(), geolocation=()');
});

test('the production policy allows only this site, inline boot scripts and outside images', () => {
  expect(buildContentSecurityPolicy(false)).toBe(PRODUCTION_CONTENT_SECURITY_POLICY);
});

test('the development policy adds only what the Next dev server needs', () => {
  const developmentPolicy = buildContentSecurityPolicy(true);

  expect(developmentPolicy).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval'");
  expect(developmentPolicy).toContain("connect-src 'self' ws:");
  expect(developmentPolicy.replace(" 'unsafe-eval'", '').replace(' ws:', '')).toBe(
    PRODUCTION_CONTENT_SECURITY_POLICY,
  );
});

test('the site does not say it runs on Next.js', () => {
  expect(nextConfig.poweredByHeader).toBe(false);
});
