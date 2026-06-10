/**
 * /api/estimate-preview — 견적 마법사(/estimate) 결과 화면용 월 예상 납입금 미리보기
 *
 * 목적: 상담 신청 "전에" 월 예상 범위를 보여주기 위한 읽기 전용 조회.
 *       (상담 API는 리드 저장 후에만 견적을 반환하므로 별도 분리)
 *
 * 데이터 신뢰 정책 (사장님 결정 2026-06-10):
 *   pricing 테이블은 만원/원 단위가 섞여 있고 상품유형·날짜별 중복 행이 쌓여 있다.
 *   따라서 아래 조건을 모두 만족하는 "깨끗한 행"만 신뢰한다:
 *     - source = 'auto'          (자동생성 최신 파이프라인)
 *     - product_type = 'rent'    (장기렌트 기준)
 *     - 만원 단위              (min_monthly 가 MANWON_MAX 미만 → 원 단위 레거시 행 배제)
 *   조건을 만족하는 행이 없으면 not_found → 프론트는 '상담으로 안내' 표시.
 *
 * 반환 단위: 만원 (프론트에서 'OO~OO만원'으로 표시)
 */
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import {
  applyRateLimit,
  secureError,
  allowCors,
  handleCorsPreflight,
} from '@/lib/api/security';
import { normalizeModelName } from '@/lib/normalizeModel';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// 만원 단위 판정 상한: min_monthly 가 이 값 이상이면 원 단위 레거시 행으로 보고 배제
const MANWON_MAX = 3000;

const EstimatePreviewRequest = z.object({
  brand: z.string().min(1),
  model: z.string().min(1),
  contractMonths: z.union([z.literal(36), z.literal(48), z.literal(60)]),
  annualKm: z.union([z.literal(10000), z.literal(20000), z.literal(30000)]),
});

export async function OPTIONS(req: NextRequest) {
  return handleCorsPreflight(req);
}

export async function POST(req: NextRequest) {
  const rl = await applyRateLimit(req);
  if (rl) return rl;

  try {
    const body = await req.json();
    const parsed = EstimatePreviewRequest.safeParse(body);
    if (!parsed.success) {
      return allowCors(req, NextResponse.json({ status: 'error', message: '잘못된 요청' }, { status: 400 }));
    }

    const { brand, model, contractMonths, annualKm } = parsed.data;
    const carModel = normalizeModelName(model);

    const { data, error } = await supabase
      .from('pricing')
      .select('min_monthly, max_monthly, price_date, conditions')
      .eq('car_brand', brand)
      .eq('car_model', carModel)
      .eq('contract_months', contractMonths)
      .eq('annual_km', annualKm)
      .eq('is_active', true);

    if (error) throw error;

    // conditions 컬럼은 jsonb 문자열 스칼라로 이중 인코딩돼 있어(예: '{"source":"auto",...}'),
    // Supabase JS가 객체가 아닌 문자열로 반환한다. 문자열이면 한 번 더 파싱한다.
    const parseConditions = (raw: unknown): Record<string, unknown> => {
      if (raw && typeof raw === 'object') return raw as Record<string, unknown>;
      if (typeof raw === 'string') {
        try {
          const v = JSON.parse(raw);
          return v && typeof v === 'object' ? (v as Record<string, unknown>) : {};
        } catch {
          return {};
        }
      }
      return {};
    };

    // 깨끗한 행만: 자동생성 + 장기렌트 + 만원 단위
    const clean = (data ?? []).filter((r) => {
      const c = parseConditions(r.conditions);
      return (
        c.source === 'auto' &&
        c.product_type === 'rent' &&
        typeof r.min_monthly === 'number' &&
        r.min_monthly > 0 &&
        r.min_monthly < MANWON_MAX &&
        typeof r.max_monthly === 'number' &&
        r.max_monthly < MANWON_MAX
      );
    });

    if (clean.length === 0) {
      return allowCors(req, NextResponse.json({ status: 'not_found' }, { status: 200 }));
    }

    // 최신 price_date 행 채택
    clean.sort((a, b) => String(b.price_date).localeCompare(String(a.price_date)));
    const latest = clean[0];

    return allowCors(
      req,
      NextResponse.json(
        { status: 'ok', min: latest.min_monthly, max: latest.max_monthly, unit: '만원' },
        { status: 200 },
      ),
    );
  } catch (err) {
    return secureError(err, 500);
  }
}
