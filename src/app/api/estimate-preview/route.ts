/**
 * /api/estimate-preview — 견적 마법사(/estimate) 결과 화면용 월 예상 납입금 미리보기
 *
 * 목적: 상담 신청 "전에" 월 예상 범위를 보여주기 위한 읽기 전용 조회.
 *       엄격 필터 로직은 /api/consultation 과 공유한다(@/lib/estimatePricing).
 *
 * 반환 단위: 만원 (프론트에서 'OO~OO만원'으로 표시).
 * 깨끗한 행이 없으면 status:'not_found' → 프론트는 '상담으로 안내' 표시.
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
import { getRentEstimateManwon } from '@/lib/estimatePricing';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

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

    const est = await getRentEstimateManwon(supabase, parsed.data);

    if (!est) {
      return allowCors(req, NextResponse.json({ status: 'not_found' }, { status: 200 }));
    }

    return allowCors(
      req,
      NextResponse.json({ status: 'ok', min: est.min, max: est.max, unit: '만원' }, { status: 200 }),
    );
  } catch (err) {
    return secureError(err, 500);
  }
}
