import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import { VEHICLE_LIST, getVehicleBySlug } from '@/constants/vehicles';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { calcMonthly } from '@/lib/calc-monthly';

export const revalidate = 3600; // 1시간 캐시

// ── 정적 파라미터 ─────────────────────────────────────────────────────────────

export async function generateStaticParams() {
  return VEHICLE_LIST.map((v) => ({ slug: v.slug }));
}

// ── 메타데이터 ────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);
  if (!vehicle) return { title: '차량을 찾을 수 없습니다' };

  const title       = `${vehicle.model} 5년 총비용 & 장기렌트 진단 | 렌테일러`;
  const description = `${vehicle.brand} ${vehicle.model} 실제 보유 비용을 계산해 보세요. 감가상각·세금·보험·유류비 포함 5년 총비용과 장기렌트 전환 시 절감 효과를 무료로 진단합니다.`;
  return {
    title,
    description,
    openGraph: { title, description },
    alternates: { canonical: `/diagnosis/models/${slug}` },
  };
}

// ── 타입 ──────────────────────────────────────────────────────────────────────

interface TrimRow {
  trim_name:   string;
  msrp_price:  number;
  fuel_type:   string;
  model_year:  number;
}

// ── 유틸 ──────────────────────────────────────────────────────────────────────

function fmtMk(n: number) {
  return `${Math.round(n).toLocaleString()}만원`;
}

function fuelLabel(f: string) {
  const MAP: Record<string, string> = {
    gasoline: '가솔린', diesel: '디젤', hybrid: '하이브리드', ev: '전기', lpg: 'LPG',
  };
  return MAP[f] ?? f;
}

// 1년차 잔존가치율 추정 (연료별 정률)
const RETENTION_1YR: Record<string, number> = {
  gasoline: 0.82, diesel: 0.80, hybrid: 0.84, ev: 0.78, lpg: 0.76,
};

// ── 페이지 ────────────────────────────────────────────────────────────────────

export default async function DiagnosisModelPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);
  if (!vehicle) notFound();

  // vehicle_msrp에서 최신 연식 트림 조회
  const supabase = createServiceRoleSupabaseClient();
  const { data: trims } = await supabase
    .from('vehicle_msrp')
    .select('trim_name, msrp_price, fuel_type, model_year')
    .eq('brand', vehicle.brand)
    .eq('model', vehicle.model)
    .order('model_year', { ascending: false })
    .order('msrp_price', { ascending: true })
    .limit(20);

  const trimList: TrimRow[] = (trims ?? []) as TrimRow[];

  // 대표 트림: 최신 연식 중간 트림
  const latestYear = trimList[0]?.model_year ?? 2025;
  const latestTrims = trimList.filter((t) => t.model_year === latestYear);
  const midTrim     = latestTrims[Math.floor(latestTrims.length / 2)] ?? latestTrims[0];

  const msrpMin = latestTrims.at(0)?.msrp_price ?? 0;
  const msrpMax = latestTrims.at(-1)?.msrp_price ?? 0;

  // 예상 렌탈료 (대표 트림 기준, 60개월)
  const monthlyRent = midTrim ? Math.round(calcMonthly(midTrim.msrp_price, 'rent', 60, 0, 20000)) : 0;

  // 1년 감가 손실 (대표 트림)
  const retentionRate = RETENTION_1YR[midTrim?.fuel_type ?? 'gasoline'] ?? 0.82;
  const depreciation1yr = midTrim ? Math.round(midTrim.msrp_price * (1 - retentionRate)) : 0;

  // 5년 TCO 구성 (간략 추정)
  const tco5yrRent = monthlyRent * 60;

  const hasTrimData = latestTrims.length > 0;

  return (
    <div className="min-h-screen bg-[#F2F2F7]">
      {/* 헤더 */}
      <div className="bg-white border-b border-[#E5E7EB] sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-5 py-4 flex items-center gap-3">
          <Link href="/diagnosis/report" className="text-[#007AFF] text-[13px]">
            ← 직접 진단
          </Link>
          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] font-bold text-[#1C1C1E] truncate">
              {vehicle.brand} {vehicle.model}
            </h1>
            <p className="text-[11px] text-[#8E8E93]">5년 총비용 & 장기렌트 비교</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-4">

        {/* 차량 요약 배지 */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#F2F2F7] p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1">
              <p className="text-[11px] text-[#8E8E93] mb-0.5">{vehicle.segment} · {vehicle.fuel}</p>
              <p className="text-[20px] font-bold text-[#1C1C1E]">
                {vehicle.brand} {vehicle.model}
              </p>
            </div>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#007AFF18] text-[#007AFF]">
              {latestYear}년식
            </span>
          </div>

          {hasTrimData ? (
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: '신차가 범위', value: msrpMin === msrpMax ? fmtMk(msrpMin) : `${fmtMk(msrpMin)} ~ ${fmtMk(msrpMax)}` },
                { label: '트림 수', value: `${latestTrims.length}개 트림` },
                { label: '예상 월 렌탈료', value: `${fmtMk(monthlyRent)}~`, sub: '60개월 기준' },
                { label: '1년 예상 감가', value: fmtMk(depreciation1yr), sub: `대표 트림 기준` },
              ].map((item) => (
                <div key={item.label} className="bg-[#F2F2F7] rounded-xl px-3 py-2.5">
                  <p className="text-[10px] text-[#8E8E93] mb-0.5">{item.label}</p>
                  <p className="text-[14px] font-bold text-[#1C1C1E]">{item.value}</p>
                  {item.sub && <p className="text-[10px] text-[#8E8E93]">{item.sub}</p>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[#8E8E93] text-center py-4">가격 데이터를 불러오는 중입니다.</p>
          )}
        </div>

        {/* 트림별 가격표 */}
        {hasTrimData && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#F2F2F7] p-5">
            <p className="text-[13px] font-bold text-[#1C1C1E] mb-3">
              {latestYear}년식 트림별 신차가
            </p>
            <div className="space-y-2">
              {latestTrims.map((t) => {
                const rentMo = Math.round(calcMonthly(t.msrp_price, 'rent', 60, 0, 20000));
                return (
                  <div
                    key={t.trim_name}
                    className="flex items-center justify-between py-2.5 border-b border-[#F2F2F7] last:border-0"
                  >
                    <div>
                      <p className="text-[13px] font-medium text-[#1C1C1E]">{t.trim_name}</p>
                      <p className="text-[10px] text-[#8E8E93]">{fuelLabel(t.fuel_type)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[13px] font-bold text-[#1C1C1E]">{fmtMk(t.msrp_price)}</p>
                      <p className="text-[10px] text-[#8E8E93]">렌트 ≈ {fmtMk(rentMo)}/월</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 5년 총비용 요약 */}
        {hasTrimData && midTrim && (
          <div className="bg-white rounded-2xl shadow-sm border border-[#F2F2F7] p-5">
            <p className="text-[13px] font-bold text-[#1C1C1E] mb-1">
              5년 장기렌트 예상 총비용
            </p>
            <p className="text-[11px] text-[#8E8E93] mb-3">
              {midTrim.trim_name} 기준 · 60개월 · 연 2만km · 선납금 없음
            </p>
            <div className="flex items-end justify-between px-4 py-3.5 bg-[#007AFF0D] rounded-xl">
              <div>
                <p className="text-[11px] text-[#8E8E93]">월 납입금</p>
                <p className="text-[22px] font-bold text-[#007AFF]">{fmtMk(monthlyRent)}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-[#8E8E93]">5년 납입 합계</p>
                <p className="text-[16px] font-bold text-[#1C1C1E]">{fmtMk(tco5yrRent)}</p>
              </div>
            </div>
            <p className="text-[10px] text-[#8E8E93] mt-2">
              ※ 취득세·자동차세·보험료 포함 (장기렌트 특성). 실제 견적은 캐피탈사 조건에 따라 다름.
            </p>
          </div>
        )}

        {/* CTA */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#F2F2F7] p-5 text-center">
          <p className="text-[14px] font-bold text-[#1C1C1E] mb-1">
            내 {vehicle.model}의 정확한 진단이 필요하다면?
          </p>
          <p className="text-[12px] text-[#8E8E93] mb-4">
            연식·트림·주행거리를 입력하면 개인화된 감가상각 & 총비용 리포트를 바로 확인할 수 있습니다.
          </p>
          <Link
            href={`/diagnosis/report`}
            className="block w-full py-3.5 bg-[#007AFF] text-white text-[14px] font-bold rounded-2xl text-center hover:bg-[#0066CC] transition-colors"
          >
            무료 진단 시작하기
          </Link>
        </div>

        {/* 관련 차량 링크 */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#F2F2F7] p-5">
          <p className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-wide mb-3">
            같은 브랜드 다른 모델
          </p>
          <div className="grid grid-cols-2 gap-2">
            {VEHICLE_LIST
              .filter((v) => v.brand === vehicle.brand && v.slug !== slug)
              .slice(0, 6)
              .map((v) => (
                <Link
                  key={v.slug}
                  href={`/diagnosis/models/${v.slug}`}
                  className="text-[12px] text-[#007AFF] font-medium py-2 px-3 bg-[#F2F2F7] rounded-xl hover:bg-[#E5E7EB] transition-colors truncate"
                >
                  {v.model}
                </Link>
              ))}
          </div>
        </div>

        <p className="text-[10px] text-[#8E8E93] text-center px-2 pb-4">
          ※ 본 페이지의 가격·비용 정보는 참고용 추정치이며, 실제 계약 조건에 따라 달라질 수 있습니다.
        </p>

      </div>
    </div>
  );
}
