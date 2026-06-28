'use client';

// 차량 직접 비교 — 리뉴얼 미리보기 (타깃 /simulator/compare)
// 원본: _design_ref/vscompare-app.jsx (+ rt-vscompare.css)
// 이식 규칙: window 전역 → 모듈, CadamDS.Button → @/components/ui/Button,
//   image-slot → hsl(hue 42% 92%) 플레이스홀더 div, 디바이스/Tweaks/personalize 제외.
//   localStorage 는 SSR 안전하게 mount useEffect 에서 hydrate (초기값은 기본 id).
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { RtTopNav } from '@/components/rentailor/RtChrome';
import { RtConsultSheet } from '@/components/rentailor/RtConsultSheet';
import { RT_CATALOG, FUEL, type Car } from '@/lib/rentailor/catalog';
import { VS_ROWS, bestId, DEFAULT_IDS, STORAGE_KEY, MAX_CARS } from './data';
import './vscompare.css';

const ACCENT = '#C9A84C';
const cssVar = (vars: Record<string, string | number>): React.CSSProperties => vars as React.CSSProperties;

const hueBg = (hue: number): React.CSSProperties => ({ background: `hsl(${hue} 42% 92%)` });

function VsCrown() {
  return (
    <svg className="rt-vs-crown" viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
      <path d="M3 7l4 4 5-6 5 6 4-4v11H3z" />
    </svg>
  );
}

function VsPicker({
  open,
  onClose,
  onPick,
  exclude,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (id: string) => void;
  exclude: string[];
}) {
  return (
    <>
      <div className={'rt-sheet-scrim' + (open ? ' is-open' : '')} onClick={onClose}></div>
      <div className={'rt-vs-picker' + (open ? ' is-open' : '')} role="dialog" aria-modal="true">
        <div className="rt-vs-picker-grab"></div>
        <div className="rt-vs-picker-t">비교할 차량 선택</div>
        <div className="rt-vs-picker-list">
          {RT_CATALOG.map((c) => {
            const used = exclude.includes(c.id);
            return (
              <button
                key={c.id}
                className="rt-vs-pick-item"
                disabled={used}
                onClick={() => {
                  onPick(c.id);
                  onClose();
                }}
              >
                <span className="rt-vs-pick-thumb" style={hueBg(c.hue)}></span>
                <span>
                  <span className="rt-vs-pick-name" style={{ display: 'block' }}>
                    {c.brand} {c.model}
                  </span>
                  <span className="rt-vs-pick-seg">
                    {c.segLabel} · {FUEL[c.fuel]?.label ?? c.fuel}
                  </span>
                </span>
                <span className="rt-vs-pick-price">월 {c.from}만원~</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

export default function SimulatorComparePreview() {
  const byId: Record<string, Car> = Object.fromEntries(RT_CATALOG.map((c) => [c.id, c]));
  const [ids, setIds] = useState<string[]>(DEFAULT_IDS);
  const [picker, setPicker] = useState(false);
  const [sheet, setSheet] = useState(false);

  // SSR 안전: 클라이언트 마운트 후에만 localStorage hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const saved = raw ? (JSON.parse(raw) as unknown) : null;
      if (Array.isArray(saved) && saved.length) {
        setIds(saved.filter((x): x is string => typeof x === 'string').slice(0, MAX_CARS));
      }
    } catch {
      /* noop */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
    } catch {
      /* noop */
    }
  }, [ids]);

  const cars = ids.map((id) => byId[id]).filter(Boolean);
  const gridStyle: React.CSSProperties = { gridTemplateColumns: `repeat(${cars.length}, 1fr)` };

  return (
    <div data-rt="simulator-compare-preview" className="rt-root" style={cssVar({ '--rt-accent': ACCENT, '--rt-radius': '20px' })}>
      <div className="rt-page" data-page="vscompare">
        <div className="rt-scroll">
          <RtTopNav title="차량 직접 비교" />

          <div className="rt-vs-head">
            <h1 className="rt-vs-title">
              관심 차량을
              <br />
              나란히 비교하세요
            </h1>
            <p className="rt-vs-desc">
              최대 3대까지 월 렌트료·연비·출력·인승을 한눈에 비교하고 더 나은 선택을 찾아보세요.
            </p>
          </div>

          <div className="rt-vs-slots">
            {cars.map((c) => (
              <div className="rt-vs-slot" key={c.id}>
                <button
                  className="rt-vs-slot-x"
                  aria-label="제거"
                  onClick={() => setIds(ids.filter((x) => x !== c.id))}
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="13"
                    height="13"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
                <div className="rt-vs-slot-media" style={hueBg(c.hue)}></div>
                <div className="rt-vs-slot-body">
                  <div className="rt-vs-slot-name">
                    {c.brand} {c.model}
                  </div>
                  <div className="rt-vs-slot-price">월 {c.from}만원~</div>
                </div>
              </div>
            ))}
            {cars.length < MAX_CARS && (
              <button className="rt-vs-add" onClick={() => setPicker(true)}>
                <span className="rt-vs-add-ic">
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  >
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                </span>
                <span>차량 추가</span>
              </button>
            )}
          </div>

          {cars.length >= 2 ? (
            <div className="rt-vs-table">
              {VS_ROWS.map((row) => {
                const bid = bestId(row, cars);
                return (
                  <div className="rt-vs-row" key={row.k}>
                    <div className="rt-vs-rowhead">{row.k}</div>
                    <div className="rt-vs-cells" style={gridStyle}>
                      {cars.map((c) => (
                        <div key={c.id} className={'rt-vs-cell' + (bid === c.id ? ' best' : '')}>
                          {bid === c.id && <VsCrown />}
                          {row.get(c)}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="rt-vs-empty-note">
              차량을 2대 이상 추가하면
              <br />
              항목별 비교 결과가 표시돼요.
            </p>
          )}

          <div className="rt-bar" style={cssVar({ '--rt-accent': ACCENT })}>
            <div className="rt-bar-inner">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                className="rt-gold"
                onClick={() => setSheet(true)}
              >
                비교한 차량 상담받기
              </Button>
            </div>
          </div>
        </div>
      </div>

      <VsPicker
        open={picker}
        onClose={() => setPicker(false)}
        exclude={ids}
        onPick={(id) => setIds(ids.length < MAX_CARS ? ids.concat(id) : ids)}
      />
      <RtConsultSheet open={sheet} onClose={() => setSheet(false)} car={null} accent={ACCENT} />
    </div>
  );
}
