import type { NextConfig } from 'next';

const apiOrigin = process.env.API_ORIGIN;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async rewrites() {
    if (!apiOrigin) {
      return [];
    }
    return [{ source: '/backend/:path*', destination: `${apiOrigin}/:path*` }];
  },
};

export default nextConfig;
