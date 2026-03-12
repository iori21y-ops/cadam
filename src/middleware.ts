import { NextRequest, NextResponse } from 'next/server';

const THIRTY_DAYS = 60 * 60 * 24 * 30;
const TWENTY_FOUR_HOURS = 60 * 60 * 24;

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 1. User-Agent → device_type
  const ua = request.headers.get('user-agent') ?? '';
  const isMobile = /Mobile|Android|iPhone/i.test(ua);
  response.cookies.set('device_type', isMobile ? 'Mobile' : 'Desktop', {
    maxAge: THIRTY_DAYS,
  });

  // 2. Referer → referrer (이미 있으면 덮어쓰지 않음)
  const referer = request.headers.get('referer') ?? '';
  const existingReferrer = request.cookies.get('referrer');
  if (referer && !existingReferrer) {
    response.cookies.set('referrer', referer, { maxAge: THIRTY_DAYS });
  }

  // 3. UTM → utm_source
  const utmSource = request.nextUrl.searchParams.get('utm_source');
  if (utmSource) {
    response.cookies.set('utm_source', utmSource, { maxAge: THIRTY_DAYS });
  }

  // 4. inflow_page
  response.cookies.set('inflow_page', request.nextUrl.pathname, {
    maxAge: TWENTY_FOUR_HOURS,
  });

  return response;
}

export const config = {
  matcher: ['/', '/info', '/popular-estimates', '/cars/:path*'],
};
