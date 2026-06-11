'use client';

import { useState, useCallback } from 'react';
import { TERMS_FIELD_CONFIG } from './types';
import type { TermsCompanyRow, TermsFieldKey } from './types';

const NOT_SPECIFIED = '약관 미명시';
// 약관 수집 기준일 (terms ingest 완료 시점). 약관 갱신 시 함께 갱신.
const COLLECTED_AS_OF = '2026-06-11';

function cellKey(companyIdx: number, field: TermsFieldKey) {
  return `${companyIdx}:${field}`;
}

/** 값 + 근거 조항 칩 + (탭 시) 원문 인용 아코디언 */
function FieldValue({
  value,
  clause,
  quote,
  expanded,
  onToggle,
}: {
  value: string | null;
  clause: string | null;
  quote: string | null;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (!value) {
    return <span className="text-[13px] text-text-muted">{NOT_SPECIFIED}</span>;
  }
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] leading-relaxed text-text whitespace-pre-line">{value}</span>
      {clause && (
        <div>
          {quote ? (
            <button
              type="button"
              onClick={onToggle}
              aria-expanded={expanded}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#007AFF] bg-[#007AFF12] px-2 py-0.5 rounded-full"
            >
              {clause}
              <svg
                width="9"
                height="9"
                viewBox="0 0 10 10"
                fill="none"
                aria-hidden="true"
                className={`transition-transform ${expanded ? 'rotate-180' : ''}`}
              >
                <path d="M2 3.5L5 6.5L8 3.5" stroke="#007AFF" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <span className="inline-flex items-center text-[11px] font-semibold text-text-muted bg-[#8E8E9312] px-2 py-0.5 rounded-full">
              {clause}
            </span>
          )}
          {quote && expanded && (
            <p className="mt-1.5 text-[12px] leading-relaxed text-text-sub bg-[#F7F8FA] border border-border-solid rounded-lg px-2.5 py-2">
              “{quote}”
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function TermsCompareClient({ rows }: { rows: TermsCompanyRow[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = useCallback((key: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  return (
    <div>
      {/* 데스크톱: 행=회사, 열=필드 (가로 스크롤) */}
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-border-solid bg-white">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-[#F7F8FA]">
              <th className="sticky left-0 z-10 bg-[#F7F8FA] px-4 py-3 text-[12px] font-bold text-text-sub min-w-[120px]">
                회사
              </th>
              {TERMS_FIELD_CONFIG.map(f => (
                <th
                  key={f.key}
                  className="px-4 py-3 text-[12px] font-bold text-text-sub min-w-[190px] align-bottom"
                >
                  <span className="flex items-center gap-1">
                    {f.label}
                    {!f.core && (
                      <span className="text-[9px] font-semibold text-text-muted bg-[#8E8E9312] px-1.5 py-0.5 rounded-full">
                        보조
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ci) => (
              <tr key={row.company} className="border-t border-border-solid align-top">
                <th
                  scope="row"
                  className="sticky left-0 z-10 bg-white px-4 py-4 min-w-[120px] text-left"
                >
                  <span className="block text-[14px] font-bold text-text">{row.company}</span>
                  {row.companyType && (
                    <span className="block text-[11px] text-text-muted mt-0.5">{row.companyType}</span>
                  )}
                </th>
                {TERMS_FIELD_CONFIG.map(f => {
                  const cell = row.fields[f.key];
                  const k = cellKey(ci, f.key);
                  return (
                    <td key={f.key} className="px-4 py-4 min-w-[190px]">
                      <FieldValue
                        value={cell.value}
                        clause={cell.clause}
                        quote={cell.quote}
                        expanded={expanded.has(k)}
                        onToggle={() => toggle(k)}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일: 카드 전환 (회사별) */}
      <div className="md:hidden flex flex-col gap-3">
        {rows.map((row, ci) => (
          <div key={row.company} className="bg-white rounded-2xl border border-border-solid p-4">
            <div className="flex items-baseline justify-between mb-3">
              <span className="text-[15px] font-extrabold text-text">{row.company}</span>
              {row.companyType && (
                <span className="text-[11px] text-text-muted">{row.companyType}</span>
              )}
            </div>
            <dl className="flex flex-col gap-3">
              {TERMS_FIELD_CONFIG.map(f => {
                const cell = row.fields[f.key];
                const k = cellKey(ci, f.key);
                return (
                  <div key={f.key} className="border-t border-[#F2F2F7] pt-2.5 first:border-0 first:pt-0">
                    <dt className="flex items-center gap-1 text-[12px] font-semibold text-text-sub mb-1">
                      {f.label}
                      {!f.core && (
                        <span className="text-[9px] font-semibold text-text-muted bg-[#8E8E9312] px-1.5 py-0.5 rounded-full">
                          보조
                        </span>
                      )}
                    </dt>
                    <dd>
                      <FieldValue
                        value={cell.value}
                        clause={cell.clause}
                        quote={cell.quote}
                        expanded={expanded.has(k)}
                        onToggle={() => toggle(k)}
                      />
                    </dd>
                  </div>
                );
              })}
            </dl>
          </div>
        ))}
      </div>

      {/* 하단 고지 */}
      <div className="mt-6 p-4 rounded-2xl bg-white border border-border-solid">
        <p className="text-[11px] leading-relaxed text-text-muted">
          · 본 비교는 <b className="text-text-sub">각 사 약관 원문을 기준</b>으로 정리한 것이며,
          실제 계약 조건은 개별 계약서가 우선합니다.<br />
          · 약관 수집 기준일: <b className="text-text-sub">{COLLECTED_AS_OF}</b>. 약관은 개정될 수 있습니다.<br />
          · 값이 비어 있는 항목은 해당 약관에 명시되지 않은 경우(<b className="text-text-sub">약관 미명시</b>)입니다.<br />
          · ‘제N조’를 누르면 근거가 된 약관 원문 인용을 확인할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
