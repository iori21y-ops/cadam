'use client';

// 결제방식 비교 — 리뉴얼 미리보기 (타깃 /diagnosis/compare)
// 원본: _design_ref/paycompare-app.jsx(총비용) + _design_ref/compare-app.jsx(조건·약관) + rt-compare.css
//   3탭(총비용·조건·약관)을 한 페이지 내 탭 상태로 전환. window 전역 → import, 데이터/계산은 data.ts.
//   디바이스 토글·TweaksPanel·personalize 제외, image-slot 미사용(이 비교 화면들엔 차량 이미지 없음).
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RtTopNav } from '@/components/rentailor/RtChrome';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import { CompareTotalCost } from './CompareTotalCost';
import { CompareConditions } from './CompareConditions';
import { CompareTerms } from './CompareTerms';
import type { PayKey } from './data';
import './compare.css';

const ACCENT = '#C9A84C';
const cssVar = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;

type Tab = 'total' | 'cond' | 'terms';
const TABS: { key: Tab; label: string }[] = [
  { key: 'total', label: '총비용' },
  { key: 'cond', label: '조건' },
  { key: 'terms', label: '약관' },
];

export default function DiagnosisComparePreview() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<Tab>('total');
  const [product, setProduct] = useState<PayKey>('rent'); // 조건↔약관 선택 상품 공유
  const [sheet, setSheet] = useState(false);

  const switchTab = (t: Tab) => {
    setTab(t);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div data-rt="diagnosis-compare-preview" className="rt-root" style={cssVar({ '--rt-accent': ACCENT, '--rt-radius': '20px' })}>
      <div className="rt-page" data-page="compare">
        <div className="rt-scroll" ref={scrollRef}>
          <RtTopNav title="결제방식 비교" backHref="/diagnosis-preview" />

          <div className="rt-cmp-modes" role="tablist" aria-label="비교 방식">
            {TABS.map((t) => (
              <button key={t.key} className={'rt-cmp-mode' + (tab === t.key ? ' is-on' : '')} onClick={() => switchTab(t.key)} role="tab" aria-selected={tab === t.key}>
                {t.label}
              </button>
            ))}
          </div>

          {tab === 'total' && <CompareTotalCost accent={ACCENT} scrollRef={scrollRef} onConsult={() => setSheet(true)} />}

          {tab !== 'total' && (
            <>
              {tab === 'cond' ? <CompareConditions product={product} setProduct={setProduct} /> : <CompareTerms product={product} setProduct={setProduct} />}

              <div className="rt-bar" style={cssVar({ '--rt-accent': ACCENT })}>
                <div className="rt-bar-inner">
                  <div className="rt-bar-row">
                    <a className="rt-bar-call" href="tel:16667000">
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      전화 상담
                    </a>
                    {/* TODO(§3.4C): consultations 단일 insert 연결점 (name·phone·consent + source=inflow_page +
                        context jsonb: 비교 탭(cond/terms)·선택 상품(product)·약관 필터 등 비교 결과). 현재 비교 렌더만, POST 미연동. */}
                    <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={() => setSheet(true)}>
                      내게 맞는 방법 무료 상담
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      <RtConsultSheet open={sheet} onClose={() => setSheet(false)} car={null} accent={ACCENT} />
    </div>
  );
}
