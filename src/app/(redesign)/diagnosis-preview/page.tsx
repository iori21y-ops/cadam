'use client';

// AI 진단 허브 — 리뉴얼 미리보기 (타깃 /diagnosis)
// 원본: _design_ref/hub-app.jsx (+ rt-diag-tools.css 의 .rt-hub-* 섹션)
// 이식 규칙: window 전역 → import, CadamDS.Button → @/components/ui/Button,
//   window.RtIcon* → @/components/rentailor/RtIcons, 디바이스 토글/TweaksPanel/personalize 제외,
//   링크 .html → 프리뷰 라우트(next/link).
import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { RtTopNav, RtTabBar } from '@/components/rentailor/RtChrome';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import { RtIconMoney, RtIconCar } from '@/components/rentailor/RtIcons';
import { RtTermDefs } from '@/lib/rentailor/personalize';
import './diagnosis.css';

const ACCENT = '#C9A84C';
const cssVar = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;

interface HubTool {
  ic: React.ReactNode;
  blue?: boolean;
  title: string;
  desc: string;
  href: string;
  badge?: string;
}
interface HubChip {
  t: string;
  d: string;
}

const HubChev = () => (
  <svg
    className="rt-hub-chev"
    viewBox="0 0 24 24"
    width="22"
    height="22"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 6l6 6-6 6" />
  </svg>
);

const TOOLS: HubTool[] = [
  {
    ic: <RtIconMoney size={26} />,
    blue: false,
    title: '상품 진단',
    desc: '나에게 맞는 금융 방식을 1분 만에 진단해요.',
    href: '/diagnosis-finance-preview',
  },
  {
    ic: <RtIconCar size={26} />,
    blue: false,
    title: '차종 진단',
    desc: '라이프스타일·예산 맞춤 차종과 감가 등급까지 추천해요.',
    href: '/diagnosis-vehicle-preview',
  },
];

const CHIPS: HubChip[] = [
  { t: '개인정보 미수집', d: 'M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z' },
  { t: '1분 소요', d: 'M13 2L4.5 13H11l-1 9 8.5-11H12z' },
  { t: 'AI 맞춤 추천', d: 'M12 3v2M12 19v2M3 12h2M19 12h2M6 6l1.5 1.5M16.5 16.5L18 18M18 6l-1.5 1.5M7.5 16.5L6 18' },
];

export default function DiagnosisPreview() {
  const [sheet, setSheet] = useState(false);

  return (
    <div data-rt="diagnosis-preview" className="rt-root" style={cssVar({ '--rt-accent': ACCENT, '--rt-radius': '20px' })}>
      <div className="rt-page" data-page="hub">
        <div className="rt-scroll">
          <RtTopNav title="AI 진단" />

          <div className="rt-hub-head">
            <div className="rt-hub-status">
              <span>아직 진단 내역이 없어요</span>
              <b>진단 0건</b>
            </div>
            <h1 className="rt-hub-title">
              어떤 진단이
              <br />
              필요하세요?
            </h1>
            <p className="rt-hub-sub">
              양복 맞추듯, 2가지 AI 진단으로 금융 방식부터 차종까지 나에게 딱 맞게 찾아드려요.
            </p>
          </div>

          {/* A2 personalize: 이해도 레벨별 용어설명(초급 펼침/중급 접힘/고급 숨김) */}
          <RtTermDefs
            title="금융 방식 한눈에"
            items={[
              ['장기렌트', '회사 차를 빌려 타고 매달 렌트료를 내요. 보험·정비 포함.'],
              ['오토리스', '차를 빌리되 회계·세무에 유리한 금융 방식.'],
              ['할부 구매', '내 명의로 사고 매달 나눠 갚는 방식. 끝나면 내 차.'],
            ]}
          />

          <div className="rt-hub-cta">
            <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={() => setSheet(true)}>
              즉시 상담 신청
            </Button>
          </div>

          <div className="rt-hub-list">
            {TOOLS.map((t) => (
              <Link className="rt-hub-card" key={t.title} href={t.href}>
                <span className={'rt-hub-ic' + (t.blue ? ' blue' : '')}>{t.ic}</span>
                <span className="rt-hub-main">
                  <span className="rt-hub-h">
                    <b>{t.title}</b>
                    {t.badge && <span className="rt-hub-new">{t.badge}</span>}
                  </span>
                  <span className="rt-hub-d">{t.desc}</span>
                </span>
                <HubChev />
              </Link>
            ))}
          </div>

          <div className="rt-hub-chips">
            {CHIPS.map((c) => (
              <span className="rt-hub-chip" key={c.t}>
                <svg
                  viewBox="0 0 24 24"
                  width="14"
                  height="14"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={c.d} />
                </svg>
                {c.t}
              </span>
            ))}
          </div>

          <RtTabBar active="diag" />
        </div>
      </div>

      <RtConsultSheet
        open={sheet}
        onClose={() => setSheet(false)}
        car={null}
        accent={ACCENT}
        onSubmitted={() => {
          // TODO(§3.4C): consultations 단일 insert 연결점 (공통 name·phone·consent + source=inflow_page + context jsonb). 현재는 결과/모달 렌더만, POST 미연동.
        }}
      />
    </div>
  );
}
