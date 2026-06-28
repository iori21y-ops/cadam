'use client';

// 정보 가이드(렌트 매거진) 목록 — 리뉴얼 미리보기
// 원본: _design_ref/info-app.jsx (window 전역 → 모듈, image-slot → hue 플레이스홀더,
//   RtMarketInsight 제외(데이터 소스 부재), tweaks/device/personalize 제외)
// 데이터: fetch('/api/info-articles') → { articles: [...] } → normalizeArticle
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { RtTopNav, RtTabBar } from '@/components/rentailor/RtChrome';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import { rtMemberLocked, rtIsMemberOnly, rtMarkConsulted } from '@/lib/rentailor/guest-adapter';
import { Button } from '@/components/ui/Button';
import {
  INFO_CATS,
  INFO_FORMATS,
  normalizeArticle,
  tagLabel,
  readLabel,
  CONTRACT_DIR_SEED,
  type Article,
  type RawArticle,
} from './info-data';
import './info.css';

const ACCENT = '#C9A84C';

interface InfoApiResponse {
  articles?: RawArticle[];
}

// 카드/행 외곽 — hue 변수만(box-shadow·그라데이션 상속용)
const hueStyle = (a: Article): React.CSSProperties => ({ '--hue': a.hue } as React.CSSProperties);
// 미디어 영역 — hue + (썸네일 있으면) 배경 이미지
function mediaStyle(a: Article): React.CSSProperties {
  const s: Record<string, string | number> = { '--hue': a.hue };
  if (a.thumbnailUrl) s.backgroundImage = `url("${a.thumbnailUrl}")`;
  return s as React.CSSProperties;
}
const mediaClass = (a: Article, base: string) => base + (a.thumbnailUrl ? ' rt-media-img' : '');

function LockIcon({ size = 11 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2.5" />
      <path d="M8 10V6a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

// ── 계약 관리 허브 — 빈입력 가상계산기 + 캐피탈 디렉토리 ──
function CcgCalc() {
  const [mode, setMode] = useState<'early' | 'excess'>('early');
  const [monthly, setMonthly] = useState<number | ''>(79);
  const [remain, setRemain] = useState<number | ''>(24);
  const [pen, setPen] = useState<number | ''>(30);
  const [annual, setAnnual] = useState<number | ''>(20000);
  const [expect, setExpect] = useState<number | ''>(24000);
  const [years, setYears] = useState<number | ''>(4);
  const [rate, setRate] = useState<number | ''>(110);

  const v = (x: number | '') => (typeof x === 'number' ? x : 0);
  const earlyFee = Math.round((v(monthly) * v(remain) * v(pen)) / 100);
  const over = Math.max(0, (v(expect) - v(annual)) * v(years));
  const excessFee = Math.round((over * v(rate)) / 10000);
  const onNum = (set: (n: number | '') => void) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(e.target.value === '' ? '' : Number(e.target.value));

  return (
    <div className="rt-ccg-calc">
      <div className="rt-ccg-seg">
        <button className={mode === 'early' ? 'is-on' : ''} onClick={() => setMode('early')}>중도상환 수수료</button>
        <button className={mode === 'excess' ? 'is-on' : ''} onClick={() => setMode('excess')}>초과운행료</button>
      </div>
      <div className="rt-ccg-res">
        <span className="rt-ccg-res-cap">예상 {mode === 'early' ? '위약금' : '초과운행료'}</span>
        <span className="rt-ccg-res-v"><b>{(mode === 'early' ? earlyFee : excessFee).toLocaleString()}</b>만원</span>
        {mode === 'excess' && (
          <span className="rt-ccg-res-sub">
            {over > 0 ? `초과 ${over.toLocaleString()}km · km당 ${v(rate).toLocaleString()}원` : '약정 이내 · 추가요금 없음'}
          </span>
        )}
      </div>
      <div className="rt-ccg-fields">
        {mode === 'early' ? (
          <>
            <label className="rt-ccg-field"><span>월 렌트료(만원)</span><input type="number" value={monthly} onChange={onNum(setMonthly)} /></label>
            <label className="rt-ccg-field"><span>잔여 개월</span><input type="number" value={remain} onChange={onNum(setRemain)} /></label>
            <label className="rt-ccg-field"><span>위약금율(%)</span><input type="number" value={pen} onChange={onNum(setPen)} /></label>
          </>
        ) : (
          <>
            <label className="rt-ccg-field"><span>약정 연주행(km)</span><input type="number" step="1000" value={annual} onChange={onNum(setAnnual)} /></label>
            <label className="rt-ccg-field"><span>예상 연주행(km)</span><input type="number" step="1000" value={expect} onChange={onNum(setExpect)} /></label>
            <label className="rt-ccg-field"><span>남은 연수</span><input type="number" value={years} onChange={onNum(setYears)} /></label>
            <label className="rt-ccg-field"><span>km당 단가(원)</span><input type="number" step="10" value={rate} onChange={onNum(setRate)} /></label>
          </>
        )}
      </div>
      <p className="rt-ccg-note">
        대략적인 가상계산이에요. 정확한 금액·기준은 캐피탈/리스사·계약서로 확인하세요. 계약 중이라면{' '}
        <Link href="/mypage-preview">마이페이지 › 계약 케어</Link>에서 내 계약값으로 자동 계산돼요.
      </p>
    </div>
  );
}

function ContractCareHub() {
  return (
    <section className="rt-ccg">
      <div className="rt-ccg-hd">
        <p className="rt-ccg-eyebrow">계약 관리</p>
        <h2 className="rt-ccg-title">계약 중·만기에 챙길 것</h2>
        <p className="rt-ccg-desc">중도상환·초과운행료를 미리 계산하고, 캐피탈 고객센터·서류 발급 방법을 한곳에서 확인하세요.</p>
      </div>
      <CcgCalc />
      <div className="rt-ccg-dir">
        <div className="rt-ccg-dir-t">캐피탈·리스사 연락처 · 서류 발급</div>
        {CONTRACT_DIR_SEED.map((c) => (
          <div className="rt-ccg-cap" key={c.id}>
            <div className="rt-ccg-cap-top">
              <span className="rt-ccg-cap-n">{c.name}</span>
              <a className="rt-ccg-call" href={'tel:' + c.cs.replace(/[^0-9]/g, '')}>{c.cs}</a>
            </div>
            <div className="rt-ccg-cap-h">{c.hours} · 사고접수 {c.accident}</div>
            <div className="rt-ccg-iss">
              {Object.entries(c.issues).map(([k, val]) => (
                <div className="rt-ccg-iss-row" key={k}><b>{k}</b><span>{val}</span></div>
              ))}
            </div>
          </div>
        ))}
        <p className="rt-ccg-note">연락처·발급 방법은 캐피탈 정책에 따라 변경될 수 있어요. 최신 정보는 각 사 홈페이지를 확인하세요.</p>
      </div>
    </section>
  );
}

export default function InfoPreviewPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [cat, setCat] = useState('all');
  const [fmt, setFmt] = useState('all');
  const [lockSheet, setLockSheet] = useState(false);
  const consultedRef = useRef(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch('/api/info-articles');
        const json: InfoApiResponse = await res.json();
        const list = Array.isArray(json.articles) ? json.articles.map(normalizeArticle) : [];
        if (alive) setArticles(list);
      } catch {
        if (alive) setArticles([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const matched = useMemo(
    () =>
      articles.filter(
        (a) => (cat === 'all' || a.category === cat) && (fmt === 'all' || a.contentType === fmt)
      ),
    [articles, cat, fmt]
  );
  const clips = matched.filter((a) => a.contentType === 'clip');
  const showRail = fmt === 'all' || fmt === 'clip';
  const list = showRail ? matched.filter((a) => a.contentType !== 'clip') : matched;

  // 에디터 추천 레일 — 무료 아티클/카드 우선(최신순), 최대 4개
  const featured = useMemo(
    () => articles.filter((a) => a.contentType !== 'clip').slice(0, 4),
    [articles]
  );

  const guard = (art: Article) => (e: React.MouseEvent) => {
    if (rtMemberLocked(art)) {
      e.preventDefault();
      setLockSheet(true);
    }
  };
  const LockBadge = ({ art }: { art: Article }) =>
    rtIsMemberOnly(art) ? (
      <span className="rt-lock-badge"><LockIcon />회원 전용</span>
    ) : null;

  return (
    <div data-rt="info-preview" className="rt-root">
      <div className="rt-page" id="top">
        <RtTopNav title="렌트 가이드" />

        <div className="rt-info-head">
          <p className="rt-info-eyebrow">렌트 가이드</p>
          <h1 className="rt-info-title">알고 타면<br />매달 더 아껴요</h1>
          <p className="rt-info-desc">장기렌트가 처음이어도 괜찮아요. 계약 전 꼭 알아야 할 정보를 쉽게 풀어드려요.</p>
        </div>

        {featured.length > 0 && (
          <div className="rt-feat-rail">
            {featured.map((f) => (
              <Link className="rt-feat-card" key={f.id} href={`/info-preview/${f.id}`} onClick={guard(f)} style={hueStyle(f)}>
                <div className={mediaClass(f, 'rt-feat-media')} style={mediaStyle(f)}>
                  <LockBadge art={f} />
                  <span className="rt-feat-tag">에디터 추천</span>
                </div>
                <div className="rt-feat-body">
                  <div className="rt-feat-title">{f.title}</div>
                  {f.excerpt && <div className="rt-feat-desc">{f.excerpt}</div>}
                  <div className="rt-feat-meta"><b>Rentailor 매거진</b><i></i><span>{readLabel(f) || '가이드'}</span></div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <div className="rt-info-formats">
          {INFO_FORMATS.map((f) => (
            <button key={f.key} className={'rt-info-format' + (f.key === fmt ? ' is-on' : '')} onClick={() => setFmt(f.key)}>
              {f.key === 'clip' && <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
              {f.key === 'card' && (
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="3" y="5" width="13" height="15" rx="2" /><path d="M19 8v11a2 2 0 0 1-2 2H8" /></svg>
              )}
              {f.label}
            </button>
          ))}
        </div>

        {showRail && clips.length > 0 && (
          <div className="rt-clip-rail">
            {clips.map((c) => (
              <Link className="rt-clip" key={c.id} href={`/info-preview/${c.id}`} onClick={guard(c)} style={hueStyle(c)}>
                <div className={mediaClass(c, 'rt-clip-media')} style={mediaStyle(c)}>
                  <LockBadge art={c} />
                  <span className="rt-clip-play"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z" /></svg></span>
                  {c.duration && <span className="rt-clip-dur">{c.duration}</span>}
                </div>
                <div className="rt-clip-title">{c.title}</div>
              </Link>
            ))}
          </div>
        )}

        <div className="rt-info-cats">
          {INFO_CATS.map((c) => (
            <button key={c.key} className={'rt-info-cat' + (c.key === cat ? ' is-on' : '')} onClick={() => setCat(c.key)}>{c.label}</button>
          ))}
        </div>

        {cat === 'contract' && <ContractCareHub />}

        <div className="rt-arts">
          {loading && <p className="rt-info-empty">불러오는 중…</p>}
          {!loading && list.length === 0 && <p className="rt-info-empty">해당 형태의 콘텐츠가 아직 없어요.</p>}
          {list.map((a) => {
            const isCard = a.contentType === 'card';
            return (
              <Link className={'rt-art' + (isCard ? ' is-card' : '')} key={a.id} href={`/info-preview/${a.id}`} onClick={guard(a)} style={hueStyle(a)}>
                <div className={mediaClass(a, 'rt-art-thumb')} style={mediaStyle(a)}>
                  <LockBadge art={a} />
                  {isCard && a.cards && (
                    <span className="rt-art-cardbadge">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.4"><rect x="3" y="5" width="13" height="15" rx="2" /><path d="M19 8v11a2 2 0 0 1-2 2H8" /></svg>
                      {a.cards.length}장
                    </span>
                  )}
                </div>
                <div className="rt-art-main">
                  <div className="rt-art-tag">{tagLabel(a)}</div>
                  <div className="rt-art-title">{a.title}</div>
                  <div className="rt-art-meta">Rentailor 매거진{readLabel(a) ? ` · ${readLabel(a)}${isCard ? '' : ' 읽기'}` : ''}</div>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="rt-info-cta">
          <p className="rt-info-cta-t">읽어봤다면, 이제 내 차 차례예요</p>
          <p className="rt-info-cta-d">AI 진단으로 30초 만에 나에게 맞는 차를 찾아보세요. 가입·전화번호 없이 바로 확인할 수 있어요.</p>
          <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={() => { window.location.href = '/diagnosis'; }}>AI 진단 시작하기</Button>
        </div>

        <RtTabBar active="info" />
      </div>

      <RtConsultSheet
        open={lockSheet}
        accent={ACCENT}
        onSubmitted={() => { rtMarkConsulted(); consultedRef.current = true; }}
        onClose={() => { setLockSheet(false); if (consultedRef.current && typeof window !== 'undefined') window.location.reload(); }}
      />
    </div>
  );
}
