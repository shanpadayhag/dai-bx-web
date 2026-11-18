import { NextResponse, type NextRequest } from 'next/server';
import appConfig from '@/core/config/app-config';
import { readApiProxySettings } from '@/core/config/api-proxy-settings';

const ORIGIN_SECRET_HEADER = 'x-daibx-origin-secret';

export const config = { matcher: '/backend/:path*' };

export const proxy = (request: NextRequest): NextResponse => {
  const apiProxySettings = readApiProxySettings();
  if (!apiProxySettings) return NextResponse.next();

  const { pathname, search } = request.nextUrl;
  const apiPath = pathname.slice(appConfig.backendPath.length) || '/';
  const apiUrl = new URL(`${apiPath}${search}`, apiProxySettings.apiOrigin);
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set(ORIGIN_SECRET_HEADER, apiProxySettings.originSecret);

  return NextResponse.rewrite(apiUrl, { request: { headers: forwardedHeaders } });
};
