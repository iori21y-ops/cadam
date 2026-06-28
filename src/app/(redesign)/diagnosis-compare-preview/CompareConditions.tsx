'use client';

// 조건 비교 탭 — 장기렌트·리스·할부 약관 조건 한눈에 비교 (소유권/초기비용/보험/세금 등 12행)
// 원본: _design_ref/compare-app.jsx (mode === "cond")
import React from 'react';
import { CMP_PRODUCTS, CMP_ROWS, CMP_WHY, type PayKey, type CmpWhy } from './data';

function CmpCheck() {
  return (
    <span className="rt-cmp-check">
      <svg viewBox="0 0 12 12" width="10" height="10">
        <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function WhyIcon({ name }: { name: CmpWhy['icon'] }) {
  if (name === 'shield')
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  if (name === 'price')
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.5 9.2a2.5 2.5 0 0 1 5 0c0 1.6-2.5 1.9-2.5 3.3M12 16.5h.01" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4M9.5 13h5M9.5 16.5h5" />
    </svg>
  );
}

export interface CompareConditionsProps {
  product: PayKey;
  setProduct: (k: PayKey) => void;
}

export function CompareConditions({ product, setProduct }: CompareConditionsProps) {
  return (
    <>
      <div className="rt-cmp-head">
        <p className="rt-cmp-eyebrow">장기렌트 · 리스 · 할부</p>
        <h1 className="rt-cmp-title">
          세 가지 방법,
          <br />
          약관까지 한눈에 비교
        </h1>
        <p className="rt-cmp-desc">소유권·초기비용·보험·세금·중도해지까지. 방식별 약관 조건을 비교하고 내게 맞는 방법을 골라보세요.</p>
      </div>

      <div className="rt-cmp-cards">
        {CMP_PRODUCTS.map((p) => (
          <button key={p.key} className={'rt-cmp-card' + (product === p.key ? ' is-on' : '')} onClick={() => setProduct(p.key)}>
            {p.best && <span className="rt-cmp-card-best">추천</span>}
            <div className="rt-cmp-card-name">{p.name}</div>
            <div className="rt-cmp-card-tag">{p.tag}</div>
          </button>
        ))}
      </div>

      <div className="rt-cmp-tablewrap">
        <p className="rt-cmp-scrollhint">← 표를 좌우로 넘겨 모든 방식을 비교하세요 →</p>
        <div className="rt-cmp-scroll">
          <div className="rt-cmp-table">
            <div className="rt-cmp-thead">
              <div className="rt-cmp-th">항목</div>
              {CMP_PRODUCTS.map((p) => (
                <div key={p.key} className={'rt-cmp-th' + (product === p.key ? ' is-on' : '')} onClick={() => setProduct(p.key)}>
                  {p.best && <span className="rt-cmp-th-best">추천</span>}
                  {p.name}
                </div>
              ))}
            </div>
            {CMP_ROWS.map((r) => (
              <div className="rt-cmp-tr" key={r.label}>
                <div className="rt-cmp-td k">{r.label}</div>
                {CMP_PRODUCTS.map((p) => {
                  const isBest = r.best.includes(p.key);
                  return (
                    <div key={p.key} className={'rt-cmp-td' + (product === p.key ? ' is-on' : '') + (isBest ? ' best' : '')}>
                      {isBest && <CmpCheck />}
                      {r[p.key]}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <p className="rt-cmp-note" style={{ paddingTop: 10 }}>
          ※ 위 내용은 일반적인 기준이며, 상품·캐피탈사·신용 조건에 따라 세부 약관이 달라질 수 있어요. 정확한 조건은 상담 시 안내해 드립니다.
        </p>
      </div>

      <div className="rt-cmp-why">
        <h2 className="rt-cmp-why-t">
          그래서 <em>장기렌트</em>가 부담 없어요
        </h2>
        <div className="rt-cmp-why-list">
          {CMP_WHY.map((w) => (
            <div className="rt-cmp-why-item" key={w.h}>
              <span className="rt-cmp-why-ic">
                <WhyIcon name={w.icon} />
              </span>
              <div>
                <div className="rt-cmp-why-h">{w.h}</div>
                <div className="rt-cmp-why-d">{w.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
