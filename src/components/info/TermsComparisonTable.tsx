'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

// ─── 타입 ─────────────────────────────────────────────────────────

interface CompanyRow {
  company: string;
  values: string[];
}

interface TabData {
  columns: string[];
  rows: CompanyRow[];
}

// ─── 데이터 ───────────────────────────────────────────────────────

const RENTAL_DATA: TabData = {
  columns: [
    '중도해지\n위약금율',
    '규정손해배상금\n(조기매입)',
    '초과운행\n부담금',
    '만기 처리 조건',
    '승계수수료',
    '지연배상금률',
    '반환차량\n상태 기준',
  ],
  rows: [
    {
      company: 'KB캐피탈',
      values: [
        '수수료율\n계약서 기재',
        '미회수원금\n×(1+0~5%)',
        '국산 200원/km\n수입 300원/km\n(유예 3,000km)',
        '반납 / 인수',
        '미기재',
        '연 12%',
        '훼손부위\n원상회복',
      ],
    },
    {
      company: '신한카드',
      values: [
        '수수료율\n계약서 기재',
        '미기재',
        '국산 200원/km\n수입 300원/km',
        '반납 / 재렌탈',
        '계약서 기재',
        '미기재',
        '훼손부위\n원상회복',
      ],
    },
    {
      company: '하나캐피탈',
      values: [
        '2년 이하 35%\n3년 이하 30%\n4년 이하 25%\n4년 초과 20%',
        '미기재',
        '국산 100원/km\n수입 300원/km\n(유예 1,000km)',
        '반납 / 구매 / 연장',
        '30만원\n(VAT 별도)',
        '연 12%',
        '정상마모 기준\n감가료 고객부담',
      ],
    },
    {
      company: '현대캐피탈',
      values: [
        '미회수원금\n×9~40%',
        '미회수원금×5%\n(만기 3개월 전부터 0%)',
        '80~200원/km\n(차종별 상이)',
        '미기재',
        '승계금액×1%',
        '연 20%',
        '미기재',
      ],
    },
    {
      company: '아마존렌터카',
      values: [
        '미기재',
        '미기재',
        '미기재',
        '미기재',
        '계약서 명시금액',
        '미기재',
        '미기재',
      ],
    },
  ],
};

const LEASE_DATA: TabData = {
  columns: [
    '중도해지\n손해배상금률',
    '규정손해\n배상금률',
    '초과운행\n부담금',
    '반환지연금',
    '승계수수료',
    '지연배상금률',
  ],
  rows: [
    {
      company: 'KB캐피탈',
      values: [
        '최고 65%\n×(잔여월/전체월)',
        '계약서 기재',
        '계약서 기재',
        '일리스료×(1+반환지연율)\n×경과일',
        '미회수원금\n×승계수수료율',
        '계약서 기재',
      ],
    },
    {
      company: '신한카드\n(표준)',
      values: [
        '계약서 기재',
        '미회수원금\n×규정손해배상금률',
        '계약서 기재',
        '일리스료×(1+지연율)\n×경과일',
        '미회수원금\n×승계수수료율',
        '계약서 기재',
      ],
    },
    {
      company: '신한카드\n(개별)',
      values: [
        '계약서 기재',
        '미회수원금\n×규정손해배상금률',
        '초과km × 300원',
        '미기재',
        '미기재',
        '미기재',
      ],
    },
    {
      company: '롯데오토리스',
      values: [
        '65%\n×(잔여월/전체월)',
        '미회수원금×22%\n×(잔여일/총계약일)',
        '미기재',
        '일리스료×201%\n×경과일',
        '미회수원금×2%\n×(잔여일/총계약일)\n최저 25만 · 최대 100만',
        '연 20%',
      ],
    },
    {
      company: '우리카드',
      values: [
        '70%\n×(잔여일/전체일)',
        '금융 5% · 운용 19%\n×(잔여일/전체일)',
        '미기재',
        '일리스료×201%\n×경과일',
        '미회수원금×2%\n×(잔여일/전체일)\n최소 30만 · 최대 100만',
        '연 20%',
      ],
    },
    {
      company: '롯데캐피탈',
      values: [
        '65%\n×(잔여월/전체월)',
        '운용 9.9%\n×(잔여월/전체월)',
        '미기재',
        '일리스료×201%\n×경과일',
        '미회수원금×1.5%\n×(잔여월/전체월)\n최소 30만 · 최대 150만',
        '연 20%',
      ],
    },
    {
      company: 'MG캐피탈',
      values: [
        '최고 10%\n×(잔여월/전체월)',
        '미회수원금×최고10%\n×(잔여월/전체월)',
        '미기재',
        '일리스료×(1+반환지연율)\n×경과일',
        '미회수원금×최고2%\n×(잔여월/전체월)',
        '약정이자율+최대연3%\n(20% 이내)',
      ],
    },
  ],
};

// ─── 셀 스타일 판별 ──────────────────────────────────────────────

function getCellClass(value: string): string {
  const isMuted =
    !value ||
    value === '미기재' ||
    value.includes('계약서 기재') ||
    value.includes('미기재');

  if (isMuted) {
    return 'text-[11px] text-text-muted italic leading-relaxed';
  }
  // 명확한 수치 포함 → 강조
  if (/\d+[%원만]/.test(value) || /연\s*\d+/.test(value) || /^\d/.test(value)) {
    return 'text-[11px] text-primary font-semibold leading-relaxed';
  }
  return 'text-[11px] text-text-sub leading-relaxed';
}

// ─── 공통 탭 헤더 ────────────────────────────────────────────────

function InfoTabNav() {
  const pathname = usePathname();
  const tabs = [
    { href: '/info', label: '이용정보' },
    { href: '/info/terms-comparison', label: '약관 비교' },
  ];
  return (
    <div className="shrink-0 border-b border-border-solid bg-white">
      <div className="flex max-w-lg mx-auto px-5">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={[
              'px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors whitespace-nowrap',
              pathname === t.href
                ? 'border-primary text-primary'
                : 'border-transparent text-text-sub hover:text-primary',
            ].join(' ')}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── 비교 테이블 ─────────────────────────────────────────────────

function CompareTable({ data }: { data: TabData }) {
  const colCount = data.columns.length + 1; // +1 for company col
  return (
    <div className="rounded-2xl border border-border-solid overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse"
          style={{ minWidth: `${colCount * 96}px` }}
        >
          <thead>
            <tr>
              <th className="bg-primary text-white text-[11px] font-semibold px-3 py-3 text-left sticky left-0 z-10 whitespace-nowrap min-w-[76px]">
                회사
              </th>
              {data.columns.map((col, i) => (
                <th
                  key={i}
                  className="bg-primary text-white text-[11px] font-semibold px-3 py-3 text-center whitespace-pre-line min-w-[88px]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIdx) => {
              const rowBg = rowIdx % 2 === 0 ? 'bg-white' : 'bg-surface-secondary';
              return (
                <tr key={row.company} className={rowBg}>
                  <td
                    className={`px-3 py-3 sticky left-0 z-10 border-r border-border-solid font-semibold text-[12px] text-primary whitespace-pre-line align-top ${rowBg}`}
                  >
                    {row.company}
                  </td>
                  {row.values.map((val, colIdx) => (
                    <td
                      key={colIdx}
                      className="px-3 py-3 border-b border-border-solid text-center align-top"
                    >
                      <span className={getCellClass(val)}>
                        {val.split('\n').map((line, li) => (
                          <span key={li}>
                            {line}
                            {li < val.split('\n').length - 1 && <br />}
                          </span>
                        ))}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────

export function TermsComparisonTable() {
  const [activeTab, setActiveTab] = useState<'rental' | 'lease'>('rental');
  const data = activeTab === 'rental' ? RENTAL_DATA : LEASE_DATA;

  return (
    <div className="min-h-[100dvh] flex flex-col bg-white pb-24">
      {/* 이용정보 ↔ 약관 비교 탭 */}
      <InfoTabNav />

      {/* 스크롤 영역 */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 pt-5 pb-8">

          {/* 타이틀 + 도입 문구 */}
          <div className="mb-5">
            <h1 className="text-lg font-bold text-primary mb-1.5">
              장기렌터카 · 운용리스 약관 비교
            </h1>
            <p className="text-sm text-text-sub leading-relaxed">
              약관은 읽기 어렵게 쓰여 있습니다.<br />
              중요한 조항만 뽑아 회사별로 정리했습니다.
            </p>
          </div>

          {/* 렌터카 / 리스 탭 */}
          <div className="flex gap-2 mb-4">
            {(
              [
                { value: 'rental', label: '장기렌터카' },
                { value: 'lease', label: '운용리스' },
              ] as const
            ).map((t) => (
              <button
                key={t.value}
                onClick={() => setActiveTab(t.value)}
                className={[
                  'px-4 py-2 rounded-full text-sm font-semibold border transition-all',
                  activeTab === t.value
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-text-sub border-border-solid hover:border-primary hover:text-primary',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* 비교 테이블 */}
          <CompareTable data={data} />

          {/* 면책 문구 */}
          <p className="text-[11px] text-text-muted mt-4 text-center leading-relaxed">
            본 비교표는 각사 공개 약관 기준이며, 실제 계약 조건은 상이할 수 있습니다.
          </p>
        </div>
      </div>
    </div>
  );
}
