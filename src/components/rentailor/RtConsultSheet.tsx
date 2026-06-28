'use client';
// RtConsultSheet.tsx — 상담 신청 바텀시트 (브랜드 폼)
// 원본: _design_ref/chrome.jsx 의 RtConsultSheet (CDS.Button → @/components/ui/Button,
//        <image-slot> 프로토타입 전용 → 제거하고 색상 플레이스홀더로 대체)
// ⚠️ submit 은 현재 목업(완료 화면만). 실 POST /api/consultation 연동은 5조(§14.4).
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

export interface SheetCar {
  id: string;
  brand: string;
  model: string;
  segLabel: string;
  hue?: number;
}

export interface RtConsultSheetProps {
  open: boolean;
  onClose: () => void;
  car?: SheetCar | null;
  priceLabel?: string;
  accent?: string;
  onSubmitted?: () => void;
}

export function RtConsultSheet({ open, onClose, car, priceLabel, accent, onSubmitted }: RtConsultSheetProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agree, setAgree] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setDone(false);
      setName('');
      setPhone('');
      setAgree(true);
    }
  }, [open]);

  const fmtPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length < 4) return d;
    if (d.length < 8) return d.slice(0, 3) + '-' + d.slice(3);
    return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
  };
  const valid = Boolean(name.trim() && phone.trim() && agree);
  const submit = (e: React.FormEvent | React.MouseEvent) => {
    e.preventDefault();
    if (valid) {
      setDone(true);
      onSubmitted?.();
    }
  };

  return (
    <>
      <div className={'rt-sheet-scrim' + (open ? ' is-open' : '')} onClick={onClose}></div>
      <div className={'rt-sheet' + (open ? ' is-open' : '')} role="dialog" aria-modal="true">
        <div className="rt-sheet-grab"></div>
        <button className="rt-sheet-close" onClick={onClose} aria-label="닫기">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {done ? (
          <div className="rt-sheet-done">
            <div className="rt-sheet-done-ic" style={{ background: accent }}>
              <svg viewBox="0 0 24 24" width="26" height="26">
                <path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="rt-sheet-done-t">{name || '고객'}님, 신청이 완료됐어요</p>
            <p className="rt-sheet-done-d">
              전담 매니저가 10분 내로 연락드려
              <br />
              {car ? car.brand + ' ' + car.model : '선택하신 차량'}의 최저 견적을 안내해 드릴게요.
            </p>
            <div style={{ marginTop: 22 }}>
              <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={onClose}>
                확인
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="rt-sheet-eyebrow">비대면 상담</p>
            <h3 className="rt-sheet-title">30초면 신청 끝</h3>
            <p className="rt-sheet-sub">이름과 연락처만 남기면 제휴 캐피탈 9곳을 비교해 가장 낮은 조건을 찾아드려요.</p>

            {car && (
              <div className="rt-sheet-car">
                <div
                  className="rt-sheet-car-thumb"
                  style={{
                    background: `hsl(${car.hue ?? 0} 42% 93%)`,
                    color: `hsl(${car.hue ?? 0} 38% 42%)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                  aria-hidden="true"
                >
                  {car.model.replace(/\s*\(.*\)/, '').slice(0, 4)}
                </div>
                <div className="rt-sheet-car-meta">
                  <span className="rt-sheet-car-name">
                    {car.brand} {car.model}
                  </span>
                  <span className="rt-sheet-car-sub">{car.segLabel}</span>
                </div>
                <div className="rt-sheet-car-price">
                  <b>{priceLabel}</b>
                  <span>예상 월 렌트료</span>
                </div>
              </div>
            )}

            <form className="rt-form" onSubmit={submit}>
              <label className="rt-field">
                <span className="rt-field-label">이름</span>
                <input className="rt-input" type="text" placeholder="홍길동" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
              <label className="rt-field">
                <span className="rt-field-label">연락처</span>
                <input
                  className="rt-input"
                  type="tel"
                  inputMode="numeric"
                  placeholder="010-0000-0000"
                  value={phone}
                  onFocus={() => {
                    if (!phone) setPhone('010-');
                  }}
                  onChange={(e) => setPhone(fmtPhone(e.target.value))}
                />
              </label>
              <label className="rt-consent">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
                <span className="rt-consent-box" style={{ ['--rt-accent' as string]: accent } as React.CSSProperties} aria-hidden="true">
                  <svg viewBox="0 0 12 12" width="12" height="12">
                    <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="rt-consent-text">
                  <a href="/privacy" target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>
                    개인정보 처리방침
                  </a>
                  에 동의합니다. <em>(필수)</em>
                </span>
              </label>
              <div style={{ marginTop: 4 }}>
                <Button variant="primary" size="lg" fullWidth className="rt-gold" disabled={!valid} onClick={submit}>
                  비대면 상담 신청하기
                </Button>
              </div>
            </form>
            <p className="rt-form-note">입력하신 정보는 상담 목적 외에 사용되지 않습니다.</p>
          </>
        )}
      </div>
    </>
  );
}
