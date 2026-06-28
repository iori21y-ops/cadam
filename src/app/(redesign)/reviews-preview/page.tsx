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

function hueIndex(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % RV_HUES.length;
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

function RvCard({ r }: { r: Review }) {
  const name = r.display_name?.trim() || '익명';
  const sub = [r.car, r.method].filter(Boolean).join(' · ');
  const hasSave = r.saved_was != null && r.saved_now != null;
  const date = fmtMonth(r.published_at ?? r.created_at);
  return (
    <div className="rt-rv-card">
      <div className="rt-rv-card-top">
        <div className="rt-rv-av" style={{ background: RV_HUES[hueIndex(r.id)] }}>
          {name[0]}
        </div>
        <div className="rt-rv-who">
          <div className="rt-rv-name">{name}</div>
          {sub && <div className="rt-rv-sub">{sub}</div>}
        </div>
        <RvStars n={r.rating} />
      </div>
      {r.title && <p className="rt-rv-q">“{r.title}”</p>}
      <p className="rt-rv-body">{r.body}</p>
      {hasSave && (
        <div className="rt-rv-save">
          <div className="rt-rv-save-col">
            <div className="rt-rv-save-k">기존 견적</div>
            <div className="rt-rv-save-v was">월 {r.saved_was}만원</div>
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
            <div className="rt-rv-save-v now">월 {r.saved_now}만원</div>
          </div>
          <span className="rt-rv-save-badge">-{(r.saved_was as number) - (r.saved_now as number)}만원</span>
        </div>
      )}
      <div className="rt-rv-meta">
        {date && <span>{date} 계약</span>}
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
    <div className="rt-root" style={cssVar({ '--rt-accent': ACCENT, '--rt-radius': '20px' })}>
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

          {reviews === null ? (
            <div className="rt-rv-state">후기를 불러오는 중…</div>
          ) : reviews.length === 0 ? (
            <div className="rt-rv-state">아직 등록된 후기가 없어요. 첫 후기를 남겨보세요.</div>
          ) : (
            <div className="rt-rv-list">
              {reviews.map((r) => (
                <RvCard key={r.id} r={r} />
              ))}
            </div>
          )}

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
