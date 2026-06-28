'use client';

// 후기 작성 — 리뉴얼 미리보기 (타깃 /reviews/write, 회원 전용)
// 원본: _design_ref/review-write-app.jsx (+ rt-reviews.css)
// 이식 규칙: window 전역 → 모듈(import), CadamDS.Button → @/components/ui/Button,
//   디바이스 토글/TweaksPanel 제외. window.RT_CATALOG → RT_CATALOG import.
//   회원 판정: 프로토타입 localStorage rt_member → getMember() (비동기, 로딩 상태 추가).
//   제출: localStorage 저장 → POST /api/reviews (status='pending', 검수 후 게시).
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { RtTopNav, RtTabBar } from '@/components/rentailor/RtChrome';
import { RT_CATALOG } from '@/lib/rentailor/catalog';
import { getMember, type MemberInfo } from '@/lib/member-auth';
import './reviews-write.css';

const ACCENT = '#C9A84C';
const cssVar = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;
const RW_RATE_TXT: Record<number, string> = { 1: '별로예요', 2: '그저 그래요', 3: '보통이에요', 4: '좋아요', 5: '최고예요' };

// /api/reviews POST 응답
interface CreateReviewResponse {
  ok: boolean;
  id?: string;
  status?: string;
  error?: string;
}

const cleanModel = (m: string) => m.replace(/\s*\(.*\)/, '');

// ── 작성 폼 (회원 전용) ──────────────────────────────────────
function RwForm({ onUnauth }: { onUnauth: () => void }) {
  const router = useRouter();
  const cat = RT_CATALOG;
  const [rating, setRating] = useState(5);
  const [carId, setCarId] = useState(cat[0] ? cat[0].id : '');
  const [term, setTerm] = useState(48);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const car = cat.find((c) => c.id === carId);
  const valid = Boolean(rating && carId && title.trim().length >= 2 && body.trim().length >= 10) && !submitting;

  const submit = async () => {
    if (!valid) return;
    setSubmitting(true);
    setError('');
    const trimmed = name.trim();
    const masked = trimmed ? trimmed[0] + 'O' + (trimmed.slice(-1) || '') : undefined;
    const payload = {
      car: car ? cleanModel(car.brand + ' ' + car.model) : undefined,
      method: '장기렌트 ' + term + '개월',
      rating,
      title: title.trim(),
      body: body.trim(),
      displayName: masked,
    };
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        onUnauth(); // 세션 만료 등 → 인플레이스 비회원 게이트로 전환
        return;
      }
      const data = (await res.json()) as CreateReviewResponse;
      if (data.ok) {
        setDone(true);
        document.querySelector('.rt-scroll')?.scrollTo({ top: 0 });
      } else {
        setError('후기 등록에 실패했어요. 잠시 후 다시 시도해주세요.');
      }
    } catch {
      setError('네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rt-page" data-page="review-write">
      <div className="rt-scroll">
        <RtTopNav title="후기 작성" backHref="/mypage" />

        {done ? (
          <div className="rt-rw-done">
            <div className="rt-rw-done-ic">
              <svg viewBox="0 0 24 24" width="30" height="30">
                <path d="M5 12.5l4.5 4.5L19 7" stroke="#fff" strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="rt-rw-done-t">후기가 접수됐어요</p>
            <p className="rt-rw-done-d">
              소중한 후기 감사합니다.
              <br />
              운영자 검수 후 고객 후기 페이지에 게시돼요.
            </p>
            <div style={{ width: '100%', marginTop: 22, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={() => router.push('/reviews-preview')}>
                고객 후기 둘러보기
              </Button>
              <button className="rt-rw-chip" style={{ height: 52, fontWeight: 800 }} onClick={() => router.push('/mypage')}>
                마이페이지로
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="rt-rw-head">
              <h1 className="rt-rw-title">이용 후기를 남겨주세요</h1>
              <p className="rt-rw-desc">실제 계약하신 차량의 경험을 들려주시면 다른 고객들에게 큰 도움이 돼요.</p>
            </div>
            <div className="rt-rw-body">
              <div className="rt-rw-field">
                <p className="rt-rw-label">전체 만족도</p>
                <div className="rt-rw-stars">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button key={i} className={'rt-rw-star' + (i <= rating ? ' on' : '')} onClick={() => setRating(i)} aria-label={i + '점'}>
                      <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                        <path d="M12 2l3 6.5 7 .8-5.2 4.7 1.5 6.9L12 17.8 5.2 20.9l1.5-6.9L1.5 9.3l7-.8z" />
                      </svg>
                    </button>
                  ))}
                  <span className="rt-rw-rate-txt">{RW_RATE_TXT[rating]}</span>
                </div>
              </div>

              <div className="rt-rw-field">
                <p className="rt-rw-label">이용 차량</p>
                <select className="rt-rw-select" value={carId} onChange={(e) => setCarId(e.target.value)}>
                  {cat.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.brand} {cleanModel(c.model)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rt-rw-field">
                <p className="rt-rw-label">이용 방식</p>
                <div className="rt-rw-chips">
                  {[36, 48, 60].map((m) => (
                    <button key={m} className={'rt-rw-chip' + (term === m ? ' is-on' : '')} onClick={() => setTerm(m)}>
                      {m}개월
                    </button>
                  ))}
                </div>
              </div>

              <div className="rt-rw-field">
                <p className="rt-rw-label">한 줄 제목</p>
                <input
                  className="rt-rw-input"
                  type="text"
                  maxLength={30}
                  placeholder="예: 초기비용 0원에 보험까지 포함돼 만족"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="rt-rw-field">
                <p className="rt-rw-label">
                  상세 후기 <em>최소 10자</em>
                </p>
                <textarea
                  className="rt-rw-textarea"
                  maxLength={300}
                  placeholder="상담 과정, 계약 편의, 차량 만족도 등 솔직한 경험을 적어주세요."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
                <p className="rt-rw-count">{body.length}/300</p>
              </div>

              <div className="rt-rw-field">
                <p className="rt-rw-label">
                  작성자 이름 <em>선택 · 이니셜로 표시</em>
                </p>
                <input
                  className="rt-rw-input"
                  type="text"
                  maxLength={10}
                  placeholder="예: 김지민 → 김O민"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <p className="rt-rw-note">작성하신 후기는 이름이 이니셜로 마스킹되며, 운영자 검수 후 고객 후기 페이지에 노출됩니다.</p>
              {error && (
                <p className="rt-rw-note" style={{ color: '#C0506A' }}>
                  {error}
                </p>
              )}
            </div>

            <div className="rt-bar" style={cssVar({ '--rt-accent': ACCENT })}>
              <div className="rt-bar-inner">
                <Button variant="primary" size="lg" fullWidth className="rt-gold" disabled={!valid} onClick={submit}>
                  {submitting ? '등록 중…' : '후기 등록하기'}
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── 비회원 게이트 ────────────────────────────────────────────
function RwGate() {
  const router = useRouter();
  return (
    <div className="rt-page" data-page="review-write">
      <div className="rt-scroll" style={{ display: 'flex', flexDirection: 'column' }}>
        <RtTopNav title="후기 작성" />
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '40px 30px',
          }}
        >
          <div
            style={{
              width: 66,
              height: 66,
              borderRadius: 20,
              background: 'rgba(201,168,76,.14)',
              color: 'var(--rt-accent,#B07A2E)',
              display: 'grid',
              placeItems: 'center',
              marginBottom: 20,
            }}
          >
            <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 2.5v5.5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V5.5z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
          </div>
          <h1 style={{ fontSize: 21, fontWeight: 800, color: '#0D1B2A', letterSpacing: '-.02em' }}>회원만 후기를 작성할 수 있어요</h1>
          <p style={{ fontSize: 14, color: '#7A828E', lineHeight: 1.6, marginTop: 12, maxWidth: 300 }}>
            실제 이용 고객의 신뢰도 높은 후기를 위해, 휴대폰 인증으로 가입한 회원만 작성할 수 있습니다.
          </p>
          <div style={{ width: '100%', maxWidth: 320, marginTop: 28, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button variant="primary" size="lg" fullWidth onClick={() => router.push('/login-preview')}>
              휴대폰 인증하고 로그인
            </Button>
            <Button variant="secondary" size="md" fullWidth onClick={() => router.push('/reviews-preview')}>
              다른 후기 둘러보기
            </Button>
          </div>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 16 }}>3초면 로그인할 수 있어요 (카카오·휴대폰)</p>
        </div>
        <RtTabBar active="mypage" />
      </div>
    </div>
  );
}

export default function ReviewsWritePreview() {
  // undefined = 로딩, null = 비회원, MemberInfo = 회원
  const [member, setMember] = useState<MemberInfo | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    getMember().then((m) => {
      if (alive) setMember(m);
    });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="rt-root" style={cssVar({ '--rt-accent': ACCENT, '--rt-radius': '20px' })}>
      {member === undefined ? (
        <div className="rt-page" data-page="review-write">
          <div className="rt-scroll">
            <RtTopNav title="후기 작성" />
            <div className="rt-rw-state">불러오는 중…</div>
          </div>
        </div>
      ) : member ? (
        <RwForm onUnauth={() => setMember(null)} />
      ) : (
        <RwGate />
      )}
    </div>
  );
}
