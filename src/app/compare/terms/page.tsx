import type { Metadata } from 'next';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { TermsCompareClient } from './TermsCompareClient';
import { TERMS_FIELD_CONFIG } from './types';
import type { TermsCompanyRow, TermsFieldCell, TermsFieldKey } from './types';

export const revalidate = 3600; // 약관은 거의 바뀌지 않으므로 1시간 ISR

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.rentailor.co.kr';

export const metadata: Metadata = {
  title: '장기렌터카 중도해지 위약금·초과주행료 비교 | 렌테일러',
  description:
    '롯데·하나·KB·JB우리·오릭스 등 주요 장기렌터카 약관의 중도해지 위약금, 초과주행료, 승계수수료, 면책금, 정비범위를 약관 원문 기준으로 비교합니다.',
  keywords: [
    '장기렌터카 위약금',
    '장기렌터카 중도해지',
    '초과주행료',
    '승계수수료',
    '렌터카 약관 비교',
  ],
  openGraph: {
    title: '장기렌터카 약관 핵심조항 비교 | 렌테일러',
    description:
      '주요 장기렌터카 약관의 중도해지 위약금·초과주행료·승계수수료·면책금·정비범위를 한눈에 비교하세요.',
    url: `${BASE_URL}/compare/terms`,
  },
  alternates: {
    canonical: `${BASE_URL}/compare/terms`,
  },
};

// raw_extraction[field] 의 구조
interface RawField {
  quote: string | null;
  clause: string | null;
  reason: string | null;
  verified: boolean;
}

/**
 * 추출 quote가 표시해도 되는지 판정.
 * PDF 추출 과정에서 일부 quote가 문장 중간에서 잘려(예: "...앞면 표기 ", "...보험사의 ")
 * "약관 원문 기준" 고지와 어긋날 수 있으므로, 잘린 인용은 숨기고 조항(제N조)만 노출한다.
 */
function safeQuote(raw: RawField | undefined): string | null {
  if (!raw || !raw.verified || raw.reason) return null;
  const q = (raw.quote ?? '').trim().replace(/["'“”]+$/, '').trim();
  if (q.length < 10) return null;
  // 문장 중간 절단 신호: 조사/참조어로 끝나면 잘린 것으로 간주
  if (/(의|를|을|은|는|이|가|와|과|및|또는|앞면|표기)$/.test(q)) return null;
  return raw.quote!.trim();
}

async function getRows(): Promise<TermsCompanyRow[]> {
  const supabase = createServiceRoleSupabaseClient();

  // ⚠️ 불변식: 이 서버 컴포넌트에서 terms_* 를 공개 노출할 때는 반드시
  //   terms_type='장기렌터카' (문서) AND is_verified=true (조항) 두 필터를 함께 유지해야 한다.
  //   service_role은 RLS를 우회하므로, 이 두 WHERE가 미검수/타유형 행의 공개 노출을 막는 유일한 방어선이다.
  //   (terms_* 테이블에 FK 제약이 없어 PostgREST 중첩 embed 대신 분리 조회 후 JS 조인을 사용한다.)

  // 1) 장기렌터카 문서만
  const { data: docs, error: docErr } = await supabase
    .from('terms_documents')
    .select('id, terms_name, company_id')
    .eq('terms_type', '장기렌터카');
  if (docErr || !docs?.length) return [];

  const docMap = new Map(docs.map(d => [d.id as number, d]));
  const docIds = docs.map(d => d.id as number);

  // 2) 검수 완료된 핵심조항만 (해당 문서 범위 내)
  const fieldKeys = TERMS_FIELD_CONFIG.map(f => f.key);
  const { data: condsData, error: condErr } = await supabase
    .from('terms_key_conditions')
    .select(
      `document_id, extraction_confidence, raw_extraction,
       ${fieldKeys.join(', ')}`
    )
    .eq('is_verified', true)
    .in('document_id', docIds);
  // 동적 select 문자열이라 Supabase 타입 추론이 안 됨 → 런타임 형태로 캐스팅
  const conds = (condsData ?? []) as unknown as Record<string, unknown>[];
  if (condErr || !conds.length) return [];

  // 3) 회사명 매핑
  const companyIds = [
    ...new Set(docs.map(d => d.company_id as number).filter(Boolean)),
  ];
  const { data: companies } = await supabase
    .from('terms_companies')
    .select('id, company_name, company_type')
    .in('id', companyIds);
  const coMap = new Map((companies ?? []).map(c => [c.id as number, c]));

  const rows: TermsCompanyRow[] = conds.map((r) => {
    const doc = docMap.get(r.document_id as number);
    const co = doc ? coMap.get(doc.company_id as number) : undefined;
    const rawAll = (r.raw_extraction ?? {}) as Record<string, RawField>;

    const fields = {} as Record<TermsFieldKey, TermsFieldCell>;
    for (const key of fieldKeys) {
      const value = (r[key] as string | null) ?? null;
      const raw = rawAll[key];
      fields[key] = {
        value: value && value !== '' ? value : null,
        clause: raw?.clause ?? null,
        quote: value ? safeQuote(raw) : null,
      };
    }

    return {
      company: co?.company_name ?? '미상',
      companyType: co?.company_type ?? '',
      termsName: doc?.terms_name ?? '',
      confidence: Number(r.extraction_confidence ?? 0),
      fields,
    };
  });

  // 신뢰도 높은 순으로 정렬
  rows.sort((a, b) => b.confidence - a.confidence);
  return rows;
}

export default async function CompareTermsPage() {
  const rows = await getRows();

  return (
    <div className="min-h-screen bg-[#F7F8FA] pb-24">
      <div className="px-4 pt-8 max-w-3xl mx-auto">
        <header className="mb-5">
          <h1 className="text-2xl font-extrabold text-text tracking-tight">
            장기렌터카 약관 핵심조항 비교
          </h1>
          <p className="text-sm text-text-sub mt-1">
            중도해지 위약금 · 초과주행료 · 승계수수료를 약관 원문 기준으로 비교
          </p>
        </header>

        {rows.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-border-solid text-center text-sm text-text-sub">
            현재 비교 가능한 약관 데이터를 준비 중입니다.
          </div>
        ) : (
          <TermsCompareClient rows={rows} />
        )}
      </div>
    </div>
  );
}
