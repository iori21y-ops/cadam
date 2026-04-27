/**
 * /api/rental-price — 월렌탈료 조회 (캐피탈사 API 게이트웨이)
 *
 * 목적: 프론트 ↔ 캐피탈사 API 사이의 서버사이드 프록시.
 * 프론트에 캐피탈사 API 키가 노출되지 않도록, 모든 인증·요청을 이 라우트에서 처리한다.
 *
 * 현재 상태: Phase 1 구현 (Supabase rental_prices 테이블 조회)
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
import { createClient } from '@supabase/supabase-js';
import {
  applyRateLimit,
  secureError,
  allowCors,
  handleCorsPreflight,
  // requireServerApiKey, // ← Phase 2에서 사용
} from '@/lib/api/security';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// brand + model 필수, trim 선택
const RentalPriceRequest = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  trim: z.string().optional(),
  contractMonths: z.union([z.literal(36), z.literal(48), z.literal(60)]).optional(),
  annualKm: z.union([
    z.literal(10000),
    z.literal(20000),
    z.literal(30000),
    z.literal(40000),
  ]).optional(),
  deposit: z.number().min(0).max(50).default(0),
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

    // Phase 1: Supabase rental_prices 테이블 조회
    const { brand, model, trim, contractMonths, annualKm } = parsed.data;

    let query = supabase
      .from('rental_prices')
      .select('brand, model, trim, monthly_price, contract_months, annual_km, deposit_rate, includes_insurance, includes_tax, includes_maintenance, source, updated_at')
      .eq('brand', brand)
      .eq('model', model);

    if (trim)          query = query.eq('trim', trim);
    if (contractMonths) query = query.eq('contract_months', contractMonths);
    if (annualKm)      query = query.eq('annual_km', annualKm);

    const { data, error } = await query.order('monthly_price', { ascending: true });

    if (error) throw error;

    if (!data || data.length === 0) {
      const res = NextResponse.json(
        { status: 'not_found', message: '해당 차량의 렌탈료 정보가 없습니다. 상담 신청으로 안내드립니다.' },
        { status: 404 },
      );
      return allowCors(req, res);
    }

    // TODO(Phase 2): 캐시 미스 시 캐피탈사 API 호출 → 정규화 → upsert

    const res = NextResponse.json({ status: 'ok', data }, { status: 200 });
    return allowCors(req, res);
  } catch (err) {
    return secureError(err, 500);
  }
}
