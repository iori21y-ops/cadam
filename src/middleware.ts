import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

const THIRTY_DAYS = 60 * 60 * 24 * 30;
const TWENTY_FOUR_HOURS = 60 * 60 * 24;

export async function middleware(request: NextRequest) {
  // ── 어드민 라우트 서버 측 인증 가드 ──────────────────────
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith('/admin');
  const isLoginPage = pathname === '/admin/login';

  if (isAdminRoute && !isLoginPage) {
    let response = NextResponse.next({ request });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return request.cookies.getAll() },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const loginUrl = new URL('/admin/login', request.url);
      return NextResponse.redirect(loginUrl);
    }

    return response;
  }

  // ── 공개 라우트 쿠키 처리 ─────────────────────────────────
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
  matcher: ['/', '/info', '/popular-estimates', '/cars/:path*', '/admin/:path*'],
};
