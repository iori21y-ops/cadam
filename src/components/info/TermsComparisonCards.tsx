'use client';

import { useRef, useState } from 'react';
import { CarouselNavButtons } from '@/components/info/CarouselNavButtons';

// ─── 타입 ─────────────────────────────────────────────────────────

interface CompanyRow {
  company: string;
  values: string[];
}

interface TabData {
  columns: string[];
  rows: CompanyRow[];
}

// ─── 데이터 (TermsComparisonTable.tsx와 동일) ─────────────────────

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

  if (isMuted) return 'text-[11px] text-text-muted italic leading-relaxed';
  if (/\d+[%원만]/.test(value) || /연\s*\d+/.test(value) || /^\d/.test(value)) {
    return 'text-[11px] text-primary font-semibold leading-relaxed';
  }
  return 'text-[11px] text-text-sub leading-relaxed';
}

function renderLines(text: string) {
  return text.split('\n').map((line, i, arr) => (
    <span key={i}>
      {line}
      {i < arr.length - 1 && <br />}
    </span>
  ));
}

// ─── 조건항목별 카드 ─────────────────────────────────────────────

function TermCard({ column, rows, colIdx }: { column: string; rows: CompanyRow[]; colIdx: number }) {
  return (
    <div className="snap-start shrink-0 w-[min(90vw,632px)] bg-white rounded-2xl border border-border-solid shadow-md overflow-hidden">
      {/* 카드 헤더 */}
      <div className="bg-primary px-4 py-3">
        <p className="text-white text-sm font-semibold whitespace-pre-line leading-snug">{column}</p>
      </div>

      {/* 회사별 리스트 */}
      <div>
        {rows.map((row, i) => {
          const value = row.values[colIdx] ?? '';
          return (
            <div
              key={i}
              className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 last:border-b-0"
            >
              <span className="flex-shrink-0 w-24 md:w-32 text-[11px] font-semibold text-primary whitespace-pre-line leading-snug pt-0.5">
                {row.company}
              </span>
              <span className={`flex-1 ${getCellClass(value)}`}>
                {renderLines(value || '미기재')}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── 카드 캐러셀 ─────────────────────────────────────────────────

function TermsCarousel({ data }: { data: TabData }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = Math.min(window.innerWidth * 0.9, 632);
    const clamped = Math.max(0, Math.min(Math.round(el.scrollLeft / (cardWidth + 12)), data.columns.length - 1));
    setActiveIdx(clamped);
  };

  const goTo = (index: number) => {
    const el = scrollRef.current;
    if (!el) return;
    const card = el.children[index] as HTMLElement | undefined;
    if (!card) return;
    el.scrollTo({ left: card.offsetLeft - 20, behavior: 'smooth' });
    setActiveIdx(index);
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      <div className="relative">
        {data.columns.length > 1 && (
          <CarouselNavButtons
            onPrev={() => goTo(activeIdx - 1)}
            onNext={() => goTo(activeIdx + 1)}
            canPrev={activeIdx > 0}
            canNext={activeIdx < data.columns.length - 1}
          />
        )}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-3 overflow-x-auto snap-x snap-mandatory px-5 scroll-pl-5 pt-3 pb-6 scrollbar-hide"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {data.columns.map((col, colIdx) => (
            <TermCard key={colIdx} column={col} rows={data.rows} colIdx={colIdx} />
          ))}
          <div className="shrink-0 w-1" />
        </div>

        {/* 도트 인디케이터 */}
        <div className="flex justify-center gap-1.5 pb-4">
          {data.columns.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`${i + 1}번째 항목`}
              className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeIdx ? 'bg-primary w-4' : 'bg-gray-300'}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────

export function TermsComparisonCards() {
  const [activeTab, setActiveTab] = useState<'rental' | 'lease'>('rental');
  const data = activeTab === 'rental' ? RENTAL_DATA : LEASE_DATA;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 pt-5 pb-2">
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
        </div>

        {/* 카드 캐러셀 */}
        <TermsCarousel data={data} />

        {/* 면책 문구 */}
        <p className="text-[11px] text-text-muted mt-2 pb-8 text-center leading-relaxed px-4">
          본 비교표는 각사 공개 약관 기준이며, 실제 계약 조건은 상이할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
