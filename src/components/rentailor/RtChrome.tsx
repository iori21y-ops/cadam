'use client';
// RtChrome.tsx — 목록/상세 공통 크롬 (상단 네비 · 검색 오버레이 · 푸터 · 하단 탭바)
// 원본: _design_ref/chrome.jsx
// 제외(프로토타입 전용): useRtDevice/RtControlBar(디바이스 토글), RtBookingSheet(보류된 /booking),
//   rt-visibility 자동주입, CDS.LogoAnimated/RtPersonalizeIcon, <image-slot>.
// 링크는 .html → 실 라우트(next/link) 로 적응(임시 — §14.1 라우팅 확정 시 재조정).
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { RT_CATALOG } from '@/lib/rentailor/catalog';
import { RtPersonalizeIcon } from '@/lib/rentailor/personalize';
import { LogoAnimated } from '@/components/icons/LogoAnimated';

// ── 상단 네비 ────────────────────────────────────────────────
export interface RtTopNavProps {
  title?: string;
  backHref?: string;
  onBack?: () => void;
  showSearch?: boolean;
}
export function RtTopNav({ title, backHref, onBack, showSearch = true }: RtTopNavProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <>
      <header className="rt-nav">
        <div className="rt-nav-inner">
          {(backHref || onBack) && (
            <a
              className="rt-nav-back"
              href={backHref || '#'}
              aria-label="뒤로"
              onClick={(e) => {
                if (onBack) {
                  e.preventDefault();
                  onBack();
                }
              }}
            >
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </a>
          )}
          {title ? (
            <span className="rt-nav-title">{title}</span>
          ) : (
            <Link className="rt-brand" href="/" aria-label="Rentailor 홈">
              <LogoAnimated size={28} />
            </Link>
          )}
          <span className="rt-nav-spacer"></span>
          <div className="rt-nav-icons" style={{ alignItems: 'center', gap: 8 }}>
            <RtPersonalizeIcon />
            {showSearch && (
              <button className="rt-nav-icon" onClick={() => setSearchOpen(true)} aria-label="검색">
                <svg viewBox="0 0 24 24" width="21" height="21" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.2-3.2" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>
      {showSearch && <RtSearch open={searchOpen} onClose={() => setSearchOpen(false)} />}
    </>
  );
}

// ── 검색 오버레이 (차종 검색) ──────────────────────
export interface RtSearchProps {
  open: boolean;
  onClose: () => void;
}
export function RtSearch({ open, onClose }: RtSearchProps) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQ('');
      const t = setTimeout(() => inputRef.current && inputRef.current.focus(), 90);
      return () => clearTimeout(t);
    }
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, onClose]);

  const cars = RT_CATALOG;
  const query = q.trim().toLowerCase();
  const clean = (m: string) => m.replace(/\s*\(.*\)/, '');
  const results = query
    ? cars.filter((c) => (c.brand + ' ' + c.model + ' ' + c.segLabel + ' ' + (c.fuel || '')).toLowerCase().includes(query))
    : [];
  const popular = cars.filter((c) => c.best).slice(0, 6);

  const Thumb = ({ hue }: { hue: number }) => (
    <div className="rt-search-thumb" style={{ background: 'hsl(' + hue + ' 42% 93%)', color: 'hsl(' + hue + ' 38% 42%)' }}>
      <svg viewBox="0 0 48 24" width="34" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 16l2.6-6.4A3 3 0 0 1 10.4 8h17.2a3 3 0 0 1 2.5 1.3L34 15l7 1.4a2 2 0 0 1 1.6 2V16" />
        <path d="M3 16h40v3H3z" />
        <circle cx="13" cy="19" r="2.4" />
        <circle cx="33" cy="19" r="2.4" />
      </svg>
    </div>
  );

  return (
    <div className={'rt-search' + (open ? ' is-open' : '')} role="dialog" aria-modal="true" aria-hidden={!open}>
      <div className="rt-search-bar">
        <div className="rt-search-field">
          <svg className="rt-search-mag" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.2-3.2" />
          </svg>
          <input ref={inputRef} className="rt-search-input" type="text" placeholder="차종 또는 브랜드로 검색" value={q} onChange={(e) => setQ(e.target.value)} />
          {q && (
            <button
              className="rt-search-clear"
              onClick={() => {
                setQ('');
                inputRef.current && inputRef.current.focus();
              }}
              aria-label="지우기"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>
        <button className="rt-search-cancel" onClick={onClose}>
          취소
        </button>
      </div>

      <div className="rt-search-body">
        {!query && (
          <div className="rt-search-sect">
            <p className="rt-search-sect-t">인기 차종</p>
            <div className="rt-search-chips">
              {popular.map((c) => (
                <button key={c.id} className="rt-search-chip" onClick={() => setQ(clean(c.model))}>
                  {clean(c.model)}
                </button>
              ))}
            </div>
          </div>
        )}
        {query && results.length === 0 && (
          <div className="rt-search-empty">
            <span className="rt-search-empty-q">‘{q}’</span>에 대한 검색 결과가 없어요
          </div>
        )}
        {results.length > 0 && (
          <>
            <p className="rt-search-count">검색 결과 {results.length}개</p>
            <div className="rt-search-results">
              {results.map((c) => (
                <Link key={c.id} className="rt-search-row" href={'/cars/' + c.id}>
                  <Thumb hue={c.hue} />
                  <div className="rt-search-row-meta">
                    <span className="rt-search-row-name">
                      {c.brand} {c.model}
                    </span>
                    <span className="rt-search-row-sub">{c.segLabel}</span>
                  </div>
                  <div className="rt-search-row-price">
                    <b>{c.from}</b>만원~
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── 푸터 ─────────────────────────────────────────────────────
export function RtFooter() {
  return (
    <footer className="rt-footer">
      <div className="rt-footer-row">
        <span className="rt-footer-brand">Rentailor</span>
        <div className="rt-footer-links">
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy">개인정보</Link>
        </div>
      </div>
      <span className="rt-footer-meta">(주)렌테일러 · 사업자등록 000-00-00000 · 고객센터 1666-7000 · © 2026</span>
    </footer>
  );
}

// ── 하단 글로벌 탭바 (GNB) ───────────────────────────────────
type TabKey = 'home' | 'cars' | 'diag' | 'info' | 'event' | 'mypage';
function RtTabIcon({ name, on }: { name: TabKey; on: boolean }) {
  const ink = on ? 'var(--rt-navy, #0D1B2A)' : '#aeb4bd';
  const gold = on ? 'var(--rt-accent, #C9A84C)' : '#ccd1d8';
  const P: Record<TabKey, React.ReactNode> = {
    home: (
      <>
        <path d="M3.5 11.4 L12 3.6 L20.5 11.4 V19.8 a1.1 1.1 0 0 1-1.1 1.1 H4.6 a1.1 1.1 0 0 1-1.1-1.1 Z" fill={ink} />
        <rect x="10" y="13.8" width="4" height="7.1" rx="0.9" fill={gold} />
      </>
    ),
    cars: (
      <>
        <path d="M3.3 13 L5 8.5 A2 2 0 0 1 6.9 7.1 H17.1 A2 2 0 0 1 19 8.5 L20.7 13 V16.4 A1.2 1.2 0 0 1 19.5 17.6 H4.5 A1.2 1.2 0 0 1 3.3 16.4 Z" fill={ink} />
        <path d="M6.7 12.2 L7.7 9.4 A1 1 0 0 1 8.6 8.7 H15.4 A1 1 0 0 1 16.3 9.4 L17.3 12.2 Z" fill={gold} />
        <circle cx="7.4" cy="17.4" r="1.7" fill={ink} />
        <circle cx="16.6" cy="17.4" r="1.7" fill={ink} />
      </>
    ),
    diag: (
      <>
        <path d="M12 3 L13.7 8.3 L19 10 L13.7 11.7 L12 17 L10.3 11.7 L5 10 L10.3 8.3 Z" fill={ink} />
        <path d="M18.6 3.6 L19.4 5.8 L21.6 6.6 L19.4 7.4 L18.6 9.6 L17.8 7.4 L15.6 6.6 L17.8 5.8 Z" fill={gold} />
      </>
    ),
    info: (
      <>
        <path d="M6 3.3 H13.3 L18.7 8.7 V19.6 A1.1 1.1 0 0 1 17.6 20.7 H6 A1.1 1.1 0 0 1 4.9 19.6 V4.4 A1.1 1.1 0 0 1 6 3.3 Z" fill={ink} />
        <path d="M13.4 3.5 L18.6 8.7 H14 A.6 .6 0 0 1 13.4 8.1 Z" fill={gold} />
        <rect x="7.8" y="12" width="7.6" height="1.7" rx="0.85" fill={gold} />
        <rect x="7.8" y="15.4" width="5" height="1.7" rx="0.85" fill={gold} />
      </>
    ),
    event: (
      <>
        <path d="M11.6 3.4 L20.6 12.4 A1.4 1.4 0 0 1 20.6 14.4 L14.4 20.6 A1.4 1.4 0 0 1 12.4 20.6 L3.4 11.6 A1.4 1.4 0 0 1 3 10.6 V4.4 A1.4 1.4 0 0 1 4.4 3 H10.6 A1.4 1.4 0 0 1 11.6 3.4 Z" fill={ink} />
        <circle cx="7.6" cy="7.6" r="1.8" fill={gold} />
      </>
    ),
    mypage: (
      <>
        <path d="M5 20.6 A7 7 0 0 1 19 20.6 V21 H5 Z" fill={ink} />
        <circle cx="12" cy="8" r="3.8" fill={gold} />
      </>
    ),
  };
  return (
    <svg viewBox="0 0 24 24" width="25" height="25">
      {P[name]}
    </svg>
  );
}

export interface RtTabBarProps {
  active?: TabKey;
}
export function RtTabBar({ active }: RtTabBarProps) {
  const tabs: Array<{ key: TabKey; label: string; href: string }> = [
    { key: 'home', label: '홈', href: '/' },
    { key: 'cars', label: '차량', href: '/popular-estimates' },
    { key: 'event', label: '특가', href: '/promotions' },
    { key: 'diag', label: 'AI진단', href: '/diagnosis' },
    { key: 'info', label: '정보', href: '/info' },
    { key: 'mypage', label: '마이', href: '/mypage' },
  ];
  return (
    <>
      <div className="rt-tabbar-filler" aria-hidden="true"></div>
      <nav className="rt-tabbar">
        {tabs.map((t) => (
          <Link key={t.key} className={'rt-tab' + (t.key === active ? ' is-on' : '')} href={t.href}>
            <span className="rt-tab-ic">
              <RtTabIcon name={t.key} on={t.key === active} />
            </span>
            {t.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
