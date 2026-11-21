import type { NextConfig } from 'next';
import { buildSecurityHeaders } from './src/core/security/security-headers';

const isDevelopment = process.env.NODE_ENV === 'development';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  headers: async () => [
    { source: '/:path*', headers: buildSecurityHeaders(isDevelopment) },
    { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache' }] },
  ],
};

export default nextConfig;
