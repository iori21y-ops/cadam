'use client';
// /clips — 클립(쇼츠) 몰입형 세로 피드
// 원본 프로토타입: _design_ref/clips-app.jsx
// 이식 메모:
//  - window.INFO_ARTICLES.filter(type==='clip') → 로컬 시드 CLIPS_SEED(7종, ./clips-data).
//    ⚠️ 갭: 라이브 /api/info-articles 의 clip 은 tips/lead 미제공 + 실 영상 소스 부재 →
//    디자인·카피 패리티를 위해 프로토타입 시드를 유지(image-slot → hue 그라데이션 플레이스홀더).
//  - RtConsultSheet → @/components/rentailor. 링크는 .html → 실 라우트(/info, /info/{id}).
//    ⚠️ 갭: 시드 클립 id(clip-*)는 info_articles 에 매칭 글이 없어 /info/{id} 는 현재 404
//    (CMS 클립 등록 시 해소). 뒤로가기 /info 는 정상.
//  - 제외: tweaks 패널 · 디바이스 토글(useTweaks/useRtDevice/RtControlBar/TweaksPanel).
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import { CLIP_CATS, CLIPS_SEED, type Clip } from './clips-data';
import './clips.css';

const ACCENT = '#C9A84C';

const IcChk = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5" /></svg>
);

// 저장 상태 (localStorage)
const CLIP_SAVE_KEY = 'rt-clip-saved';
function clipLoadSaved(): string[] {
  try {
    const r = JSON.parse(localStorage.getItem(CLIP_SAVE_KEY) || '[]');
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}

// ── 단일 쇼츠 카드 ──────────────────────────────────────────
interface ShortCardProps {
  clip: Clip;
  idx: number;
  total: number;
  playing: boolean;
  onPlayToggle: () => void;
  onSave: () => void;
  saved: boolean;
  onConsult: () => void;
  onDetail: () => void;
  showHint: boolean;
}
function ShortCard({ clip, idx, total, playing, onPlayToggle, onSave, saved, onConsult, onDetail, showHint }: ShortCardProps) {
  return (
    <div className={'rt-short' + (playing ? ' is-playing' : '')} data-id={clip.id} style={{ '--hue': clip.hue } as React.CSSProperties}>
      <div className="rt-short-bg"></div>
      <div className="rt-short-scrim"></div>

      {/* 상단 진행 틱 */}
      <div className="rt-short-ticks">
        {Array.from({ length: total }).map((_, i) => (
          <span key={i} className={'rt-short-tick' + (i < idx ? ' done' : i === idx ? ' cur' : '')}><i></i></span>
        ))}
      </div>

      {/* 중앙 재생 토글 */}
      <button className="rt-short-play" onClick={onPlayToggle} aria-label="재생">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
      </button>

      {/* 우측 액션 레일 */}
      <div className="rt-short-rail">
        <button className={'rt-rail-btn' + (saved ? ' on' : '')} onClick={onSave}>
          <span className="rt-rail-ic">
            <svg viewBox="0 0 24 24" fill={saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
          </span>
          {saved ? '저장됨' : '저장'}
        </button>
        <button className="rt-rail-btn" onClick={onDetail}>
          <span className="rt-rail-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
          </span>
          전문보기
        </button>
        <button className="rt-rail-btn" onClick={onConsult}>
          <span className="rt-rail-ic">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" /></svg>
          </span>
          상담
        </button>
      </div>

      {/* 하단 정보 */}
      <div className="rt-short-info">
        <span className="rt-short-cat">
          <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
          {clip.dur} · 쇼츠
        </span>
        <h2 className="rt-short-title">{clip.title}</h2>
        <p className="rt-short-lead">{clip.lead}</p>
        <div className="rt-short-tips">
          {clip.tips.slice(0, 3).map((t, i) => (
            <span className="rt-short-tip" key={i}><IcChk />{t}</span>
          ))}
        </div>
        <div className="rt-short-cta">
          <button className="gold" onClick={onConsult}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z" /></svg>
            맞춤 상담받기
          </button>
          <button className="ghost" onClick={onDetail}>전문 보기</button>
        </div>
      </div>

      {showHint && idx === 0 && (
        <div className="rt-short-hint">
          <span>위로 넘겨 다음 쇼츠</span>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7" /></svg>
        </div>
      )}
    </div>
  );
}

// ── 페이지 ──────────────────────────────────────────────────
function ClipsPage() {
  const all = CLIPS_SEED;
  const [cat, setCat] = useState('all');
  const clips = useMemo(() => all.filter((c) => cat === 'all' || c.cat === cat), [cat, all]);

  const feedRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [saved, setSaved] = useState<string[]>([]);
  const [sheet, setSheet] = useState(false);
  const [sheetClip, setSheetClip] = useState<Clip | null>(null);
  const [hint, setHint] = useState(true);

  // localStorage 저장 상태는 마운트 후 로드(SSR 안전)
  useEffect(() => { setSaved(clipLoadSaved()); }, []);

  // IntersectionObserver로 현재 보이는 쇼츠 추적
  useEffect(() => {
    const root = feedRef.current;
    if (!root) return;
    const cards = Array.from(root.querySelectorAll('.rt-short'));
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            const i = cards.indexOf(e.target);
            if (i !== -1) { setActive(i); setPlaying(true); }
          }
        });
      },
      { root, threshold: [0.6] }
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, [clips]);

  // 카테고리 변경 시 맨 위로
  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTo({ top: 0 });
    setActive(0);
  }, [cat]);

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = prev.indexOf(id) !== -1 ? prev.filter((x) => x !== id) : [id].concat(prev);
      localStorage.setItem(CLIP_SAVE_KEY, JSON.stringify(next));
      return next;
    });
  };
  const openConsult = (clip: Clip) => { setSheetClip(clip); setSheet(true); };
  const goDetail = (clip: Clip) => { window.location.href = '/info/' + clip.id; };

  return (
    <div className="rt-page" data-page="clips" id="top">
      {/* 상단 오버레이: 뒤로 + 타이틀 + 카테고리 */}
      <div className="rt-clips-top">
        <div className="rt-clips-bar">
          <button className="rt-clips-back" onClick={() => { window.location.href = '/info'; }} aria-label="뒤로">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <span className="rt-clips-h"><em>쇼츠</em> · 30초 렌트 상식</span>
        </div>
        <div className="rt-clips-cats">
          {CLIP_CATS.map((c) => (
            <button key={c.key} className={'rt-clips-cat' + (c.key === cat ? ' is-on' : '')}
              onClick={() => setCat(c.key)}>{c.label}</button>
          ))}
        </div>
      </div>

      {clips.length === 0 ? (
        <div className="rt-clips-empty">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M8 5v14l11-7z" /></svg>
          이 카테고리의 쇼츠를 준비 중이에요.
        </div>
      ) : (
        <div className="rt-shorts" ref={feedRef} onScroll={() => hint && setHint(false)}>
          {clips.map((clip, i) => (
            <ShortCard key={clip.id} clip={clip} idx={i} total={clips.length}
              playing={i === active && playing}
              onPlayToggle={() => setPlaying((p) => !p)}
              onSave={() => toggleSave(clip.id)} saved={saved.indexOf(clip.id) !== -1}
              onConsult={() => openConsult(clip)} onDetail={() => goDetail(clip)}
              showHint={hint} />
          ))}
        </div>
      )}

      <RtConsultSheet open={sheet} onClose={() => setSheet(false)} car={null}
        priceLabel={sheetClip ? sheetClip.title : ''} accent={ACCENT} />
    </div>
  );
}

export default function ClipsPageRoute() {
  return (
    <div className="rt-root" data-rt="clips" style={{ '--rt-accent': ACCENT } as React.CSSProperties}>
      <ClipsPage />
    </div>
  );
}
