'use client';

// 약관 비교 탭 — 상품(렌트/리스/할부) 기준으로 제휴 캐피탈·카드사별 금리·약관 비교
//   카드/표 보기 토글 + 제휴사 상세 시트(회사 소개 / 약관 전문 2탭)
// 원본: _design_ref/compare-app.jsx (mode === "terms" → CmpTerms / CmpMatrix / CmpProvSheet)
import React, { useEffect, useState } from 'react';
import {
  CMP_FITS,
  CMP_FIT_LABEL,
  CMP_FIN_PRODUCTS,
  CMP_FIN_LABEL,
  CMP_PROVIDERS,
  CMP_DETAIL_KEYS,
  CMP_TERM_LABELS,
  CMP_RATE_ASOF,
  provFinKeys,
  type CmpProvider,
  type PayKey,
} from './data';

type ViewMode = 'cards' | 'matrix';

interface Lowest {
  k: PayKey;
  r: number;
  rate: string;
}

// ── 제휴사 상세 시트 (회사 소개 / 약관 전문) ──────────────────
function CmpProvSheet({ prov, onClose, fp }: { prov: CmpProvider | null; onClose: () => void; fp: PayKey }) {
  const [tab, setTab] = useState<'company' | 'terms'>('company');
  const [subProd, setSubProd] = useState<PayKey>('rent');

  useEffect(() => {
    if (!prov) return;
    setTab('company');
    setSubProd(prov.products[fp] ? fp : provFinKeys(prov)[0]);
  }, [prov, fp]);

  const p = prov;
  const finKeys = p ? provFinKeys(p) : [];
  const lowest: Lowest | null = p
    ? finKeys.reduce<Lowest | null>((best, k) => {
        const prod = p.products[k];
        if (!prod || prod.hidden) return best;
        const r = parseFloat(prod.rate);
        return !best || r < best.r ? { k, r, rate: prod.rate } : best;
      }, null)
    : null;
  const curKey: PayKey | undefined = p && p.products[subProd] ? subProd : finKeys[0];
  const curTerms = p && curKey ? p.products[curKey]?.terms ?? null : null;

  return (
    <>
      <div className={'rt-sheet-scrim' + (p ? ' is-open' : '')} onClick={onClose}></div>
      <div className={'rt-sheet' + (p ? ' is-open' : '')} role="dialog" aria-modal="true" style={{ maxHeight: '90%', overflowY: 'auto' }}>
        <div className="rt-sheet-grab"></div>
        <button className="rt-sheet-close" onClick={onClose} aria-label="닫기">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        {p && (
          <>
            <div className="rt-prov-sheet-head">
              <span className="rt-prov-logo" aria-hidden="true">
                {p.name.slice(0, 2)}
              </span>
              <div>
                <div className="rt-prov-name" style={{ fontSize: 18 }}>
                  {p.name}
                  <span className={'rt-prov-type' + (p.type === '카드사' ? ' card' : '')}>{p.type}</span>
                </div>
                <div className="rt-prov-sheet-rate">
                  {lowest ? (
                    <>
                      최저 금리 <b>{lowest.rate}</b> <em>{CMP_FIN_LABEL[lowest.k]} 기준 · {finKeys.length}개 상품</em>
                    </>
                  ) : (
                    <>
                      <b>금리 비공개</b> <em>{finKeys.length}개 상품 취급</em>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="rt-prov-fit">
              {p.fit.map((f) => (
                <span key={f} className="rt-prov-fit-chip">
                  {CMP_FIT_LABEL[f]}
                </span>
              ))}
            </div>

            <div className="rt-prov-sheet-tabs" role="tablist">
              <button className={'rt-prov-sheet-tab' + (tab === 'company' ? ' is-on' : '')} onClick={() => setTab('company')}>
                회사 소개
              </button>
              <button className={'rt-prov-sheet-tab' + (tab === 'terms' ? ' is-on' : '')} onClick={() => setTab('terms')}>
                약관 전문
              </button>
            </div>

            {tab === 'company' ? (
              <div className="rt-prov-sheet-body">
                <p className="rt-prov-oneliner">{p.company.oneliner}</p>
                <div className="rt-prov-rates">
                  <span className="rt-prov-rates-k">상품별 금리</span>
                  {finKeys.map((k) => {
                    const prod = p.products[k];
                    if (!prod) return null;
                    return (
                      <div className={'rt-prov-rate-row' + (prod.best ? ' best' : '')} key={k}>
                        <span className="rt-prov-rate-prod">{CMP_FIN_LABEL[k]}</span>
                        <span className={'rt-prov-rate-val' + (prod.hidden ? ' hidden' : '')}>
                          {prod.rate}
                          {prod.best && <em>최저</em>}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="rt-prov-stats">
                  {p.company.stats.map((s) => (
                    <div className="rt-prov-stat" key={s.k}>
                      <span className="rt-prov-stat-v">{s.v}</span>
                      <span className="rt-prov-stat-k">{s.k}</span>
                    </div>
                  ))}
                </div>
                <div className="rt-prov-strength">
                  <span className="rt-prov-strength-k">이런 분께 잘 맞아요</span>
                  <p>{p.company.strength}</p>
                </div>
                <p className="rt-prov-since">설립 {p.company.since}년 · Rentailor 제휴사</p>
              </div>
            ) : (
              <div className="rt-prov-sheet-body">
                <div className="rt-prov-subtabs" role="tablist">
                  {finKeys.map((k) => (
                    <button key={k} className={'rt-prov-subtab' + (k === curKey ? ' is-on' : '')} onClick={() => setSubProd(k)}>
                      {CMP_FIN_LABEL[k]}
                    </button>
                  ))}
                </div>
                {curTerms && (
                  <div className="rt-prov-detail">
                    {CMP_DETAIL_KEYS.map((k) => (
                      <div className="rt-prov-detail-row" key={k}>
                        <span className="rt-prov-detail-k">{k}</span>
                        <span className="rt-prov-detail-v">{curTerms[k]}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="rt-cmp-note" style={{ padding: '12px 0 0' }}>
                  ※ <b>{curKey ? CMP_FIN_LABEL[curKey] : ''}</b> 기준 표준 약관이며 신용·차종·프로모션에 따라 달라질 수 있어요. 정확한 조건은 상담 시 확정됩니다.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

// ── 비교 매트릭스 (항목 행 × 제휴사 열) ───────────────────────
function CmpMatrix({ rows, fp, onSelect }: { rows: CmpProvider[]; fp: PayKey; onSelect: (p: CmpProvider) => void }) {
  if (!rows.length)
    return (
      <p className="rt-cmp-note" style={{ padding: '8px var(--rt-pad)' }}>
        {CMP_FIN_LABEL[fp]}를 취급하는 제휴사가 없어요.
      </p>
    );
  return (
    <div className="rt-mtx-wrap">
      <p className="rt-cmp-scrollhint">← 표를 좌우로 넘겨 모든 제휴사를 비교하세요 →</p>
      <div className="rt-mtx-scroll">
        <div className="rt-mtx" style={{ gridTemplateColumns: '92px repeat(' + rows.length + ', minmax(140px, 1fr))' }}>
          <div className="rt-mtx-corner">{CMP_FIN_LABEL[fp]}</div>
          {rows.map((p) => (
            <button className="rt-mtx-h" key={p.name} onClick={() => onSelect(p)}>
              <span className="rt-mtx-h-name">{p.name}</span>
              <span className={'rt-prov-type' + (p.type === '카드사' ? ' card' : '')}>{p.type}</span>
              {p.products[fp]?.best && <span className="rt-mtx-h-best">최저 금리</span>}
            </button>
          ))}
          {CMP_DETAIL_KEYS.map((k) => (
            <React.Fragment key={k}>
              <div className="rt-mtx-rk">{CMP_TERM_LABELS[k]}</div>
              {rows.map((p) => (
                <div className={'rt-mtx-c' + (k === '금리' && !p.products[fp]?.hidden ? ' num' : '')} key={p.name + k}>
                  {p.products[fp]?.terms[k]}
                </div>
              ))}
            </React.Fragment>
          ))}
          <div className="rt-mtx-rk">적합 고객</div>
          {rows.map((p) => (
            <div className="rt-mtx-c" key={p.name + 'fit'}>
              <div className="rt-prov-fit">
                {p.fit.map((f) => (
                  <span key={f} className="rt-prov-fit-chip">
                    {CMP_FIT_LABEL[f]}
                  </span>
                ))}
              </div>
            </div>
          ))}
          <div className="rt-mtx-rk"></div>
          {rows.map((p) => (
            <button className="rt-mtx-c rt-mtx-more" key={p.name + 'more'} onClick={() => onSelect(p)}>
              자세히 보기 ›
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export interface CompareTermsProps {
  product: PayKey;
  setProduct: (k: PayKey) => void;
}

export function CompareTerms({ product, setProduct }: CompareTermsProps) {
  const [fit, setFit] = useState<string>('all');
  const [view, setView] = useState<ViewMode>('cards');
  const [sel, setSel] = useState<CmpProvider | null>(null);
  const fp = product;
  const rows = CMP_PROVIDERS.filter((p) => p.products[fp] && (fit === 'all' || p.fit.includes(fit)));

  return (
    <>
      <div className="rt-cmp-head">
        <p className="rt-cmp-eyebrow">제휴 캐피탈 · 카드사</p>
        <h1 className="rt-cmp-title">
          상품별로 회사와
          <br />
          약관을 비교했어요
        </h1>
        <p className="rt-cmp-desc">장기렌트·리스·할부는 회사마다 금리도 약관도 달라요. 상품을 고르면 그 상품 기준으로 회사별 금리·약관을 비교해 드려요.</p>
      </div>

      <div className="rt-prov-prodsel" role="tablist" aria-label="상품 선택">
        {CMP_FIN_PRODUCTS.map((f) => (
          <button key={f.key} className={'rt-prov-prodbtn' + (fp === f.key ? ' is-on' : '')} onClick={() => setProduct(f.key)} role="tab" aria-selected={fp === f.key}>
            {f.label}
          </button>
        ))}
      </div>
      <p className="rt-prov-asof">
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 8v4l3 2" />
        </svg>
        {fp === 'rent' ? '장기렌트는 금리 비공개 · 월 렌트료로 안내해요' : '금리는 매월 변동돼요 · ' + CMP_RATE_ASOF + ' 기준'}
      </p>

      <div className="rt-prov-toolbar">
        <div className="rt-prov-filter">
          <button className={'rt-prov-fpill' + (fit === 'all' ? ' is-on' : '')} onClick={() => setFit('all')}>
            전체
          </button>
          {CMP_FITS.map((f) => (
            <button key={f.key} className={'rt-prov-fpill' + (fit === f.key ? ' is-on' : '')} onClick={() => setFit(f.key)}>
              {f.label}
            </button>
          ))}
        </div>
        <div className="rt-prov-viewtog" role="tablist" aria-label="보기 방식">
          <button className={'rt-prov-viewbtn' + (view === 'cards' ? ' is-on' : '')} onClick={() => setView('cards')} aria-label="카드 보기">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="7" rx="2" />
              <rect x="3" y="13" width="18" height="7" rx="2" />
            </svg>
            카드
          </button>
          <button className={'rt-prov-viewbtn' + (view === 'matrix' ? ' is-on' : '')} onClick={() => setView('matrix')} aria-label="표 비교">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M3 15h18M9 3v18" />
            </svg>
            표 비교
          </button>
        </div>
      </div>

      {view === 'matrix' ? (
        <CmpMatrix rows={rows} fp={fp} onSelect={setSel} />
      ) : (
        <div className="rt-prov-list">
          {rows.length === 0 && (
            <p className="rt-cmp-note" style={{ padding: '8px var(--rt-pad)' }}>
              {CMP_FIN_LABEL[fp]}를 취급하는 제휴사가 없어요.
            </p>
          )}
          {rows.map((p) => {
            const prod = p.products[fp];
            return (
              <button className="rt-prov rt-prov-btn" key={p.name} onClick={() => setSel(p)}>
                <div className="rt-prov-top">
                  <div>
                    <div className="rt-prov-name">
                      {p.name}
                      <span className={'rt-prov-type' + (p.type === '카드사' ? ' card' : '')}>{p.type}</span>
                      {prod?.best && <span className="rt-prov-best">최저 금리</span>}
                    </div>
                    <div className="rt-prov-onel">{p.company.oneliner}</div>
                  </div>
                  <div className="rt-prov-rate">
                    {prod?.hidden ? (
                      <>
                        <b className="sm">월 렌트료</b>
                        <span>금리 비공개</span>
                      </>
                    ) : (
                      <>
                        <b>{prod?.rate}</b>
                        <span>{CMP_FIN_LABEL[fp]} 금리</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="rt-prov-card-foot">
                  <div className="rt-prov-fit">
                    {p.fit.map((f) => (
                      <span key={f} className="rt-prov-fit-chip">
                        {CMP_FIT_LABEL[f]}
                      </span>
                    ))}
                  </div>
                  <span className="rt-prov-more">
                    자세히 보기
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
      <p className="rt-cmp-note" style={{ paddingTop: 4 }}>
        ※ 금리는 매월 변동되고({CMP_RATE_ASOF} 기준), 약관은 신용 조건·차종·프로모션에 따라 달라질 수 있어요. 전담 매니저가 제휴사를 한 번에 비교해 가장 낮은 조건을 찾아드립니다.
      </p>

      <CmpProvSheet prov={sel} onClose={() => setSel(null)} fp={fp} />
    </>
  );
}
