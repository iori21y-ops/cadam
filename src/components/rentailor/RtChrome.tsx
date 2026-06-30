'use client';
// RtChrome.tsx — 목록/상세 공통 크롬 (상단 네비 · 검색 오버레이 · 푸터 · 하단 탭바)
// 원본: _design_ref/chrome.jsx
// 제외(프로토타입 전용): useRtDevice/RtControlBar(디바이스 토글), RtBookingSheet(보류된 /booking),
//   rt-visibility 자동주입, CDS.LogoAnimated/RtPersonalizeIcon, <image-slot>.
// 링크는 .html → 실 라우트(next/link) 로 적응(임시 — §14.1 라우팅 확정 시 재조정).
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { RT_CATALOG } from '@/lib/rentailor/catalog';
import { carImageUrl } from '@/lib/car-image-url';
import { RtPersonalizeIcon } from '@/lib/rentailor/personalize';
import { LogoAnimated } from '@/components/icons/LogoAnimated';
import { HomeIcon as HomeOutline, SparklesIcon as SparklesOutline, MagnifyingGlassIcon as SearchOutline, NewspaperIcon as NewspaperOutline, UserIcon as UserOutline } from "@heroicons/react/24/outline";
import { HomeIcon as HomeSolid, SparklesIcon as SparklesSolid, MagnifyingGlassIcon as SearchSolid, NewspaperIcon as NewspaperSolid, UserIcon as UserSolid } from "@heroicons/react/24/solid";

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

  const Thumb = ({ hue, imageKey }: { hue: number; imageKey?: string }) => (
    <div className="rt-search-thumb" style={{ background: '#fff', color: 'hsl(' + hue + ' 38% 42%)' }}>
      <svg viewBox="0 0 48 24" width="34" height="17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 16l2.6-6.4A3 3 0 0 1 10.4 8h17.2a3 3 0 0 1 2.5 1.3L34 15l7 1.4a2 2 0 0 1 1.6 2V16" />
        <path d="M3 16h40v3H3z" />
        <circle cx="13" cy="19" r="2.4" />
        <circle cx="33" cy="19" r="2.4" />
      </svg>
      {imageKey && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={carImageUrl(imageKey)}
          alt=""
          loading="lazy"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '3px' }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      )}
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
                  <Thumb hue={c.hue} imageKey={c.imageKey} />
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

// ── 차량 탭 아이콘 (lucide car 측면, outline/solid 2벌) ───────
function CarOutline(props: any) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
      <circle cx="7" cy="17" r="2" />
      <path d="M9 17h6" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}
function CarSolid(props: any) {
  // solid는 stroke 무시, fill로 표현. props의 stroke/strokeWidth는 흘려보냄.
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props} stroke="none">
      <path d="M5 6.2c-.65 0-1.2.4-1.45.95L2.1 10.1A4 4 0 0 0 1.6 12v4.2c0 .55.45 1 1 1h.7a2.7 2.7 0 0 1 5.4 0h6.6a2.7 2.7 0 0 1 5.4 0h.7c.55 0 1-.45 1-1V13c0-1-.75-1.85-1.7-2.05-2.05-.45-4.3-.95-4.3-.95s-1.3-1.4-2.2-2.3a2.6 2.6 0 0 0-1.85-.75H5z" />
      <circle cx="7" cy="17.3" r="2" />
      <circle cx="17" cy="17.3" r="2" />
      <circle cx="7" cy="17.3" r=".8" fill="#fff" />
      <circle cx="17" cy="17.3" r=".8" fill="#fff" />
    </svg>
  );
}

// ── 하단 글로벌 탭바 (GNB) ───────────────────────────────────
type TabKey = 'home' | 'cars' | 'diag' | 'info' | 'event' | 'mypage' | 'search';
function RtTabIcon({ name, on }: { name: TabKey; on: boolean }) {
  const color = on ? "var(--rt-accent, #C9A84C)" : "#1a1a1a";
  const cls = "rt-tabicon-svg";
  const map: Record<TabKey, { O: any; S: any }> = {
    home:   { O: HomeOutline,     S: HomeSolid },
    diag:   { O: SparklesOutline, S: SparklesSolid },
    search: { O: SearchOutline,   S: SearchSolid },
    info:   { O: NewspaperOutline,S: NewspaperSolid },
    mypage: { O: UserOutline,     S: UserSolid },
    cars:   { O: CarOutline,      S: CarSolid },
    event:  { O: SparklesOutline, S: SparklesSolid },
  };
  const Cmp = on ? map[name].S : map[name].O;
  return <Cmp width={25} height={25} style={{ color }} strokeWidth={on ? undefined : 1.8} aria-hidden />;
}

export interface RtTabBarProps {
  active?: TabKey;
}
export function RtTabBar({ active }: RtTabBarProps) {
  // 차량찾기 탭은 라우팅 대신 전역 검색 오버레이를 띄움(상단 헤더 돋보기와 동일 동작).
  const [searchOpen, setSearchOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => { setSearchOpen(false); }, [pathname]);
  const tabs: Array<{ key: TabKey; label: string; href?: string; search?: boolean }> = [
    { key: 'home', label: '홈', href: '/' },
    { key: 'diag', label: 'AI진단', href: '/diagnosis' },
    { key: 'cars', label: '차량', href: '/popular-estimates' },
    { key: 'info', label: '정보', href: '/info' },
    { key: 'mypage', label: '마이', href: '/mypage' },
  ];
  return (
    <>
      <div className="rt-tabbar-filler" aria-hidden="true"></div>
      <nav className="rt-tabbar">
        {tabs.map((t) =>
          t.search ? (
            <button
              key={t.key}
              type="button"
              className={'rt-tab' + (searchOpen ? ' is-on' : '')}
              onClick={() => setSearchOpen(true)}
              aria-label="차량찾기"
            >
              <span className="rt-tab-ic">
                <RtTabIcon name={t.key} on={searchOpen} />
              </span>
              {t.label}
            </button>
          ) : (
            <Link key={t.key} className={'rt-tab' + (t.key === active && !searchOpen ? ' is-on' : '')} href={t.href!} onClick={() => setSearchOpen(false)}>
              <span className="rt-tab-ic">
                <RtTabIcon name={t.key} on={t.key === active && !searchOpen} />
              </span>
              {t.label}
            </Link>
          )
        )}
      </nav>
      <RtSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
