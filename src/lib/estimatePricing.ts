/**
 * 견적 시세 공유 조회 로직 — /api/estimate-preview(결과 화면)와 /api/consultation(리드 저장)이
 * **동일한 엄격 필터**로 월 예상 납입금을 산출하도록 한 곳에 모은다.
 *
 * pricing 테이블은 만원/원 단위가 섞이고 상품유형·날짜별 중복 행이 쌓여 있어, 아래 조건을
 * 모두 만족하는 "깨끗한 행"만 신뢰한다(사장님 결정 2026-06-10):
 *   - source = 'auto'        (자동생성 최신 파이프라인)
 *   - product_type = 'rent'  (장기렌트 기준)
 *   - 단위 자동 판정       (min_monthly < 3000 → 만원 / 이상 → 원으로 보고 ÷10000)
 *   - 최신 price_date
 * 조건을 만족하는 행이 없으면 null(→ 결과화면 '상담 안내', 리드 estimate는 null).
 *
 * ⚠️ 반환 단위는 **만원**(pricing 원본 값 그대로). 호출부 용도별 단위 변환:
 *   - 결과 화면 표시: 만원 그대로 사용
 *   - consultations 저장/이메일/텔레그램/result: '원' 단위를 기대(value/10000) → 만원 × 10000 변환 필요
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { normalizeModelName } from '@/lib/normalizeModel';

// 단위 자동 판정 임계값: min_monthly 가 이 값 미만이면 '만원', 이상이면 '원'으로 보고 ÷10000.
// (전환기: 구 만원 스냅샷·신 원 스냅샷이 공존해도 양쪽 모두 정상 처리)
const MANWON_THRESHOLD = 3000;

/** pricing 원본값을 만원 단위로 정규화 (원 단위면 ÷10000) */
function toManwon(v: number): number {
  return v < MANWON_THRESHOLD ? v : v / 10000;
}

function parseConditions(raw: unknown): Record<string, unknown> {
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
}

export interface RentEstimate {
  /** 만원 단위 */
  min: number;
  /** 만원 단위 */
  max: number;
}

/**
 * 장기렌트 월 예상 납입금(만원 단위)을 반환. 깨끗한 행이 없으면 null.
 * 차종·기간·주행 중 하나라도 비면 null.
 */
export async function getRentEstimateManwon(
  supabase: SupabaseClient,
  params: {
    brand?: string | null;
    model?: string | null;
    contractMonths?: number | null;
    annualKm?: number | null;
  },
): Promise<RentEstimate | null> {
  const { brand, model, contractMonths, annualKm } = params;
  if (!brand || !model || !contractMonths || !annualKm) return null;

  const carModel = normalizeModelName(model);

  const { data, error } = await supabase
    .from('pricing')
    .select('min_monthly, max_monthly, price_date, conditions')
    .eq('car_brand', brand)
    .eq('car_model', carModel)
    .eq('contract_months', contractMonths)
    .eq('annual_km', annualKm)
    .eq('is_active', true);

  if (error || !data) return null;

  const clean = data.filter((r) => {
    const c = parseConditions(r.conditions);
    return (
      c.source === 'auto' &&
      c.product_type === 'rent' &&
      typeof r.min_monthly === 'number' &&
      r.min_monthly > 0 &&
      typeof r.max_monthly === 'number' &&
      r.max_monthly > 0
    );
  });

  if (clean.length === 0) return null;

  clean.sort((a, b) => String(b.price_date).localeCompare(String(a.price_date)));
  const latest = clean[0];
  return { min: toManwon(latest.min_monthly as number), max: toManwon(latest.max_monthly as number) };
}
