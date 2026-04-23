/**
 * API Route 공통 보안 유틸
 *
 * - rate limiting: 기존 /lib/rateLimit.ts(Upstash 분산) 재활용
 * - 서버 전용 API 키 접근
 * - 민감정보 노출 없는 표준 에러 응답
 * - rentailor.co.kr + 로컬/Vercel preview만 허용하는 CORS 헤더
 *
 * 사용 예:
 *   import { applyRateLimit, secureError, allowCors } from '@/lib/api/security';
 *
 *   export async function POST(req: NextRequest) {
 *     const rl = await applyRateLimit(req);
 *     if (rl) return rl;
 *     try { ... } catch (e) { return secureError(e, 500); }
 *   }
 */

import { NextRequest, NextResponse } from 'next/server';
import { rateLimiter } from '@/lib/rateLimit';

const ALLOWED_ORIGINS = [
  'https://rentailor.co.kr',
  'https://www.rentailor.co.kr',
  'http://localhost:3000',
  'http://localhost:3001',
];

// Vercel preview 도메인 패턴: *.vercel.app
const VERCEL_PREVIEW_RE = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;


/** 요청 IP 추출 — Vercel/Cloudflare 프록시 헤더 우선 */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}


/**
 * Rate limit 적용. 제한 시 429 응답을 반환, 통과 시 null.
 * @returns NextResponse(429) or null
 */
export async function applyRateLimit(
  req: NextRequest
): Promise<NextResponse | null> {
  const ip = getClientIp(req);
  const { success, reset } = await rateLimiter.limit(ip);
  if (!success) {
    return NextResponse.json(
      { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }
  return null;
}


/**
 * 서버 환경변수에서만 API 키 조회.
 * NEXT_PUBLIC_ 접두사 키는 의도적으로 거부 — 프론트 노출 위험 방지.
 */
export function requireServerApiKey(envName: string): string {
  if (envName.startsWith('NEXT_PUBLIC_')) {
    throw new Error(
      `[security] NEXT_PUBLIC_* 변수는 서버 전용 키로 쓰면 안 됩니다: ${envName}`
    );
  }
  const v = process.env[envName];
  if (!v) {
    throw new Error(`[security] 환경변수 누락: ${envName}`);
  }
  return v;
}


/**
 * 표준 에러 응답 — 스택 트레이스/내부 경로 등이 절대 응답에 포함되지 않도록.
 * 실제 에러는 서버 로그로만 남김.
 */
export function secureError(err: unknown, status = 500): NextResponse {
  // 서버 로그에만 상세 출력
  console.error('[API error]', err);
  return NextResponse.json(
    {
      error: status === 500 ? '서버 오류가 발생했습니다.' : '요청을 처리할 수 없습니다.',
    },
    { status }
  );
}


/** Origin이 허용 목록에 있는지 검증 */
function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  return VERCEL_PREVIEW_RE.test(origin);
}


/**
 * CORS 헤더 세팅 헬퍼.
 * GET/HEAD는 open, 그 외는 허용 도메인만.
 */
export function allowCors(req: NextRequest, res: NextResponse): NextResponse {
  const origin = req.headers.get('origin');
  if (isAllowedOrigin(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin!);
    res.headers.set('Vary', 'Origin');
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  }
  return res;
}


/** Preflight(OPTIONS) 요청 처리 */
export function handleCorsPreflight(req: NextRequest): NextResponse {
  const res = new NextResponse(null, { status: 204 });
  return allowCors(req, res);
}
