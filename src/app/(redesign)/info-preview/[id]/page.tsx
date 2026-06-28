'use client';

// 정보 가이드 상세 — 리뉴얼 미리보기
// 원본: _design_ref/info-detail-app.jsx (window 전역 → 모듈, image-slot → hue 플레이스홀더,
//   tweaks/device 제외). 본문(content/sections)이 없으면 excerpt + 원문 링크로 폴백.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { RtTopNav, RtTabBar } from '@/components/rentailor/RtChrome';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import { rtMemberLocked, rtMarkConsulted } from '@/lib/rentailor/guest-adapter';
import { Button } from '@/components/ui/Button';
import {
  normalizeArticle,
  infoRelated,
  readLabel,
  tagLabel,
  type Article,
  type RawArticle,
} from '../info-data';
import '../info.css';

const ACCENT = '#C9A84C';

interface InfoApiResponse {
  articles?: RawArticle[];
}

const hueStyle = (a: Article): React.CSSProperties => ({ '--hue': a.hue } as React.CSSProperties);
function mediaStyle(a: Article): React.CSSProperties {
  const s: Record<string, string | number> = { '--hue': a.hue };
  if (a.thumbnailUrl) s.backgroundImage = `url("${a.thumbnailUrl}")`;
  return s as React.CSSProperties;
}
const mediaClass = (a: Article, base: string) => base + (a.thumbnailUrl ? ' rt-media-img' : '');

function LockIcon({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="10" width="16" height="10" rx="2.5" />
      <path d="M8 10V6a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export default function InfoDetailPreviewPage() {
  const params = useParams<{ id: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheet, setSheet] = useState(false);
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

  const art = useMemo(() => articles.find((a) => a.id === id) ?? null, [articles, id]);
  const related = useMemo(() => (art ? infoRelated(articles, art.id, 3) : []), [articles, art]);

  if (loading) {
    return (
      <div data-rt="info-preview" className="rt-root">
        <div className="rt-page" id="top">
          <RtTopNav title="렌트 가이드" backHref="/info-preview" />
          <p className="rt-info-empty">불러오는 중…</p>
        </div>
      </div>
    );
  }

  if (!art) {
    return (
      <div data-rt="info-preview" className="rt-root">
        <div className="rt-page" id="top">
          <RtTopNav title="렌트 가이드" backHref="/info-preview" />
          <p className="rt-info-empty">
            콘텐츠를 찾을 수 없어요.
            <br />
            <Link href="/info-preview" style={{ color: ACCENT, fontWeight: 800 }}>← 렌트 가이드로</Link>
          </p>
          <RtTabBar active="info" />
        </div>
      </div>
    );
  }

  const type = art.contentType;
  const locked = rtMemberLocked(art);
  const hasSections = Array.isArray(art.sections) && art.sections.length > 0;
  const hasTips = Array.isArray(art.tips) && art.tips.length > 0;

  // ── 회원 전용 잠금 화면 (헤더·리드까지, 본문은 상담 CTA로 대체) ──
  if (locked) {
    return (
      <div data-rt="info-preview" className="rt-root">
        <div className="rt-page" id="top">
          <RtTopNav title="렌트 가이드" backHref="/info-preview" />
          <div className="rt-id-hero" style={hueStyle(art)}>
            <div className={mediaClass(art, 'rt-id-media')} style={mediaStyle(art)}>
              <span className="rt-id-tag">{tagLabel(art)}</span>
            </div>
          </div>
          <div className="rt-id-head">
            <h1 className="rt-id-title">{art.title}</h1>
            <div className="rt-id-meta">
              <b>Rentailor 매거진</b><i></i>
              <span className="rt-lock-row"><LockIcon />회원 전용</span>
            </div>
          </div>
          {art.excerpt && <p className="rt-id-lead" style={{ margin: '0 var(--rt-pad)' }}>{art.excerpt}</p>}
          <div className="rt-locked-veil">
            <div className="rt-locked-ic"><LockIcon size={24} /></div>
            <p className="rt-locked-t">회원 전용 콘텐츠예요</p>
            <p className="rt-locked-d">상담 신청 고객에게만 공개되는 심층 가이드예요. 30초 상담 신청하고 전체 내용을 확인해 보세요.</p>
            <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={() => setSheet(true)}>상담 신청하고 열람하기</Button>
          </div>
          <RtTabBar active="info" />
        </div>
        <RtConsultSheet
          open={sheet}
          accent={ACCENT}
          onSubmitted={() => { rtMarkConsulted(); consultedRef.current = true; }}
          onClose={() => { setSheet(false); if (consultedRef.current && typeof window !== 'undefined') window.location.reload(); }}
        />
      </div>
    );
  }

  return (
    <div data-rt="info-preview" className="rt-root">
      <div className="rt-page" id="top">
        <RtTopNav title="렌트 가이드" backHref="/info-preview" />

        {/* 히어로 — 쇼츠 / 아티클·카드 */}
        {type === 'clip' ? (
          <div className="rt-id-cliphero" style={hueStyle(art)}>
            <div className={mediaClass(art, 'rt-id-clipframe')} style={mediaStyle(art)}>
              <span className="rt-id-clipplay"><svg viewBox="0 0 24 24" width="30" height="30" fill="#fff"><path d="M8 5v14l11-7z" /></svg></span>
              {art.duration && <span className="rt-id-clipdur">{art.duration}</span>}
              <div className="rt-id-clipcap">
                <span className="rt-id-cliptag">{tagLabel(art)}</span>
                <p className="rt-id-cliptitle">{art.title}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="rt-id-hero" style={hueStyle(art)}>
            <div className={mediaClass(art, 'rt-id-media')} style={mediaStyle(art)}>
              <span className="rt-id-tag">{tagLabel(art)}</span>
            </div>
          </div>
        )}

        {/* 헤더(쇼츠는 히어로 자막에 제목 포함 → 생략) */}
        {type !== 'clip' && (
          <div className="rt-id-head">
            <h1 className="rt-id-title">{art.title}</h1>
            <div className="rt-id-meta">
              <b>Rentailor 매거진</b>
              {readLabel(art) && (<><i></i><span>{readLabel(art)}{type === 'card' ? '' : ' 읽기'}</span></>)}
            </div>
          </div>
        )}

        {/* 카드뉴스 슬라이드 */}
        {type === 'card' && art.cards && art.cards.length > 0 && (
          <div className="rt-id-cardnews">
            <div className="rt-id-cardrail">
              {art.cards.map((c, i) => (
                <div className="rt-id-cardslide" key={i} style={hueStyle(art)}>
                  <span className="rt-id-cardnum">{i + 1} / {art.cards!.length}</span>
                  <p className="rt-id-cardh">{c.t}</p>
                  <p className="rt-id-cardd">{c.d}</p>
                </div>
              ))}
            </div>
            <p className="rt-id-cardhint">← 카드를 좌우로 넘겨보세요 →</p>
          </div>
        )}

        {/* 본문 — sections 있으면 렌더, 없으면 excerpt + 원문 링크 폴백 */}
        <div className="rt-id-body">
          {type === 'clip' && art.excerpt && <p className="rt-id-lead">{art.excerpt}</p>}

          {hasSections ? (
            art.sections!.map((s, i) => (
              <div className="rt-id-sect" key={i}>
                <h2 className="rt-id-h">{s.h}</h2>
                <p className="rt-id-p">{s.p}</p>
              </div>
            ))
          ) : (
            type !== 'clip' && (
              <div className="rt-id-sect">
                {art.excerpt && <p className="rt-id-p">{art.excerpt}</p>}
                {art.linkUrl && (
                  <a className="rt-id-origin" href={art.linkUrl} target={art.linkUrl.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">
                    원문 전체 보기
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                  </a>
                )}
              </div>
            )
          )}

          {hasTips && (
            <div className="rt-id-summary">
              <p className="rt-id-summary-t">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M13 2L4.5 13H11l-1 9 8.5-11H12z" /></svg>
                핵심 요약
              </p>
              <ul>
                {art.tips!.map((t, i) => (
                  <li key={i}>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7" /></svg>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {related.length > 0 && (
          <div className="rt-id-related">
            <h2 className="rt-id-related-t">함께 보면 좋은 가이드</h2>
            {related.map((a) => (
              <Link className="rt-id-rcard" key={a.id} href={`/info-preview/${a.id}`}>
                <span className={mediaClass(a, 'rt-id-rthumb')} style={mediaStyle(a)}></span>
                <span>
                  <span className="rt-id-rtag" style={{ display: 'block' }}>{tagLabel(a)}</span>
                  <span className="rt-id-rtitle" style={{ display: 'block' }}>{a.title}</span>
                </span>
              </Link>
            ))}
          </div>
        )}

        <div className="rt-id-cta">
          <p className="rt-id-cta-t">이제 내 차를 찾아볼 차례예요</p>
          <p className="rt-id-cta-d">AI 진단으로 30초 만에 나에게 맞는 차와 월 비용을 확인해 보세요.</p>
          <Button variant="primary" size="lg" fullWidth className="rt-gold" onClick={() => { window.location.href = '/diagnosis'; }}>AI 진단 시작하기</Button>
        </div>

        <RtTabBar active="info" />
      </div>
    </div>
  );
}
