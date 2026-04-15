'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';

// ─────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────

interface FinanceRateRow {
  id: string;
  product_type: 'installment' | 'lease' | 'rent';
  annual_rate: number;
  residual_rate: number | null;
  deposit_rate: number | null;
  insurance_rate: number | null;
  mileage_surcharge_rate: number | null;
  mileage_base_km: number | null;
  memo: string | null;
  is_active: boolean;
  effective_from: string;
}

// % ↔ 소수 변환 헬퍼
const toPercent = (v: number | null | undefined): string =>
  v == null ? '' : String(parseFloat((v * 100).toFixed(4)));
const fromPercent = (s: string): number | null => {
  const n = parseFloat(s);
  return isNaN(n) ? null : parseFloat((n / 100).toFixed(6));
};

// 상품별 한글명 & 아이콘
const PRODUCT_LABELS: Record<string, { name: string; color: string }> = {
  installment: { name: '할부', color: 'bg-blue-50 border-blue-200' },
  lease:       { name: '리스', color: 'bg-purple-50 border-purple-200' },
  rent:        { name: '렌트', color: 'bg-green-50 border-green-200' },
};

// ─────────────────────────────────────────────────────────────
// 편집 폼 컴포넌트
// ─────────────────────────────────────────────────────────────

function InputRow({
  label,
  value,
  onChange,
  suffix = '',
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="w-36 shrink-0 text-sm text-text-sub">{label}</label>
      <div className="flex items-center gap-1 flex-1">
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-28 bg-surface-secondary border border-border-solid rounded-[10px] text-sm px-3 py-2 outline-none focus:border-primary text-right"
        />
        {suffix && <span className="text-sm text-text-sub">{suffix}</span>}
      </div>
      {hint && <span className="text-xs text-text-muted">{hint}</span>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 메인 페이지
// ─────────────────────────────────────────────────────────────

export default function AdminFinancePage() {
  const [rows, setRows] = useState<FinanceRateRow[]>([]);
  const [loading, setLoading] = useState(true);

  // 편집 상태: productType → 필드값 (% 단위 문자열)
  const [forms, setForms] = useState<Record<string, Record<string, string>>>({});
  const [saving, setSaving] = useState<string | null>(null); // 저장 중인 productType
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // ── 데이터 조회 ──────────────────────────────────────────────

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('finance_rates')
        .select(
          'id, product_type, annual_rate, residual_rate, deposit_rate, ' +
          'insurance_rate, mileage_surcharge_rate, mileage_base_km, memo, is_active, effective_from'
        )
        .eq('is_active', true)
        .lte('effective_from', today)
        .or(`effective_to.is.null,effective_to.gte.${today}`)
        .order('product_type');

      if (error) throw error;
      const fetched = (data ?? []) as unknown as FinanceRateRow[];
      setRows(fetched);

      // 폼 초기값 세팅
      const init: Record<string, Record<string, string>> = {};
      for (const r of fetched) {
        init[r.product_type] = {
          annual_rate:          toPercent(r.annual_rate),
          residual_rate:        toPercent(r.residual_rate),
          deposit_rate:         toPercent(r.deposit_rate),
          insurance_rate:       toPercent(r.insurance_rate),
          mileage_surcharge_rate: toPercent(r.mileage_surcharge_rate),
          mileage_base_km:      r.mileage_base_km != null ? String(r.mileage_base_km) : '',
          memo:                 r.memo ?? '',
        };
      }
      setForms(init);
    } catch (e) {
      setMsg({ type: 'err', text: `조회 실패: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  // ── 폼 값 업데이트 ─────────────────────────────────────────

  const setField = (pt: string, field: string, val: string) => {
    setForms((prev) => ({
      ...prev,
      [pt]: { ...prev[pt], [field]: val },
    }));
  };

  // ── 저장 ──────────────────────────────────────────────────

  const handleSave = async (productType: string, andGenerate = false) => {
    const row = rows.find((r) => r.product_type === productType);
    if (!row) return;

    const f = forms[productType] ?? {};
    const update: Record<string, unknown> = {
      annual_rate: fromPercent(f.annual_rate),
      memo: f.memo || null,
      updated_at: new Date().toISOString(),
    };

    if (productType === 'lease' || productType === 'rent') {
      update.residual_rate = fromPercent(f.residual_rate);
    }
    if (productType === 'lease') {
      update.deposit_rate = fromPercent(f.deposit_rate);
    }
    if (productType === 'rent') {
      update.insurance_rate       = fromPercent(f.insurance_rate);
      update.mileage_surcharge_rate = fromPercent(f.mileage_surcharge_rate);
      update.mileage_base_km      = f.mileage_base_km ? parseInt(f.mileage_base_km) : null;
    }

    setSaving(productType);
    setMsg(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase
        .from('finance_rates')
        .update(update)
        .eq('id', row.id);

      if (error) throw error;

      if (andGenerate) {
        await handleGenerate();
      } else {
        setMsg({ type: 'ok', text: `${PRODUCT_LABELS[productType]?.name} 금융 조건 저장 완료` });
        await fetchRates();
      }
    } catch (e) {
      setMsg({ type: 'err', text: `저장 실패: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setSaving(null);
    }
  };

  // ── pricing 재생성 ─────────────────────────────────────────

  const handleGenerate = async () => {
    setGenerating(true);
    setMsg(null);
    try {
      const res = await fetch('/api/generate-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? data.pricing_detail ?? '재생성 실패');
      }
      setMsg({ type: 'ok', text: `저장 + pricing 재생성 완료 — ${data.pricing_detail ?? ''}` });
      await fetchRates();
    } catch (e) {
      setMsg({ type: 'err', text: `재생성 실패: ${e instanceof Error ? e.message : String(e)}` });
    } finally {
      setGenerating(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 렌더링
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="max-w-[1200px] mx-auto p-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h1 className="text-xl font-bold text-text tracking-tight">금융 조건 관리</h1>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || loading}
          className="px-4 py-2 rounded-[10px] border border-border-solid bg-white text-sm font-semibold text-text hover:bg-surface-secondary disabled:opacity-50 whitespace-nowrap"
        >
          {generating ? 'pricing 재생성 중...' : '전체 pricing 재생성'}
        </button>
      </div>

      {/* 경고 배너 */}
      <div className="mb-4 px-4 py-3 rounded-2xl bg-[#FFF9E6] border border-[#FFD60A33] text-sm text-[#8B6700]">
        이율 · 잔존가치 변경 시 전체 차량 월납입금이 재계산됩니다.
        변경 후 <strong>저장 후 pricing 재생성</strong> 버튼을 눌러야 웹사이트 가격이 업데이트됩니다.
      </div>

      {/* 저장/에러 메시지 */}
      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-2xl text-sm font-medium border flex items-center justify-between ${
          msg.type === 'ok'
            ? 'bg-white text-success border-[#34C75933]'
            : 'bg-white text-danger border-[#FF3B3033]'
        }`}>
          <span>{msg.text}</span>
          <button type="button" onClick={() => setMsg(null)} className="ml-3 text-text-muted hover:text-text-sub text-lg leading-none">✕</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {(['installment', 'lease', 'rent'] as const).map((pt) => {
            const row = rows.find((r) => r.product_type === pt);
            const f = forms[pt] ?? {};
            const label = PRODUCT_LABELS[pt];
            const isSaving = saving === pt;

            if (!row) {
              return (
                <div key={pt} className="rounded-2xl border border-border-solid bg-white p-4">
                  <p className="text-sm text-text-muted">{label?.name} — finance_rates 데이터 없음</p>
                </div>
              );
            }

            return (
              <div key={pt} className="rounded-2xl border border-border-solid bg-white overflow-hidden">
                {/* 카드 헤더 */}
                <div className={`px-5 py-3 border-b border-border-solid ${label?.color}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text">{label?.name}</span>
                    <span className="text-xs text-text-sub">
                      적용일: {row.effective_from}
                    </span>
                  </div>
                </div>

                {/* 편집 필드 */}
                <div className="px-5 py-4 space-y-3">
                  <InputRow
                    label="연이율"
                    value={f.annual_rate ?? ''}
                    onChange={(v) => setField(pt, 'annual_rate', v)}
                    suffix="%"
                    hint="예) 5.5 → DB에 0.055로 저장"
                  />

                  {(pt === 'lease' || pt === 'rent') && (
                    <InputRow
                      label="잔존가치율"
                      value={f.residual_rate ?? ''}
                      onChange={(v) => setField(pt, 'residual_rate', v)}
                      suffix="%"
                      hint="차량가의 몇 %를 잔존가로 처리"
                    />
                  )}

                  {pt === 'lease' && (
                    <InputRow
                      label="보증금 비율"
                      value={f.deposit_rate ?? ''}
                      onChange={(v) => setField(pt, 'deposit_rate', v)}
                      suffix="%"
                      hint="차량가 × 비율 = 보증금"
                    />
                  )}

                  {pt === 'rent' && (
                    <>
                      <InputRow
                        label="관리비율"
                        value={f.insurance_rate ?? ''}
                        onChange={(v) => setField(pt, 'insurance_rate', v)}
                        suffix="%"
                        hint="보험+정비+세금 포함 월납입 할증"
                      />
                      <InputRow
                        label="초과주행 할증"
                        value={f.mileage_surcharge_rate ?? ''}
                        onChange={(v) => setField(pt, 'mileage_surcharge_rate', v)}
                        suffix="%"
                        hint="기준거리 초과 시 월납입 할증"
                      />
                      <div className="flex items-center gap-3">
                        <label className="w-36 shrink-0 text-sm text-text-sub">기준 주행거리</label>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            step="1000"
                            value={f.mileage_base_km ?? ''}
                            onChange={(e) => setField(pt, 'mileage_base_km', e.target.value)}
                            className="w-28 bg-surface-secondary border border-border-solid rounded-[10px] text-sm px-3 py-2 outline-none focus:border-primary text-right"
                          />
                          <span className="text-sm text-text-sub">km/년</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* 메모 */}
                  <div className="flex items-start gap-3">
                    <label className="w-36 shrink-0 text-sm text-text-sub pt-2">메모</label>
                    <input
                      type="text"
                      value={f.memo ?? ''}
                      onChange={(e) => setField(pt, 'memo', e.target.value)}
                      placeholder="내부 메모 (선택)"
                      className="flex-1 bg-surface-secondary border border-border-solid rounded-[10px] text-sm px-3 py-2 outline-none focus:border-primary"
                    />
                  </div>
                </div>

                {/* 저장 버튼 */}
                <div className="px-5 py-3 border-t border-border-solid bg-surface-secondary flex gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleSave(pt, false)}
                    disabled={isSaving || generating}
                    className="px-4 py-2 rounded-[10px] border border-border-solid bg-white text-sm font-semibold text-text hover:bg-gray-50 disabled:opacity-50"
                  >
                    {isSaving && !generating ? '저장 중...' : '저장'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave(pt, true)}
                    disabled={isSaving || generating}
                    className="px-4 py-2 rounded-[10px] bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {generating ? 'pricing 재생성 중...' : '저장 후 pricing 재생성'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 하단 설명 */}
      <div className="mt-6 px-4 py-3 rounded-2xl bg-white border border-border-solid text-xs text-text-sub space-y-1">
        <p><strong>저장</strong>: finance_rates 테이블만 업데이트. 웹사이트 가격은 다음 크롤링 시 반영.</p>
        <p><strong>저장 후 pricing 재생성</strong>: 저장 + 전체 차량 pricing 테이블 즉시 재계산. 약 15~30초 소요.</p>
        <p><strong>전체 pricing 재생성</strong>: 현재 저장된 금융 조건 기준으로 pricing만 재생성 (저장 없음).</p>
      </div>
    </div>
  );
}
