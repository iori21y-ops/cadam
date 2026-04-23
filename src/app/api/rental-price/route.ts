/**
 * /api/rental-price — 월렌탈료 조회 (캐피탈사 API 게이트웨이)
 *
 * 목적: 프론트 ↔ 캐피탈사 API 사이의 서버사이드 프록시.
 * 프론트에 캐피탈사 API 키가 노출되지 않도록, 모든 인증·요청을 이 라우트에서 처리한다.
 *
 * 현재 상태: 빈 템플릿 (캐피탈사 API 계약 확정 전)
 *
 * ─────────────────────────────────────────────────────────
 * 구조 — 4단계
 * ─────────────────────────────────────────────────────────
 *
 * 1) 공통 보안 검사
 *    - applyRateLimit: IP당 분당 요청 제한
 *    - Zod로 req.body 스키마 검증 (차종/트림/약정/주행/보증금)
 *    - allowCors: 렌테일러 도메인만 허용
 *
 * 2) 캐싱 계층 (Phase 1)
 *    - Supabase `rental_prices` 테이블을 1차 소스로 조회 (수동 입력된 최신 시세)
 *    - 테이블이 비어있거나 N일 이상 낡았으면 3단계로 fallthrough
 *
 * 3) 캐피탈사 API 호출 (Phase 2 — 제휴 후)
 *    - requireServerApiKey('CAPITAL_API_KEY') 로 키 로드
 *    - 외부 API 호출 → 응답 정규화 → 프론트 노출 필드만 반환
 *    - 성공 시 결과를 Supabase에 upsert (다음 요청부터는 2단계에서 히트)
 *
 * 4) 에러 처리
 *    - secureError: 스택/내부 경로 노출 차단
 *    - 캐피탈사 API 실패 시에도 2단계 캐시값이 있으면 stale-while-error로 반환 가능
 *
 * ─────────────────────────────────────────────────────────
 * 교체 지점 — Phase 1 → Phase 2
 * ─────────────────────────────────────────────────────────
 * 프론트 컴포넌트는 이 라우트만 호출하므로, 캐피탈사 API 연동 시
 * 이 파일의 3단계 블록만 교체하면 프론트 수정 불필요.
 *
 * 참조:
 *   ~/projects/cadam/rentailor-plan/NEXT_ACTIONS.md — "C. 렌탈료 API 연동 준비"
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  applyRateLimit,
  secureError,
  allowCors,
  handleCorsPreflight,
  // requireServerApiKey, // ← Phase 2에서 사용
} from '@/lib/api/security';

// 요청 스키마 — 캐피탈사 API 계약 확정 후 조정 필요
const RentalPriceRequest = z.object({
  vehicleSlug: z.string().min(1),
  trim: z.string().optional(),
  contractMonths: z.union([z.literal(36), z.literal(48), z.literal(60)]),
  annualKm: z.union([
    z.literal(10000),
    z.literal(20000),
    z.literal(30000),
    z.literal(40000),
  ]),
  deposit: z.number().min(0).max(50).default(0), // 보증금 %
});

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function POST(req: NextRequest) {
  // 1) rate limit
  const rl = await applyRateLimit(req);
  if (rl) return rl;

  try {
    // 2) 입력 검증
    const body = await req.json();
    const parsed = RentalPriceRequest.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: '잘못된 요청' }, { status: 400 });
    }

    // TODO(Phase 1): Supabase `rental_prices` 테이블 조회
    // TODO(Phase 2): 캐시 미스 시 캐피탈사 API 호출 → 정규화 → upsert

    const res = NextResponse.json(
      {
        status: 'not_implemented',
        message: '캐피탈사 API 연동 전입니다. 상담 신청으로 안내드립니다.',
      },
      { status: 501 }
    );
    return allowCors(req, res);
  } catch (err) {
    return secureError(err, 500);
  }
}
