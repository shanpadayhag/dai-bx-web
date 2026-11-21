export const buildContentSecurityPolicy = (isDevelopment: boolean): string => {
  const scriptSources = ["'self'", "'unsafe-inline'"];
  const connectSources = ["'self'"];
  if (isDevelopment) {
    scriptSources.push("'unsafe-eval'");
    connectSources.push('ws:');
  }

  return [
    "default-src 'self'",
    `script-src ${scriptSources.join(' ')}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    `connect-src ${connectSources.join(' ')}`,
    "worker-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
};

export const buildSecurityHeaders = (isDevelopment: boolean) => [
  { key: 'Content-Security-Policy', value: buildContentSecurityPolicy(isDevelopment) },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];
