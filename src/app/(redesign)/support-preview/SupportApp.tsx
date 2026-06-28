'use client';

// 고객센터·FAQ 리뉴얼 미리보기 (목업 데이터, 시각 전용)
// 원본: _design_ref/support-app.jsx + _design_ref/rt-support.css
// 적응 메모:
//  - 프로토타입 전용(TweaksPanel / RtControlBar / 디바이스 토글 / personalize)은 제외.
//  - 디바이스 프레임(.rt-viewport)은 .rt-root 풀스크린 오버레이로 대체(support.css).
//  - window.RtConsultSheet / window.CadamDS.Button → 실제 import.
import React, { useState } from 'react';
import { RtTopNav } from '@/components/rentailor/RtChrome';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import { Button } from '@/components/ui/Button';
import './support.css';

// ── 타입 ─────────────────────────────────────────────
type CatKey = 'all' | 'quote' | 'cost' | 'insure' | 'end' | 'etc';
type FaqCatKey = Exclude<CatKey, 'all'>;
type ChanIcon = 'phone' | 'kakao' | 'book' | 'mail';

interface SpCat {
  key: CatKey;
  label: string;
}
interface SpFaq {
  c: FaqCatKey;
  q: string;
  a: string;
}
interface SpChannel {
  ic: ChanIcon;
  bg: string;
  n: string;
  s: string;
  href?: string;
}

// ── 데이터 ───────────────────────────────────────────
const SP_CATS: SpCat[] = [
  { key: 'all', label: '전체' },
  { key: 'quote', label: '견적·계약' },
  { key: 'cost', label: '비용·결제' },
  { key: 'insure', label: '보험·사고' },
  { key: 'end', label: '해지·반납' },
  { key: 'etc', label: '기타' },
];
const SP_CAT_LABEL: Record<FaqCatKey, string> = {
  quote: '견적·계약',
  cost: '비용·결제',
  insure: '보험·사고',
  end: '해지·반납',
  etc: '기타',
};

const SP_FAQS: SpFaq[] = [
  { c: 'quote', q: '견적은 어떻게 받나요?', a: '원하는 차종과 조건을 남기시면 전담 매니저가 제휴 캐피탈 9곳을 비교해 가장 낮은 조건의 맞춤 견적을 무료로 안내해 드립니다. 상담부터 계약까지 모두 비대면으로 진행됩니다.' },
  { c: 'quote', q: '계약까지 얼마나 걸리나요?', a: '보통 상담 후 3~5영업일 이내에 차량 출고가 가능합니다. 인기 차종이나 옵션에 따라 기간이 달라질 수 있어 상담 시 정확한 일정을 안내해 드립니다.' },
  { c: 'quote', q: '비대면으로 계약이 가능한가요?', a: '네. 서류 제출부터 전자 계약까지 모두 카카오톡과 모바일로 진행됩니다. 방문 없이 집에서 계약을 완료하실 수 있습니다.' },
  { c: 'cost', q: '보험료도 매달 렌트료에 포함되나요?', a: '네. 자동차 보험, 자동차세, 정기 점검까지 모두 월 렌트료 하나에 포함됩니다. 별도로 납부하실 비용은 없습니다.' },
  { c: 'cost', q: '초기 비용이 정말 0원인가요?', a: '무보증·무선납 상품의 경우 초기 비용 없이 시작하실 수 있습니다. 보증금이나 선납금을 넣으면 월 납부액을 더 낮출 수도 있어, 조건은 상담 시 함께 설계해 드립니다.' },
  { c: 'cost', q: '법인은 비용 처리가 되나요?', a: '장기렌트는 렌트료 전액을 비용으로 처리할 수 있어 법인·개인사업자에게 유리합니다. 세부 처리 방식은 상담 시 안내해 드립니다.' },
  { c: 'insure', q: '사고가 나면 어떻게 처리하나요?', a: '전담 매니저가 접수부터 수리, 대차까지 안내해 드립니다. 보험이 기본 포함되어 있어 자기부담금 외 추가 비용이 발생하지 않습니다.' },
  { c: 'insure', q: '운전자 추가가 가능한가요?', a: '가능합니다. 가족이나 직원 등 추가 운전자를 등록할 수 있으며, 연령·경력에 따라 보험료가 달라질 수 있습니다.' },
  { c: 'end', q: '계약 중도 해지가 가능한가요?', a: '가능합니다. 약정 기간과 잔여 개월에 따라 위약금이 산정되며, 상담 시 정확한 조건을 미리 안내해 드립니다.' },
  { c: 'end', q: '만기가 되면 차는 어떻게 하나요?', a: '만기 시 차량을 반납하거나, 인수(구매)하거나, 새 차로 교체할 수 있습니다. 만기 2개월 전 전담 매니저가 옵션을 안내해 드립니다.' },
  { c: 'etc', q: '신용등급이 낮아도 신청할 수 있나요?', a: '신용 조건에 따라 가능한 상품을 별도로 안내해 드립니다. 우선 맞춤 상담으로 가능 여부를 확인해 보세요.' },
  { c: 'etc', q: '주행거리 제한이 있나요?', a: '약정 주행거리는 연 1~3만km 중에서 선택하실 수 있습니다. 초과 시 정산 기준은 계약 전 명확히 안내해 드립니다.' },
];

const SP_CHANNELS: SpChannel[] = [
  { ic: 'phone', bg: '#1F8A5B', n: '전화 상담', s: '1666-7000', href: 'tel:16667000' },
  { ic: 'kakao', bg: '#3B1E1E', n: '카톡 상담', s: '24시간 접수' },
  { ic: 'book', bg: '#2A6FDB', n: '상담 신청', s: '전담 매니저 배정' },
  { ic: 'mail', bg: '#7A4FC0', n: '이메일', s: 'help@rentailor.co.kr', href: 'mailto:help@rentailor.co.kr' },
];

// ── 채널 아이콘 ──────────────────────────────────────
function SpChanIc({ name }: { name: ChanIcon }) {
  const P: Record<ChanIcon, React.ReactNode> = {
    phone: <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />,
    kakao: <path d="M4 4.5h16a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-4 3.5V17H4a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 4 4.5z" />,
    book: (
      <>
        <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
        <path d="M3 9h18M8 2.5v4M16 2.5v4" />
      </>
    ),
    mail: (
      <>
        <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
        <path d="M3 6.5l9 6 9-6" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {P[name]}
    </svg>
  );
}

// ── FAQ 아코디언 항목 ────────────────────────────────
function SpFaqItem({ f }: { f: SpFaq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={'rt-sp-faq' + (open ? ' is-open' : '')}>
      <button className="rt-sp-faq-q" onClick={() => setOpen(!open)}>
        <span className="rt-sp-faq-cat">{SP_CAT_LABEL[f.c]}</span>
        <span className="rt-sp-faq-qt">{f.q}</span>
        <svg className="rt-sp-faq-chev" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      <div className="rt-sp-faq-a">
        <p>{f.a}</p>
      </div>
    </div>
  );
}

// ── 페이지 ───────────────────────────────────────────
const ACCENT = '#C9A84C';

export default function SupportApp() {
  const [cat, setCat] = useState<CatKey>('all');
  const [query, setQuery] = useState('');
  const [sheet, setSheet] = useState(false);

  const list = SP_FAQS.filter(
    (f) => (cat === 'all' || f.c === cat) && (!query || (f.q + f.a).toLowerCase().includes(query.toLowerCase())),
  );

  return (
    <div className="rt-root" style={{ ['--rt-accent' as string]: ACCENT }}>
      <div className="rt-page" data-page="support">
        <RtTopNav title="고객센터" />

        <div className="rt-sp-hero">
          <h1 className="rt-sp-hero-t">무엇을 도와드릴까요?</h1>
          <p className="rt-sp-hero-d">궁금한 점을 검색하거나 자주 묻는 질문에서 찾아보세요.</p>
          <div className="rt-sp-search">
            <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
            <input type="text" placeholder="예: 보험, 중도 해지, 법인" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

        <div className="rt-sp-chan">
          {SP_CHANNELS.map((c) => {
            const inner = (
              <>
                <span className="rt-sp-chan-ic" style={{ background: c.bg }}>
                  <SpChanIc name={c.ic} />
                </span>
                <span>
                  <span className="rt-sp-chan-n" style={{ display: 'block' }}>
                    {c.n}
                  </span>
                  <span className="rt-sp-chan-s">{c.s}</span>
                </span>
              </>
            );
            return c.href ? (
              <a key={c.n} className="rt-sp-chan-card" href={c.href}>
                {inner}
              </a>
            ) : (
              <button
                key={c.n}
                type="button"
                className="rt-sp-chan-card"
                onClick={() => setSheet(true)}
                style={{ font: 'inherit', textAlign: 'left', cursor: 'pointer', border: 0 }}
              >
                {inner}
              </button>
            );
          })}
        </div>

        <div className="rt-sp-hours">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          <div>
            <b>상담 운영시간 · 평일 09:00–19:00</b>
            <span>주말·공휴일 휴무 · 카톡 문의는 24시간 접수</span>
          </div>
        </div>

        <div className="rt-sp-cats">
          {SP_CATS.map((c) => (
            <button key={c.key} className={'rt-sp-cat' + (cat === c.key ? ' is-on' : '')} onClick={() => setCat(c.key)}>
              {c.label}
            </button>
          ))}
        </div>

        <div className="rt-sp-faqs">
          {list.length ? (
            list.map((f) => <SpFaqItem key={f.q} f={f} />)
          ) : (
            <p className="rt-sp-empty">
              검색 결과가 없어요.
              <br />
              다른 키워드로 찾아보거나 1:1 상담을 신청해 주세요.
            </p>
          )}
        </div>

        <div className="rt-bar">
          <div className="rt-bar-inner">
            <div className="rt-bar-row">
              <a className="rt-bar-call" href="tel:16667000">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                전화
              </a>
              <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={() => setSheet(true)}>
                1:1 비대면 상담 신청
              </Button>
            </div>
          </div>
        </div>
      </div>

      <RtConsultSheet open={sheet} onClose={() => setSheet(false)} car={null} priceLabel="고객센터 상담" accent={ACCENT} />
    </div>
  );
}
