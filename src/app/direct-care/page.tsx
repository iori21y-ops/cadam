'use client';
// /direct-care — 다이렉트(셀프, 수수료 0) vs 상담 케어 신청 방법 선택
// 원본: _design_ref/direct-care.jsx (DirectVsCareCard) — window 전역 → 모듈로 적응.
//   rtServiceFee 의 localStorage 접근은 SSR 안전하게 useEffect 로 이동(prerender 시 기본값 1.0).
//   단독 라우트용으로 크롬(RtTopNav/RtTabBar/RtFooter) + 상담시트(RtConsultSheet) 를 덧붙였다.
//   디바이스 토글·tweaks-panel·전역리셋은 제외(프로토타입 전용).
import React, { useEffect, useState } from 'react';
import { RtTopNav, RtTabBar, RtFooter } from '@/components/rentailor/RtChrome';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import './direct-care.css';

const ACCENT = '#C9A84C';

function rtServiceFee(): number {
  if (typeof window === 'undefined') return 1.0;
  try {
    return parseFloat(localStorage.getItem('rt_service_fee') || '') || 1.0;
  } catch {
    return 1.0;
  }
}

export default function DirectCarePage() {
  const [fee, setFee] = useState(1.0);
  const [sheet, setSheet] = useState(false);
  useEffect(() => {
    setFee(rtServiceFee());
  }, []);

  return (
    <div className="rt-root" data-rt="direct-care" style={{ '--rt-accent': ACCENT } as React.CSSProperties}>
      <div className="rt-page" data-page="direct-care" id="top">
        <div className="rt-scroll">
          <RtTopNav title="신청 방법 안내" />

          <div className="rt-dc-head">
            <p className="rt-dc-eyebrow">다이렉트 케어</p>
            <h1 className="rt-dc-title">어떻게 신청할지<br />직접 선택하세요</h1>
            <p className="rt-dc-desc">스스로 진행하는 다이렉트(수수료 0원)와 매니저가 전 과정을 챙기는 상담 케어 중 편한 방법을 고르면 돼요.</p>
          </div>

          <div className="rt-trk-wrap">
            <div className="rt-trk-hd">신청 방법을 선택하세요</div>
            <div className="rt-trk">
              <div className="rt-trk-card">
                <span className="rt-trk-badge is-free">수수료 0원</span>
                <div className="rt-trk-t">
                  직접 신청<em>셀프</em>
                </div>
                <div className="rt-trk-d">제휴 캐피탈·카드사 다이렉트 페이지에서 직접 견적·신청. 영업 수수료 없이 가장 저렴하게.</div>
                <a
                  className="rt-trk-btn"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    alert('제휴사 다이렉트 견적 페이지로 이동합니다. (실연동: capital_directory.direct_url)');
                  }}
                >
                  다이렉트 페이지로 →
                </a>
              </div>
              <div className="rt-trk-card is-care">
                <span className="rt-trk-badge">수수료 {fee}%</span>
                <div className="rt-trk-t">
                  상담 케어<em>추천</em>
                </div>
                <div className="rt-trk-d">전담 매니저가 견적 비교·서류·심사·계약·만기까지 전 과정을 대신 챙겨드려요.</div>
                <button className="rt-trk-btn is-primary" type="button" onClick={() => setSheet(true)}>
                  상담 신청하기
                </button>
              </div>
            </div>
            <p className="rt-trk-note">
              상담 케어 수수료(계약가 {fee}%)는 <b>계약 성사 시에만</b> 발생해요. 직접 신청은 무료지만 모든 절차를 직접 진행하셔야 해요.
            </p>
          </div>

          <RtFooter />
        </div>
        <RtTabBar />
      </div>
      <RtConsultSheet open={sheet} onClose={() => setSheet(false)} car={null} priceLabel="다이렉트 케어 상담" accent={ACCENT} />
    </div>
  );
}
