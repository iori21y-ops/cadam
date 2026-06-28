'use client';

// 차량 가치 분석 — 운영 라우트 /value
// 원본: _design_ref/value-app.jsx (window 전역 → 모듈 import). 입력 폼 없음 —
//   추천/조회로 넘어온 신차 1대(?id=)를 바로 감가·예상시세 리포트로 분석.
// 이식/적응:
//   - window.RT_DEP_MODEL/rtDepAnalysis/rtResidualAt/newCarCalc → ./data 모듈
//   - window.CadamDS.Button → @/components/ui/Button
//   - TweaksPanel/useRtDevice/RtControlBar/image-slot 제외
//   - 백 링크 '정보 가이드.html' → '/info'
//   - personalize(window.RtTypeOnly) 는 범위 밖 → 사업자 안내를 일반 렌더(항상 노출)로 둠(갭)
import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RtTopNav } from '@/components/rentailor/RtChrome';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import { RtTermDefs } from '@/lib/rentailor/personalize';
import { RT_CATALOG, FUEL, type Car } from '@/lib/rentailor/catalog';
import { newCarCalc, won, type ValueReportData } from './data';
import './value.css';

const ACCENT = '#C9A84C';
const cssVar = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;

function VlCheck() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

interface PayBar {
  name: string;
  value: number;
  best?: boolean;
  tag?: string;
  plain?: boolean;
}
function PayBars({ bars }: { bars: PayBar[] }) {
  const max = Math.max(...bars.map((b) => b.value));
  return (
    <div className="rt-paybars">
      {bars.map((b, i) => (
        <div className={'rt-paybar' + (b.best ? ' best' : '')} key={i}>
          <div className="rt-paybar-top">
            <span className="rt-paybar-name">
              {b.name}
              {b.tag && <span className={'rt-paybar-tag' + (b.plain ? ' plain' : '')}>{b.tag}</span>}
            </span>
            <span className="rt-paybar-val">{won(b.value)}</span>
          </div>
          <div className="rt-paybar-track">
            <div className="rt-paybar-fill" style={{ width: Math.round((b.value / max) * 100) + '%' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════ 통합 리포트 (예상시세 + 감가추이) ════════
function ValueReport({ d, car }: { d: ValueReportData; car: Car }) {
  const dep = d.dep;
  const maxV = d.curve[0].value;
  return (
    <>
      {/* 헤더 — 신차가 + 3년 후 잔존가치·감가 등급 배지 */}
      <div className="rt-dep-hero rt-fade-up" style={cssVar({ '--d': '0ms', marginTop: 18 })}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <p className="rt-dep-hero-k">신차 구매가</p>
            <div className="rt-dep-now">
              <b>{won(d.msrp)}</b>
              <em>3년 후 잔존가치 {dep.retentionPct}% · −{d.depPct3}%</em>
            </div>
          </div>
          <span
            style={{
              flexShrink: 0,
              width: 50,
              height: 50,
              borderRadius: 14,
              background: dep.color,
              color: '#fff',
              fontWeight: 800,
              fontSize: 24,
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 6px 16px ' + dep.color + '55',
            }}
          >
            {dep.grade}
          </span>
        </div>
        <p className="rt-dep-meta">
          {car.segLabel} 동급 평균보다 가치 유지력이
          <b style={{ color: dep.color }}> {dep.betterThanAvg ? '+' : ''}{dep.deltaPts}%p</b>{' '}
          {dep.betterThanAvg ? '높은 편이에요' : '낮은 편이에요'}.
        </p>
      </div>

      {/* 감가 추이 곡선 */}
      <div className="rt-qblock rt-fade-up" style={cssVar({ '--d': '70ms' })}>
        <h3 className="rt-qblock-t">감가 추이</h3>
        <div className="rt-dep-curve">
          {d.curve.map((c, i) => (
            <div className={'rt-dep-col' + (c.y === 0 ? ' now' : '') + (c.y === 3 ? ' best' : '')} key={i}>
              <span className="rt-dep-colv">{won(c.value)}</span>
              <div className="rt-dep-colbar" style={{ height: Math.max(6, Math.round((c.value / maxV) * 118)) + 'px' }}></div>
              <span className="rt-dep-coll">{c.label}</span>
            </div>
          ))}
        </div>
        <p className="rt-fnote" style={{ padding: '12px 0 0' }}>
          ※ 막대 = 각 시점 예상 잔존가치(신차가 대비). 엔카·KB 차차차 시세 통계 기반 추정값이에요.
        </p>
      </div>

      {/* 구매 시 감가 손실 요약 */}
      <div className="rt-qblock rt-fade-up" style={cssVar({ '--d': '140ms' })}>
        <div className="rt-dep-swap">
          <div className="rt-dep-swap-cell">
            <div className="rt-dep-swap-v">{won(d.msrp)}</div>
            <div className="rt-dep-swap-l">신차 구매가</div>
          </div>
          <div className="rt-dep-swap-cell">
            <div className="rt-dep-swap-v">{won(d.v3)}</div>
            <div className="rt-dep-swap-l">3년 후 예상</div>
          </div>
          <div className="rt-dep-swap-cell">
            <div className="rt-dep-swap-v gold">−{won(d.drop3)}</div>
            <div className="rt-dep-swap-l">3년 감가 손실</div>
          </div>
        </div>
      </div>

      {/* 3년 뒤 매각 채널 */}
      <div className="rt-qblock rt-fade-up" style={cssVar({ '--d': '210ms' })}>
        <h3 className="rt-qblock-t">3년 뒤, 어디에 파는 게 유리할까요?</h3>
        <PayBars
          bars={[
            { name: '개인거래 직거래', value: d.market3, tag: '시세 최고', plain: true },
            { name: '일반 딜러 매입', value: d.dealer3 },
            { name: 'Rentailor 전환 인수', value: d.rentailor3, best: true, tag: '추천' },
          ]}
        />
        <p className="rt-fnote" style={{ padding: '12px 0 0' }}>
          ※ 개인 직거래는 시세가 가장 높지만 시간·안전·이전등록을 직접 챙겨야 해요. Rentailor 전환 인수는 딜러보다 높은
          값에 번거로움 없이 바로 넘길 수 있어요.
        </p>
      </div>

      {/* Rentailor 전환 인수가 offer + 장기렌트 pitch */}
      <div className="rt-qblock rt-fade-up" style={cssVar({ '--d': '280ms' })}>
        <div className="rt-sell-offer">
          <div className="rt-sell-offer-top">
            <span className="rt-sell-offer-k">
              Rentailor 전환 인수가<em>다음 차로 갈아탈 때</em>
            </span>
            <span className="rt-sell-offer-v">
              <b>{won(d.rentailor3)}</b>
              <span className="rt-sell-offer-plus">딜러 대비 +{won(d.bonus3)}</span>
            </span>
          </div>
          <p className="rt-sell-offer-d">
            신차를 사면 3년간 약 <b>{won(d.drop3)}</b>의 감가를 그대로 떠안아요. 장기렌트로 타면 약정한 잔존가치
            기준으로 타기 때문에 시세 하락 위험 없이 항상 새 차로 갈아탈 수 있어요.
          </p>
        </div>
        <div className="rt-sell-tags">
          <span className="rt-sell-tag"><VlCheck />감가 리스크 0</span>
          <span className="rt-sell-tag"><VlCheck />보험·세금 포함</span>
          <span className="rt-sell-tag"><VlCheck />만기 갈아타기</span>
        </div>
      </div>
    </>
  );
}

export default function ValuePage() {
  // 추천/조회로 넘어온 차량(?id=) — 없으면 대표 신차(그랜저)로 기본 분석
  const fromRec = useMemo<Car | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const id = new URLSearchParams(window.location.search).get('id');
      return id ? RT_CATALOG.find((c) => c.id === id) ?? null : null;
    } catch {
      return null;
    }
  }, []);
  const car = fromRec ?? RT_CATALOG.find((c) => c.id === 'grandeur') ?? RT_CATALOG[0];

  const [sheet, setSheet] = useState(false);
  const [locked, setLocked] = useState(false);
  const d = useMemo(() => newCarCalc(car), [car]);

  useEffect(() => {
    const t = setTimeout(() => setLocked(true), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div data-rt="value" className="rt-root" style={cssVar({ '--rt-accent': ACCENT, '--rt-radius': '20px' })}>
      <div className="rt-page" data-page="value" id="top">
        <div className={'rt-scroll' + (locked ? ' rt-anim-lock' : '')}>
          <RtTopNav title="차량 가치 분석" backHref="/info" />

          <div className="rt-qresult">
            <div className="rt-fade-up" style={cssVar({ '--d': '0ms' })}>
              <p className="rt-qresult-kicker">
                {car.brand} · {FUEL[car.fuel].label} · 신차 기준
              </p>
              <h2 className="rt-qresult-title">{car.model.replace(/\s*\(.*\)/, '')} 가치 분석</h2>
            </div>

            {/* A2 personalize: 이해도 레벨별 용어설명(초급 펼침/중급 접힘/고급 숨김) */}
            <RtTermDefs
              title="가치 분석 핵심 용어"
              items={[
                ['잔존가치', '지금 차를 팔 때 받을 수 있는 예상 가치.'],
                ['감가율', '신차 대비 값이 떨어진 비율. 클수록 손해가 커요.'],
                ['처분손익', '차를 팔 때 생기는 이익·손실(사업자 세무에 반영).'],
              ]}
            />

            {/* 사업자 안내 — personalize 범위 밖이라 일반 렌더(항상 노출). 원본은 sole/corp 한정 */}
            <div className="rt-ccg-biz" style={{ margin: '0 0 14px' }}>
              <b>사업자 고객 안내</b>
              <span>
                법인·개인사업자는 차량 처분 시 잔존가치가 자산·세무(처분손익)에 잡혀요. 장기렌트는 차를 소유하지 않아
                감가·매각 리스크 없이 렌트료를 비용처리할 수 있어요.
              </span>
            </div>

            <ValueReport d={d} car={car} />
          </div>

          <div className="rt-bar" style={cssVar({ '--rt-accent': ACCENT })}>
            <div className="rt-bar-inner">
              <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={() => setSheet(true)}>
                이 차로 장기렌트 상담
              </Button>
            </div>
          </div>
        </div>
      </div>
      <RtConsultSheet
        open={sheet}
        onClose={() => setSheet(false)}
        car={car}
        priceLabel={'월 ' + car.from + '만원~'}
        accent={ACCENT}
      />
    </div>
  );
}
