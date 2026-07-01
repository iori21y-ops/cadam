'use client';

// mypage-preview/page.tsx — 마이페이지 회원 허브 (리뉴얼 미리보기, 타깃 /mypage)
// 원본: _design_ref/mypage-app.jsx (+ rt-mypage.css)
// 범위(4조 회원 핵심): ① 회원 정보(이름·휴대폰·동의) ② 내 상담 내역 ③ 내 후기 ④ 로그아웃.
// 제외(별도 프로토타입): 계약케어(contract-care.jsx)·내차고(garage-app.jsx)·견적상세·등급/포인트·
//   알림수신토글·관심차량그리드·렌트가이드 — 데이터/엔드포인트 부재로 이식하지 않음(자리 생략).
// 인증: getMember() null 또는 /api/members/mypage 401 → 회원 게이트(/login-preview 유도).
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { carImageUrl } from '@/lib/car-image-url';
import { RtTopNav, RtTabBar } from '@/components/rentailor/RtChrome';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import { getMember, memberSignOut, type MemberInfo } from '@/lib/member-auth';
import './mypage.css';

const ACCENT = '#C9A84C';
const cssVar = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;

// ── API 응답 타입 (/api/members/mypage) ──
interface Consultation {
  id: string;
  car_brand: string | null;
  car_model: string | null;
  trim: string | null;
  monthly_budget: number | null;
  estimated_min: number | null;
  estimated_max: number | null;
  status: string | null;
  consult_result: string | null;
  created_at: string;
}
interface Review {
  id: string;
  car: string | null;
  method: string | null;
  rating: number | null;
  title: string | null;
  body: string | null;
  status: string | null;
  created_at: string;
  published_at: string | null;
}
interface LedgerRow { id: string; type: string; label: string | null; amount: number; balance_after: number | null; status: string; created_at: string }
interface PointsData { balance: number; ledger: LedgerRow[] }
interface FavRow { id: string; vehicle_slug: string; created_at: string; name: string | null; image_key: string | null }
interface FavData { favorites: FavRow[]; priceMap: Record<string, number> }
interface ContractRow { id: string; car_slug: string | null; car_name: string | null; contract_type: string | null; status: string | null; monthly_payment: number | null; term_months: number | null; contract_start_date: string | null; contract_end_date: string | null; created_at: string }
interface MypageData {
  member: MemberInfo;
  consultations: Consultation[];
  reviews: Review[];
}

type Phase = 'loading' | 'gate' | 'ready';

// ── 아이콘 ──
function Icon({ name }: { name: 'chev' | 'chat' | 'write' | 'phone' | 'lock' }) {
  const p: Record<string, React.ReactNode> = {
    chev: <path d="M9 6l6 6-6 6" />,
    chat: (
      <>
        <path d="M4 5.5h16v10H9.5L5.5 19v-3.5H4z" />
        <path d="M8.5 10.5h7M8.5 13h4" />
      </>
    ),
    write: <path d="M12 3l2.4 5.2 5.6.5-4.3 3.7 1.3 5.5L12 20.6 6.9 18.4 8.3 12.9 4 9.2l5.6-.5z" />,
    phone: (
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    ),
    lock: (
      <>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      {p[name]}
    </svg>
  );
}

// 상태 문자열 → 배지 스타일(완료성=done, 그 외=active). DB enum 미확정 → 문자열 그대로 노출.
const DONE_HINTS = ['done', 'complete', 'completed', 'closed', 'published', '완료', '발행', '종료'];
const CONTRACT_TYPE_LABEL: Record<string, string> = { rental: '장기렌트', lease: '리스', installment: '할부' };
function badgeKind(status: string | null): 'is-active' | 'is-done' {
  const s = (status || '').toLowerCase();
  return DONE_HINTS.some((h) => s.includes(h)) ? 'is-done' : 'is-active';
}

const fmtDate = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

function Stars({ rating }: { rating: number | null }) {
  const n = Math.max(0, Math.min(5, Math.round(rating ?? 0)));
  return (
    <span className="rt-hl-stars" aria-label={`별점 ${n}점`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} viewBox="0 0 24 24" width="13" height="13" fill={i < n ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">
          <path d="M12 2l2.9 6.3 6.9.6-5.2 4.6 1.6 6.7L12 17.3 5.8 20.8l1.6-6.7L2.2 8.9l6.9-.6z" />
        </svg>
      ))}
    </span>
  );
}

export default function MypagePreview() {
  const [phase, setPhase] = useState<Phase>('loading');
  const [data, setData] = useState<MypageData | null>(null);
  const [points, setPoints] = useState<PointsData | null>(null);
  const [favs, setFavs] = useState<FavData | null>(null);
  const [contracts, setContracts] = useState<ContractRow[] | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const member = await getMember();
      if (!alive) return;
      if (!member) {
        setPhase('gate');
        return;
      }
      try {
        const res = await fetch('/api/members/mypage', { cache: 'no-store' });
        if (!alive) return;
        if (res.status === 401) {
          setPhase('gate');
          return;
        }
        const json = (await res.json()) as MypageData;
        if (!alive) return;
        if (!json.member) {
          setPhase('gate');
          return;
        }
        setData(json);
        setPhase('ready');
      } catch {
        if (alive) setPhase('gate');
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    fetch('/api/points', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (alive && j && j.member) setPoints({ balance: j.balance, ledger: j.ledger });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch('/api/members/favorites', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
      fetch('/api/catalog-pricing', { cache: 'no-store' }).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([f, p]) => {
        if (!alive || !f || !Array.isArray(f.favorites)) return;
        const priceMap: Record<string, number> = (p && p.prices) ? p.prices : {};
        setFavs({ favorites: f.favorites, priceMap });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    let alive = true;
    fetch('/api/members/contracts', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => { if (alive && j && Array.isArray(j.contracts)) setContracts(j.contracts); })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  const handleLogout = async () => {
    await memberSignOut();
    window.location.href = '/';
  };

  return (
    <div data-rt="mypage-preview" className="rt-root" style={cssVar({ '--rt-accent': ACCENT, '--rt-radius': '20px' })}>
      <div className="rt-page" data-page="mypage">
        <div className="rt-scroll">
          <RtTopNav title="마이" />

          {phase === 'loading' && <div className="rt-gate-loading">불러오는 중…</div>}

          {phase === 'gate' && (
            <div className="rt-gate">
              <span className="rt-gate-ic">
                <Icon name="lock" />
              </span>
              <h1 className="rt-gate-t">로그인이 필요해요</h1>
              <p className="rt-gate-d">
                마이페이지는 회원 전용이에요.
                <br />
                로그인하고 상담 내역·후기를 확인하세요.
              </p>
              <Link className="rt-gate-btn" href="/login-preview">
                로그인하기
              </Link>
            </div>
          )}

          {phase === 'ready' && data && (
            <>
              {/* ① 회원 정보 */}
              <div className="rt-my-head">
                <div className="rt-my-profile">
                  <div className="rt-my-avatar">{(data.member.name || '회').charAt(0)}</div>
                  <div className="rt-my-id">
                    <span className="rt-my-name">
                      <b>{data.member.name || '회원'}</b>님
                    </span>
                    <span className="rt-my-grade">
                      <span>{data.member.phone}</span>
                      <span className={data.member.consent_marketing ? '' : 'is-off'}>
                        {data.member.consent_marketing ? '마케팅 수신 동의' : '마케팅 미동의'}
                      </span>
                    </span>
                  </div>
                </div>
                <div className="rt-my-stats">
                  <div className="rt-my-stat">
                    <span className="rt-my-stat-v">{data.consultations.length}</span>
                    <span className="rt-my-stat-l">상담 내역</span>
                  </div>
                  <div className="rt-my-stat">
                    <span className="rt-my-stat-v">{data.reviews.length}</span>
                    <span className="rt-my-stat-l">작성 후기</span>
                  </div>
                </div>
              </div>

              {/* 내 포인트 */}
              <div className="rt-my-sect">
                <div className="rt-my-sect-head">
                  <h2 className="rt-my-sect-t">내 포인트</h2>
                  <span className="rt-my-sect-more">{points ? points.balance.toLocaleString() : 0} 원</span>
                </div>
                {!points || points.ledger.length === 0 ? (
                  <div className="rt-sub-empty">적립 내역이 없습니다.</div>
                ) : (
                  <div className="rt-hl">
                    {points.ledger.map((row) => (
                      <div className="rt-hl-card" key={row.id}>
                        <div className="rt-hl-top">
                          <span className="rt-hl-name">{row.label || row.type}</span>
                          <span className="rt-hl-price">
                            <b>{row.amount.toLocaleString()}</b>
                            <span>포인트</span>
                          </span>
                        </div>
                        <div className="rt-hl-meta">
                          <span className="rt-hl-sub">{fmtDate(row.created_at)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ② 내 상담 내역 */}
              <div className="rt-my-sect">
                <div className="rt-my-sect-head">
                  <h2 className="rt-my-sect-t">내 상담 내역</h2>
                </div>
                {data.consultations.length === 0 ? (
                  <div className="rt-sub-empty">
                    아직 상담 내역이 없어요.
                    <br />
                    원하는 차량으로 무료 상담을 신청해 보세요.
                  </div>
                ) : (
                  <div className="rt-hl">
                    {data.consultations.map((c) => {
                      const carName = [c.car_brand, c.car_model, c.trim].filter(Boolean).join(' ') || '상담';
                      const hasRange = c.estimated_min != null && c.estimated_max != null;
                      return (
                        <div className="rt-hl-card" key={c.id}>
                          <div className="rt-hl-top">
                            <span className="rt-hl-name">{carName}</span>
                            {c.status && <span className={'rt-hl-badge ' + badgeKind(c.status)}>{c.status}</span>}
                          </div>
                          <div className="rt-hl-meta">
                            <span className="rt-hl-sub">
                              {fmtDate(c.created_at)} 신청
                              {c.consult_result ? (
                                <>
                                  <br />
                                  {c.consult_result}
                                </>
                              ) : c.monthly_budget != null ? (
                                <>
                                  <br />월 예산 {c.monthly_budget.toLocaleString()}만원
                                </>
                              ) : null}
                            </span>
                            {hasRange && (
                              <span className="rt-hl-price">
                                <b>
                                  {c.estimated_min!.toLocaleString()}~{c.estimated_max!.toLocaleString()}
                                </b>
                                <span>예상 월 렌트료(만원)</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ④ 내 찜 */}
              {favs && favs.favorites.length > 0 && (
                <div className="rt-my-sect">
                  <div className="rt-my-sect-head">
                    <h2 className="rt-my-sect-t">내 찜</h2>
                  </div>
                  <div className="rt-fav-grid">
                    {favs.favorites.map((f) => (
                      <Link key={f.id} className="rt-fav-card" href={`/cars/${f.vehicle_slug}`}>
                        <div className="rt-fav-img" style={{ background: '#fff' }}>
                          <img src={carImageUrl(f.image_key ?? '')} alt={f.name ?? ''} loading="lazy" />
                        </div>
                        <div className="rt-fav-name">{f.name ?? f.vehicle_slug}</div>
                        {favs.priceMap[f.vehicle_slug] != null && (
                          <div className="rt-fav-price">월 {favs.priceMap[f.vehicle_slug].toLocaleString()}만원~</div>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* ③ 내 후기 */}
              <div className="rt-my-sect">
                <div className="rt-my-sect-head">
                  <h2 className="rt-my-sect-t">내 후기</h2>
                  <Link className="rt-my-sect-more" href="/reviews-preview">
                    전체 보기
                  </Link>
                </div>
                {data.reviews.length === 0 ? (
                  <div className="rt-sub-empty">
                    아직 작성한 후기가 없어요.
                    <br />
                    이용 후기를 남기고 포인트도 받아보세요.
                  </div>
                ) : (
                  <div className="rt-hl">
                    {data.reviews.map((r) => (
                      <div className="rt-hl-card" key={r.id}>
                        <div className="rt-hl-top">
                          <span className="rt-hl-name">{r.title || r.car || '후기'}</span>
                          {r.status && <span className={'rt-hl-badge ' + badgeKind(r.status)}>{r.status}</span>}
                        </div>
                        <Stars rating={r.rating} />
                        {r.body && <p className="rt-hl-body">{r.body}</p>}
                        <div className="rt-hl-meta">
                          <span className="rt-hl-sub">
                            {[r.car, r.method].filter(Boolean).join(' · ')}
                            <br />
                            {fmtDate(r.published_at || r.created_at)} 작성
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 계약 케어 */}
              {contracts && contracts.length > 0 && (
                <div className="rt-my-sect">
                  <div className="rt-my-sect-head"><h2 className="rt-my-sect-t">계약 케어</h2></div>
                  <div className="rt-hl">
                    {contracts.map((c) => (
                      <div className="rt-hl-card" key={c.id}>
                        <div className="rt-hl-top">
                          <span className="rt-hl-name">{c.car_name ?? c.car_slug ?? '계약'}</span>
                          {c.status && <span className={'rt-hl-badge ' + badgeKind(c.status)}>{c.status}</span>}
                        </div>
                        <div className="rt-hl-meta">
                          <span className="rt-hl-sub">
                            {[c.contract_type ? (CONTRACT_TYPE_LABEL[c.contract_type] ?? c.contract_type) : null, c.term_months ? `${c.term_months}개월` : null].filter(Boolean).join(' · ')}
                            {c.contract_start_date && (<><br />{fmtDate(c.contract_start_date)}{c.contract_end_date ? ` ~ ${fmtDate(c.contract_end_date)}` : ''}</>)}
                          </span>
                          {c.monthly_payment != null && (
                            <span className="rt-hl-price"><b>{c.monthly_payment.toLocaleString()}</b><span>원 / 월</span></span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 내 메뉴 */}
              <div className="rt-my-sect">
                <div className="rt-my-sect-head">
                  <h2 className="rt-my-sect-t">내 메뉴</h2>
                </div>
                <div className="rt-my-menu">
                  <button className="rt-my-mrow" type="button" onClick={() => setSheetOpen(true)}>
                    <span className="rt-my-mrow-ic">
                      <Icon name="chat" />
                    </span>
                    <span className="rt-my-mrow-l">상담 신청</span>
                    <span className="rt-my-mrow-chev">
                      <Icon name="chev" />
                    </span>
                  </button>
                  <Link className="rt-my-mrow" href="/reviews-write-preview">
                    <span className="rt-my-mrow-ic">
                      <Icon name="write" />
                    </span>
                    <span className="rt-my-mrow-l">후기 작성</span>
                    <span className="rt-my-mrow-chev">
                      <Icon name="chev" />
                    </span>
                  </Link>
                  <Link className="rt-my-mrow" href="/reviews-preview">
                    <span className="rt-my-mrow-ic">
                      <Icon name="write" />
                    </span>
                    <span className="rt-my-mrow-l">내 후기</span>
                    {data.reviews.length > 0 && <span className="rt-my-mrow-meta">{data.reviews.length}건</span>}
                    <span className="rt-my-mrow-chev">
                      <Icon name="chev" />
                    </span>
                  </Link>
                </div>
                {/* 계약케어·내차고는 별도 프로토타입(contract-care.jsx·garage-app.jsx) — 이번 범위 제외 */}
              </div>

              {/* 디자인 복원: 렌트 가이드(정적 4링크 → /info) */}
              <div className="rt-my-sect">
                <div className="rt-my-sect-head">
                  <h2 className="rt-my-sect-t">렌트 가이드</h2>
                  <Link className="rt-my-sect-more" href="/info">전체 보기</Link>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {([
                    ['기초', '장기렌트 vs 리스, 뭐가 어떻게 다를까?', '3분'],
                    ['비용', '월 렌트료에 포함되는 것과 아닌 것', '4분'],
                    ['절세', '개인사업자 렌트 비용처리 완벽 정리', '5분'],
                    ['반납', '만기 시 인수·반납·재계약 선택 가이드', '3분'],
                  ] as [string, string, string][]).map(([tag, title, read]) => (
                    <Link key={title} href="/info" style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '12px 14px', border: '1px solid #e8eaee', borderRadius: 14, background: '#fff', textDecoration: 'none' }}>
                      <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 800, color: '#B07A2E', background: 'rgba(201,168,76,0.12)', borderRadius: 8, padding: '4px 8px' }}>{tag}</span>
                      <span style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 700, color: '#0D1B2A', lineHeight: 1.35 }}>{title}</span>
                        <span style={{ fontSize: 11.5, color: '#9ca3af' }}>읽는 데 {read}</span>
                      </span>
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#c4c8cf" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                    </Link>
                  ))}
                </div>
              </div>

              {/* 고객센터 */}
              <a className="rt-my-cs" href="tel:16667000">
                <span className="rt-my-cs-ic">
                  <Icon name="phone" />
                </span>
                <span className="rt-my-cs-main">
                  <span className="rt-my-cs-l">고객센터</span>
                  <span className="rt-my-cs-num">1666-7000</span>
                  <span className="rt-my-cs-hours">평일 09:00–18:00 · 주말·공휴일 휴무</span>
                </span>
                <span className="rt-my-cs-chev">
                  <Icon name="chev" />
                </span>
              </a>

              {/* ④ 로그아웃 */}
              <div className="rt-my-logout">
                <button type="button" onClick={handleLogout}>
                  로그아웃
                </button>
              </div>
            </>
          )}

          <div style={{ height: 18 }} />
          <RtTabBar active="mypage" />
        </div>
      </div>

      <RtConsultSheet open={sheetOpen} onClose={() => setSheetOpen(false)} car={null} accent={ACCENT} onSubmitted={() => setToast('상담 신청이 접수되었어요. 곧 연락드릴게요.')} />
      {toast && <div className="rt-my-toast">{toast}</div>}
    </div>
  );
}
