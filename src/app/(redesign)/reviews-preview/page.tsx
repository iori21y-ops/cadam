'use client';

// 고객 후기 목록 — 리뉴얼 미리보기 (타깃 /reviews)
// 원본: _design_ref/reviews-app.jsx (+ rt-reviews.css)
// 이식 규칙: window 전역 → 모듈(import), CadamDS.Button → @/components/ui/Button,
//   디바이스 토글/TweaksPanel 제외. 목업 RV_DATA/localStorage → 실 fetch('/api/reviews').
// 의도적 변경: 세그먼트 필터칩 제외(API가 seg/tag 미제공 — 카탈로그 seg 매핑은 그랜저=premium 등
//   불일치로 후기가 칩에서 사라져 깨져 보임). hero/통계 카피는 디자인 유지.
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RtTopNav } from '@/components/rentailor/RtChrome';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import './reviews.css';

const ACCENT = '#C9A84C';
const RV_HUES = ['#0D1B2A', '#B07A2E', '#2A6FDB', '#1F8A5B', '#7A4FC0', '#C0506A'];
const cssVar = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;

// /api/reviews GET 응답 (공개·게시됨만)
interface Review {
  id: string;
  display_name: string | null;
  car: string | null;
  method: string | null;
  rating: number;
  title: string | null;
  body: string;
  saved_was: number | null;
  saved_now: number | null;
  published_at: string | null;
  created_at: string;
}
interface ReviewsResponse {
  reviews: Review[];
}

// 화면 내부 표준 후기 모델 (실 API + 가상 상수 공통)
type RvSeg = 'sedan' | 'suv' | 'ev';
interface RvItem {
  id: string;
  name: string;
  seg: RvSeg;
  car: string;
  method: string;
  rating: number;
  q: string;
  body: string;
  save: { was: number; now: number } | null;
  tag: string;
  date: string;
}

// 디자인 원본 RV_FILTERS (세그먼트 필터칩)
const RV_FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'sedan', label: '세단' },
  { key: 'suv', label: 'SUV' },
  { key: 'ev', label: '전기차' },
  { key: 'corp', label: '법인' },
];

// 가상 후기(코드 상수) — 디자인 RV_DATA 패턴. 실 DB 3행(이O우·김O진·박O서)과 중복 없게 구성.
//   ★ DB 미적재(시드 금지) — 화면 표시 전용. /api/reviews 실 후기와 함께 노출.
const VIRTUAL_REVIEWS: RvItem[] = [
  { id: 'v01', name: '정O훈', seg: 'sedan', car: '현대 아반떼', method: '장기렌트 60개월', rating: 4, q: '사회초년생 첫 차로 부담 없었어요', body: '신용 이력이 길지 않아 걱정했는데 가능한 조건을 찾아주셨어요. 월 38만원이면 유지비까지 포함이라 만족합니다.', save: null, tag: '첫 차', date: '2026.04' },
  { id: 'v02', name: '최O라', seg: 'suv', car: '현대 팰리세이드', method: '장기렌트 36개월', rating: 5, q: '대형 SUV도 생각보다 합리적', body: '구매하면 감가가 너무 커서 렌트로 결정했어요. 3년 뒤 신차로 교체하는 옵션이 있어서 좋네요. 추천합니다.', save: { was: 110, now: 96 }, tag: '감가 회피', date: '2026.03' },
  { id: 'v03', name: '한O준', seg: 'ev', car: '기아 EV9', method: '장기렌트 48개월', rating: 5, q: '법인 전기 SUV, 비대면이 편했어요', body: '출장이 잦아 방문 상담이 어려웠는데 전부 비대면으로 처리했어요. 카톡으로 서류 주고받고 끝. 강력 추천해요.', save: null, tag: '법인', date: '2026.03' },
  { id: 'v04', name: '강O민', seg: 'suv', car: '기아 카니발', method: '장기렌트 48개월', rating: 5, q: '7인승 패밀리카, 초기비용 0원이 컸어요', body: '아이 둘 키우는 집이라 목돈 부담이 컸는데 초기비용 없이 시작할 수 있어서 결정했어요. 상담도 친절하셨습니다.', save: { was: 95, now: 81 }, tag: '패밀리', date: '2026.04' },
  { id: 'v05', name: '윤O경', seg: 'ev', car: '현대 아이오닉5', method: '장기렌트 36개월', rating: 4, q: '충전 말고는 다 만족스러워요', body: '보험·세금이 렌트료에 포함이라 매달 나가는 돈이 예측돼서 좋아요. 충전 인프라만 익숙해지면 완벽할 것 같아요.', save: null, tag: '전기차', date: '2026.05' },
  { id: 'v06', name: '서O빈', seg: 'sedan', car: '기아 K8', method: '장기렌트 48개월', rating: 5, q: '캐피탈 비교를 대신 해주니 편했어요', body: '혼자 알아봤으면 어디가 싼지 몰랐을 텐데 9곳을 비교해서 가장 낮은 조건을 찾아주셨어요. 시간을 많이 아꼈습니다.', save: { was: 79, now: 68 }, tag: '비교', date: '2026.05' },
  { id: 'v07', name: '오O택', seg: 'suv', car: '제네시스 GV70', method: '장기렌트 48개월', rating: 5, q: '법인 차량, 세금계산서까지 매월 깔끔', body: '법인 명의로 운용 중인데 비용처리가 명확하고 세금계산서도 매월 발행돼서 회계 처리가 편해요. 만족합니다.', save: null, tag: '법인 절세', date: '2026.02' },
  { id: 'v08', name: '문O아', seg: 'suv', car: '기아 스포티지', method: '장기렌트 60개월', rating: 3, q: '무난해요, 인도까지 조금 기다렸어요', body: '차와 조건은 만족스러운데 인기 차종이라 차량 인도까지 시간이 좀 걸렸어요. 매니저님이 중간중간 안내는 잘 해주셨습니다.', save: null, tag: '준중형 SUV', date: '2026.04' },
  { id: 'v09', name: '배O철', seg: 'sedan', car: '현대 쏘나타', method: '장기렌트 36개월', rating: 4, q: '출퇴근용으로 가성비 좋아요', body: '매일 왕복 60km 출퇴근하는데 유지비 걱정 없이 타고 있어요. 계약도 비대면으로 빠르게 끝나서 편했습니다.', save: { was: 62, now: 54 }, tag: '출퇴근', date: '2026.05' },
];

function hueIndex(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % RV_HUES.length;
}

// 실 후기 car/내용에서 세그먼트 추정(디자인 seg 칩과 정합). 키워드 휴리스틱.
function rvSegOf(text: string): RvSeg {
  if (/전기|아이오닉|모델\s?[Y3]|\bEV\d?\b|테슬라|아이오닉/i.test(text)) return 'ev';
  if (/쏘렌토|싼타페|투싼|스포티지|팰리세이드|셀토스|카니발|렉스턴|토레스|\bGV\d|\bSUV\b/i.test(text)) return 'suv';
  return 'sedan';
}
// 실 API 후기 → RvItem. seg/tag는 내용에서 추정(법인 언급 시 법인 태그).
function apiToItem(r: Review): RvItem {
  const text = [r.car, r.method, r.title, r.body].filter(Boolean).join(' ');
  const corp = /법인/.test(text);
  return {
    id: r.id,
    name: r.display_name?.trim() || '익명',
    seg: rvSegOf(text),
    car: r.car || '',
    method: r.method || '',
    rating: r.rating,
    q: r.title || '',
    body: r.body,
    save: r.saved_was != null && r.saved_now != null ? { was: r.saved_was, now: r.saved_now } : null,
    tag: corp ? '법인' : '실고객 후기',
    date: fmtMonth(r.published_at ?? r.created_at),
  };
}

function fmtMonth(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0');
}

function RvStars({ n }: { n: number }) {
  return (
    <span className="rt-rv-stars">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" width="14" height="14" fill={i <= n ? 'currentColor' : '#E2E5EA'}>
          <path d="M12 2l3 6.5 7 .8-5.2 4.7 1.5 6.9L12 17.8 5.2 20.9l1.5-6.9L1.5 9.3l7-.8z" />
        </svg>
      ))}
    </span>
  );
}

function RvCard({ r }: { r: RvItem }) {
  const sub = [r.car, r.method].filter(Boolean).join(' · ');
  return (
    <div className="rt-rv-card">
      <div className="rt-rv-card-top">
        <div className="rt-rv-av" style={{ background: RV_HUES[hueIndex(r.id)] }}>
          {r.name[0]}
        </div>
        <div className="rt-rv-who">
          <div className="rt-rv-name">{r.name}</div>
          {sub && <div className="rt-rv-sub">{sub}</div>}
        </div>
        <RvStars n={r.rating} />
      </div>
      {r.q && <p className="rt-rv-q">“{r.q}”</p>}
      <p className="rt-rv-body">{r.body}</p>
      {r.save && (
        <div className="rt-rv-save">
          <div className="rt-rv-save-col">
            <div className="rt-rv-save-k">기존 견적</div>
            <div className="rt-rv-save-v was">월 {r.save.was}만원</div>
          </div>
          <svg
            className="rt-rv-save-arrow"
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
          <div className="rt-rv-save-col">
            <div className="rt-rv-save-k">렌테일러</div>
            <div className="rt-rv-save-v now">월 {r.save.now}만원</div>
          </div>
          <span className="rt-rv-save-badge">-{r.save.was - r.save.now}만원</span>
        </div>
      )}
      <div className="rt-rv-meta">
        <span style={{ fontWeight: 700, color: '#B07A2E' }}>#{r.tag}</span>
        {r.date && <span>{r.date} 계약</span>}
        <span className="rt-rv-helpful">
          <svg
            viewBox="0 0 24 24"
            width="13"
            height="13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M7 10v11M2 11h5v10H2zM7 10l4-7a2 2 0 0 1 3 1.5V9h5a2 2 0 0 1 2 2.3l-1.3 7A2 2 0 0 1 16.7 20H7" />
          </svg>
          도움돼요
        </span>
      </div>
    </div>
  );
}

export default function ReviewsPreview() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [sheet, setSheet] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    let alive = true;
    fetch('/api/reviews')
      .then((res) => (res.ok ? (res.json() as Promise<ReviewsResponse>) : { reviews: [] }))
      .then((data) => {
        if (alive) setReviews(data.reviews ?? []);
      })
      .catch(() => {
        if (alive) setReviews([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div data-rt="reviews-preview" className="rt-root" style={cssVar({ '--rt-accent': ACCENT, '--rt-radius': '20px' })}>
      <div className="rt-page" data-page="reviews">
        <div className="rt-scroll">
          <RtTopNav title="고객 후기" />

          <div className="rt-rv-hero">
            <h1 className="rt-rv-hero-t">
              12,800명이 선택한
              <br />
              렌테일러 실제 후기
            </h1>
            <p className="rt-rv-hero-d">비대면으로 계약을 끝낸 고객들의 생생한 후기와 월 납입 절감 사례예요.</p>
            <div className="rt-rv-stats">
              <div className="rt-rv-stat">
                <b>
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                    <path d="M12 2l3 6.5 7 .8-5.2 4.7 1.5 6.9L12 17.8 5.2 20.9l1.5-6.9L1.5 9.3l7-.8z" />
                  </svg>
                  4.9
                </b>
                <span>평균 평점</span>
              </div>
              <div className="rt-rv-stat">
                <b>3,200+</b>
                <span>누적 후기</span>
              </div>
              <div className="rt-rv-stat">
                <b>98%</b>
                <span>재추천율</span>
              </div>
            </div>
          </div>

          {(() => {
            // 실 API 후기(있으면) + 가상 후기 merge → 세그먼트 필터.
            const items: RvItem[] = [...(reviews ?? []).map(apiToItem), ...VIRTUAL_REVIEWS];
            const list = items.filter((r) =>
              filter === 'all' ? true : filter === 'corp' ? r.tag.includes('법인') : r.seg === filter,
            );
            return (
              <>
                <div className="rt-rv-chips" style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 var(--rt-pad, 18px) 4px', margin: '4px 0 12px', scrollbarWidth: 'none' }}>
                  {RV_FILTERS.map((f) => {
                    const on = filter === f.key;
                    return (
                      <button
                        key={f.key}
                        type="button"
                        onClick={() => setFilter(f.key)}
                        style={{ flexShrink: 0, cursor: 'pointer', borderRadius: 999, padding: '7px 15px', fontSize: 13, fontWeight: 700, border: '1px solid ' + (on ? '#0D1B2A' : '#e2e5ea'), background: on ? '#0D1B2A' : '#fff', color: on ? '#fff' : '#6b7280' }}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
                {list.length === 0 ? (
                  <div className="rt-rv-state">해당 조건의 후기가 아직 없어요.</div>
                ) : (
                  <div className="rt-rv-list">
                    {list.map((r) => (
                      <RvCard key={r.id} r={r} />
                    ))}
                  </div>
                )}
              </>
            );
          })()}

          <div className="rt-bar" style={cssVar({ '--rt-accent': ACCENT })}>
            <div className="rt-bar-inner">
              <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={() => setSheet(true)}>
                나도 견적 받아보기
              </Button>
            </div>
          </div>
        </div>
      </div>

      <RtConsultSheet open={sheet} onClose={() => setSheet(false)} car={null} accent={ACCENT} />
    </div>
  );
}
