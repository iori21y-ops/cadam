'use client';
// /booking — 상담 예약 (날짜·시간) 단독 페이지
// 원본: _design_ref/booking-app.jsx + _design_ref/chrome.jsx(RtBookingFields/rtBookingDays/rtBkLabel/rtBkTaken)
// 적응 메모:
//  - window.CadamDS.Button → @/components/ui/Button, window.rtBooking* 헬퍼 → 모듈 내부 함수.
//  - 디바이스 토글·tweaks-panel·전역리셋은 제외(프로토타입 전용).
//  - 날짜 목록은 new Date() 의존 → SSR 불일치 방지로 useEffect 에서 생성.
//  - 완료 화면 링크 마이페이지.html → /mypage, 랜딩 → /.
//  ⚠️ 제출은 원본과 동일하게 목업(완료 화면만). 실 POST 연동 갭은 작업 보고 참조.
import React, { useEffect, useMemo, useState } from 'react';
import { RtTopNav } from '@/components/rentailor/RtChrome';
import { Button } from '@/components/ui/Button';
import './booking.css';

const ACCENT = '#C9A84C';

// ── 예약 공용 데이터/헬퍼 (원본: chrome.jsx) ──
const RT_BK_TIMES = ['10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'];
const RT_BK_DOW = ['일', '월', '화', '수', '목', '금', '토'];

interface BkDay {
  key: string;
  d: number;
  mon: number;
  dow: string;
  sun: boolean;
  sat: boolean;
  tag: string;
  disabled: boolean;
}

function rtBookingDays(n: number): BkDay[] {
  const out: BkDay[] = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const dow = d.getDay();
    out.push({
      key: d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(),
      d: d.getDate(),
      mon: d.getMonth() + 1,
      dow: RT_BK_DOW[dow],
      sun: dow === 0,
      sat: dow === 6,
      tag: i === 0 ? '오늘' : i === 1 ? '내일' : '',
      disabled: dow === 0,
    });
  }
  return out;
}
function rtBkHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function rtBkTaken(dateKey: string, time: string): boolean {
  return rtBkHash(dateKey + '|' + time) % 5 === 0;
}
function rtBkLabel(days: BkDay[], key: string | null): string {
  const d = days.find((x) => x.key === key);
  return d ? d.mon + '월 ' + d.d + '일 (' + d.dow + ')' : '';
}

interface BkValue {
  method: 'kakao' | 'phone';
  date: string | null;
  time: string | null;
}

function RtBkVideoIc() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4.5h16a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-4 3.5V17H4a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 4 4.5z" />
    </svg>
  );
}
function RtBkPhoneIc() {
  return (
    <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function RtBookingFields({ value, onChange, days }: { value: BkValue; onChange: (v: BkValue) => void; days: BkDay[] }) {
  const set = (patch: Partial<BkValue>) => onChange({ ...value, ...patch });
  const methods: Array<{ v: BkValue['method']; ic: React.ReactNode; n: string; d: string }> = [
    { v: 'kakao', ic: <RtBkVideoIc />, n: '카톡 상담', d: '카카오톡으로' },
    { v: 'phone', ic: <RtBkPhoneIc />, n: '전화 상담', d: '편하게 통화로' },
  ];
  return (
    <>
      <div className="rt-bk-sect">
        <p className="rt-bk-sect-t">상담 방식</p>
        <div className="rt-bk-methods">
          {methods.map((m) => (
            <button key={m.v} className={'rt-bk-method' + (value.method === m.v ? ' is-on' : '')} onClick={() => set({ method: m.v })}>
              <span className="rt-bk-method-ic">{m.ic}</span>
              <span className="rt-bk-method-n">{m.n}</span>
              <span className="rt-bk-method-d">{m.d}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="rt-bk-sect">
        <p className="rt-bk-sect-t">
          날짜 선택 <span>· 일요일 휴무</span>
        </p>
        <div className="rt-bk-dates">
          {days.map((d) => (
            <button
              key={d.key}
              disabled={d.disabled}
              className={'rt-bk-date' + (value.date === d.key ? ' is-on' : '') + (d.sun ? ' sun' : '')}
              onClick={() => set({ date: d.key, time: null })}
            >
              <span className="rt-bk-date-dow">{d.dow}</span>
              <span className="rt-bk-date-d">{d.d}</span>
              <span className="rt-bk-date-tag">{d.tag}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="rt-bk-sect">
        <p className="rt-bk-sect-t">
          시간 선택 <span>· 30분 단위</span>
        </p>
        {value.date ? (
          <div className="rt-bk-times">
            {RT_BK_TIMES.map((t) => {
              const dis = rtBkTaken(value.date as string, t);
              return (
                <button key={t} disabled={dis} className={'rt-bk-time' + (value.time === t ? ' is-on' : '')} onClick={() => set({ time: t })}>
                  {t}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="rt-bk-noslot">먼저 날짜를 선택해 주세요</p>
        )}
      </div>
    </>
  );
}

export default function BookingPage() {
  const [days, setDays] = useState<BkDay[]>([]);
  useEffect(() => {
    setDays(rtBookingDays(14));
  }, []);
  const [v, setV] = useState<BkValue>({ method: 'kakao', date: null, time: null });
  const [done, setDone] = useState(false);
  const ready = Boolean(v.date && v.time);
  const dateLabel = useMemo(() => rtBkLabel(days, v.date), [days, v.date]);
  const go = () => {
    setDone(true);
    const sc = document.querySelector('.rt-scroll');
    if (sc) sc.scrollTop = 0;
  };

  return (
    <div className="rt-root" data-rt="booking" style={{ '--rt-accent': ACCENT } as React.CSSProperties}>
      <div className="rt-page" data-page="booking" id="top">
        <div className="rt-scroll">
          <RtTopNav title="상담 예약" />

          {done ? (
            <div className="rt-bk-done">
              <div className="rt-bk-done-ic">
                <svg viewBox="0 0 24 24" width="30" height="30">
                  <path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="rt-bk-done-t">상담 예약이 확정됐어요</p>
              <p className="rt-bk-done-d">
                박지훈 매니저가 선택하신 일정에 맞춰
                <br />
                1:1로 안내해 드릴게요.
              </p>
              <div className="rt-bk-done-card">
                <div className="rt-bk-done-row">
                  <span>예약 일시</span>
                  <b>
                    {dateLabel} {v.time}
                  </b>
                </div>
                <div className="rt-bk-done-row">
                  <span>상담 방식</span>
                  <b>{v.method === 'kakao' ? '카톡 상담' : '전화 상담'}</b>
                </div>
                <div className="rt-bk-done-row">
                  <span>전담 매니저</span>
                  <b>박지훈 매니저</b>
                </div>
              </div>
              <div style={{ width: '100%', marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={() => (location.href = '/mypage')}>
                  마이페이지에서 보기
                </Button>
                <button className="rt-bk-time" style={{ height: 52, fontWeight: 800 }} onClick={() => (location.href = '/')}>
                  홈으로
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="rt-bk-head">
                <p className="rt-bk-eyebrow">무료 1:1 상담</p>
                <h1 className="rt-bk-title">
                  원하는 시간에
                  <br />
                  상담을 예약하세요
                </h1>
                <p className="rt-bk-desc">전담 매니저가 제휴 캐피탈 9곳을 비교해 선택하신 일정에 맞춰 최저 견적을 안내해 드려요.</p>
              </div>
              <div className="rt-bk-body">
                <div className="rt-bk-mgr">
                  <span className="rt-bk-mgr-av">박</span>
                  <div>
                    <div className="rt-bk-mgr-n">박지훈 매니저</div>
                    <div className="rt-bk-mgr-s">렌테일러 전담 컨설턴트 · 평균 응답 10분</div>
                  </div>
                </div>
                <RtBookingFields value={v} onChange={setV} days={days} />
              </div>
            </>
          )}

          {!done && (
            <div className="rt-bar">
              <div className="rt-bar-inner">
                {ready && (
                  <div className="rt-bk-pick" style={{ marginTop: 0, marginBottom: 10 }}>
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4.5" width="18" height="17" rx="2.5" />
                      <path d="M3 9h18M8 2.5v4M16 2.5v4" />
                    </svg>
                    <div>
                      <b>
                        {dateLabel} {v.time}
                      </b>
                      {' · '}
                      <span>{v.method === 'kakao' ? '카톡 상담' : '전화 상담'}</span>
                    </div>
                  </div>
                )}
                <Button variant="primary" size="lg" fullWidth className="rt-gold" disabled={!ready} onClick={go}>
                  이 일정으로 예약하기
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
