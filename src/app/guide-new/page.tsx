'use client';
// /guide-new — 렌트 가이드북 (체계적 입문→심화 커리큘럼)
// 원본: _design_ref/guide-app.jsx — 기존 운영 /guide(구 디자인)는 미수정, 컷오버는 메인 판단.
// 적응 메모:
//  - window.infoFindArticle(INFO 시드) 의존 → 커리큘럼 레슨 메타(GUIDE_LESSONS)를 모듈 내 시드로 인라인.
//    (운영 info_articles 의 id 체계와 프로토타입 id(first-7 등)가 달라 라이브 API 연결은 보류 — 작업 보고 갭 참조)
//  - 진도 localStorage 는 SSR 안전하게 useEffect 로드.
//  - 레슨/이어보기 링크 정보 상세.html?id=X → /info/{X}.
//  - 디바이스 토글·tweaks-panel·전역리셋은 제외(프로토타입 전용).
import React, { useEffect, useMemo, useState } from 'react';
import { RtTopNav, RtTabBar, RtFooter } from '@/components/rentailor/RtChrome';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import './guide.css';

const ACCENT = '#C9A84C';

// ── 레슨 메타 시드 (원본 INFO_ARTICLES 에서 커리큘럼 대상만 추출) ──
interface Lesson {
  id: string;
  title: string;
  tag: string;
  read: string;
  access?: 'member';
}
const GUIDE_LESSONS: Record<string, Lesson> = {
  'first-7': { id: 'first-7', title: '장기렌트 처음이라면? 계약 전 꼭 알아야 할 7가지', tag: '에디터 추천', read: '8분' },
  deposit: { id: 'deposit', title: '보증금·선납금, 어떻게 정해야 월납이 줄어들까', tag: '장기렌트 기초', read: '5분' },
  term: { id: 'term', title: '계약 기간 36 · 48 · 60개월, 뭐가 유리할까', tag: '장기렌트 기초', read: '4분' },
  mileage: { id: 'mileage', title: '주행거리 약정 초과하면 어떻게 되나요', tag: '장기렌트 기초', read: '3분' },
  included: { id: 'included', title: '월 렌트료에 포함되는 것과 아닌 것', tag: '비용·세금', read: '4분' },
  'lease-vs': { id: 'lease-vs', title: '오토리스 vs 장기렌트, 핵심 차이 한 번에 정리', tag: '리스·할부', read: '6분' },
  'loan-hidden': { id: 'loan-hidden', title: '할부로 살 때 놓치기 쉬운 숨은 비용들', tag: '리스·할부', read: '5분' },
  accident: { id: 'accident', title: '사고가 나면? 렌트 차량 보험 처리 절차', tag: '비용·세금', read: '5분' },
  penalty: { id: 'penalty', title: '중도 해지 위약금, 계약 전에 계산하는 법', tag: '신차·트렌드', read: '5분' },
  'corp-tax': { id: 'corp-tax', title: '법인 차량 비용처리, 왜 렌트가 유리할까', tag: '비용·세금', read: '7분' },
  'ev-charge': { id: 'ev-charge', title: '전기차 장기렌트, 충전·보조금 총정리', tag: '전기차', read: '6분' },
  'ev-hybrid': { id: 'ev-hybrid', title: '전기차 vs 하이브리드, 나에게 맞는 선택은', tag: '전기차', read: '5분' },
  'trend-2026': { id: 'trend-2026', title: '2026 인기 차종 월 렌트료 한눈에 보기', tag: '신차·트렌드', read: '4분' },
};

interface GuideLevel {
  key: string;
  lvl: number;
  name: string;
  tag: string;
  icon: string;
  desc: string;
  lessons: string[];
}
const GUIDE_LEVELS: GuideLevel[] = [
  { key: 'intro', lvl: 1, name: '입문', tag: 'LEVEL 1', icon: '1', desc: '장기렌트가 처음이라면 여기서부터. 구조와 용어를 잡아요.', lessons: ['first-7', 'deposit', 'term', 'mileage', 'included'] },
  { key: 'practice', lvl: 2, name: '실전', tag: 'LEVEL 2', icon: '2', desc: '리스·할부와 비교하고, 계약·사고·해지까지 실제 상황에 대비해요.', lessons: ['lease-vs', 'loan-hidden', 'accident', 'penalty'] },
  { key: 'advanced', lvl: 3, name: '심화', tag: 'LEVEL 3', icon: '3', desc: '법인 절세·전기차·신차 트렌드까지. 더 똑똑하게 타는 법.', lessons: ['corp-tax', 'ev-charge', 'ev-hybrid', 'trend-2026'] },
];

const GUIDE_KEY = 'rt-guide-progress';
function guideLoad(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const r = JSON.parse(localStorage.getItem(GUIDE_KEY) || '[]');
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}
function readMinutes(read: string): number {
  const m = (read || '').match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 4;
}

function IcCheck({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      {filled && <path d="M8 12l3 3 5-6" stroke="#0D1B2A" strokeWidth="2.4" />}
    </svg>
  );
}

export default function GuideNewPage() {
  const levels = useMemo(
    () =>
      GUIDE_LEVELS.map((L) => ({
        ...L,
        items: L.lessons.map((id) => GUIDE_LESSONS[id]).filter(Boolean) as Lesson[],
      })),
    []
  );
  const allLessons = useMemo(() => levels.flatMap((L) => L.items), [levels]);
  const totalMin = useMemo(() => allLessons.reduce((s, a) => s + readMinutes(a.read), 0), [allLessons]);

  const [done, setDone] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [sheet, setSheet] = useState(false);
  useEffect(() => {
    setDone(guideLoad());
    setLoaded(true);
  }, []);
  useEffect(() => {
    if (loaded) localStorage.setItem(GUIDE_KEY, JSON.stringify(done));
  }, [done, loaded]);

  const isDone = (id: string) => done.indexOf(id) !== -1;
  const toggle = (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setDone((p) => (p.indexOf(id) !== -1 ? p.filter((x) => x !== id) : [id].concat(p)));
  };

  const completed = allLessons.filter((a) => isDone(a.id)).length;
  const totalN = allLessons.length;
  const pct = totalN ? Math.round((completed / totalN) * 100) : 0;
  const next = allLessons.find((a) => !isDone(a.id));
  const remainMin = allLessons.filter((a) => !isDone(a.id)).reduce((s, a) => s + readMinutes(a.read), 0);

  const R = 26;
  const C = 2 * Math.PI * R;
  const off = C * (1 - pct / 100);

  return (
    <div className="rt-root" data-rt="guide-new" style={{ '--rt-accent': ACCENT } as React.CSSProperties}>
      <div className="rt-page" data-page="guide" id="top">
        <div className="rt-scroll">
          <RtTopNav title="렌트 가이드북" backHref="/info" />

          {/* 히어로 + 진도 */}
          <div className="rt-ghero">
            <p className="rt-ghero-eyebrow">장기렌트 가이드북</p>
            <h1 className="rt-ghero-h">처음이라면, 순서대로 읽으면 끝나요</h1>
            <p className="rt-ghero-sub">기초부터 절세·전기차 심화까지 {totalN}개 챕터를 단계별로 정리했어요.</p>
            <div className="rt-gprog">
              <div className="rt-gring">
                <svg width="62" height="62" viewBox="0 0 62 62">
                  <circle className="rt-gring-track" cx="31" cy="31" r={R} fill="none" strokeWidth="6" />
                  <circle className="rt-gring-fill" cx="31" cy="31" r={R} fill="none" strokeWidth="6" strokeDasharray={C} strokeDashoffset={off} />
                </svg>
                <span className="rt-gring-pct">{pct}%</span>
              </div>
              <div className="rt-gprog-info">
                <div className="rt-gprog-l">
                  <b>{completed}</b> / {totalN}챕터 완료
                </div>
                <div className="rt-gprog-bar">
                  <i style={{ width: pct + '%' }}></i>
                </div>
                <div className="rt-gprog-meta">{completed === totalN ? '🎉 모든 챕터를 완주했어요!' : '남은 챕터 약 ' + remainMin + '분 · 전체 약 ' + totalMin + '분'}</div>
              </div>
            </div>
          </div>

          {/* 이어보기 */}
          {next && (
            <div className="rt-gcont">
              <a className="rt-gcont-card" href={'/info/' + next.id}>
                <span className="rt-gcont-ic">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </span>
                <div className="rt-gcont-body">
                  <div className="rt-gcont-k">{completed === 0 ? '여기서 시작하기' : '이어서 읽기'}</div>
                  <div className="rt-gcont-t">{next.title}</div>
                  <div className="rt-gcont-m">
                    {next.tag} · {next.read}
                  </div>
                </div>
                <span className="rt-gcont-arrow">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </span>
              </a>
            </div>
          )}

          {/* 레벨 섹션 */}
          {levels.map((L) => {
            const lvDone = L.items.filter((a) => isDone(a.id)).length;
            const lvMin = L.items.reduce((s, a) => s + readMinutes(a.read), 0);
            const complete = lvDone === L.items.length && L.items.length > 0;
            return (
              <div key={L.key} className={'rt-glevel rt-glevel-' + L.lvl + (complete ? ' is-complete' : '')}>
                <div className="rt-glevel-head">
                  <span className="rt-glevel-badge">{L.icon}</span>
                  <div className="rt-glevel-tt">
                    <div className="rt-glevel-name">
                      {L.name}
                      <span className="rt-glevel-tag">{L.tag}</span>
                    </div>
                    <div className="rt-glevel-desc">{L.desc}</div>
                    <div className="rt-glevel-meta">
                      <b>
                        {lvDone}/{L.items.length}
                      </b>{' '}
                      완료 · 약 {lvMin}분
                    </div>
                  </div>
                </div>
                <div className="rt-glist">
                  {L.items.map((a, i) => {
                    const d = isDone(a.id);
                    const member = a.access === 'member';
                    return (
                      <a key={a.id} className={'rt-glesson' + (d ? ' done' : '')} href={'/info/' + a.id}>
                        <span className="rt-gnum">
                          {d ? (
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          ) : (
                            i + 1
                          )}
                        </span>
                        <div className="rt-gl-body">
                          <div className="rt-gl-t">{a.title}</div>
                          <div className="rt-gl-m">
                            <span className="rt-gl-tag">{a.tag}</span>
                            <span className="dot"></span>
                            {a.read}
                            {member && (
                              <>
                                <span className="dot"></span>
                                <span className="rt-gl-lock">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                                    <rect x="5" y="11" width="14" height="9" rx="2" />
                                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                                  </svg>
                                  회원
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                        <button className="rt-gl-check" onClick={(e) => toggle(a.id, e)} aria-label={d ? '완료 해제' : '완료 표시'}>
                          <IcCheck filled={d} />
                        </button>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* 마무리 CTA */}
          <div className="rt-gend">
            <div className="rt-gend-h">{pct === 100 ? '이제 내 조건으로 견적을 받아볼 차례예요' : '읽다가 궁금하면, 바로 물어보세요'}</div>
            <div className="rt-gend-d">전담 매니저가 차종·금융·계약 조건까지 1:1로 맞춰드려요. 가이드에서 배운 그대로요.</div>
            <button className="rt-gend-btn" onClick={() => setSheet(true)}>
              무료 맞춤 상담받기
            </button>
          </div>

          <RtFooter />
        </div>
        <RtTabBar active="info" />
      </div>
      <RtConsultSheet open={sheet} onClose={() => setSheet(false)} car={null} priceLabel="가이드북 상담" accent={ACCENT} />
    </div>
  );
}
