'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { VEHICLE_LIST } from '@/constants/vehicles';
import { VehicleEditor } from '@/components/admin/VehicleEditor';

interface VehicleSummary {
  slug: string;
  brand: string;
  model: string;
  thumbnailUrl: string | null;
  minCarPrice: number | null;
  maxCarPrice: number | null;
  priceCount: number;
  isCustom: boolean;
  isVisible: boolean;
  displayOrder: number;
}

const STATIC_BRANDS = ['현대', '기아', '제네시스'] as const;
const CONTRACT_MONTHS = [36, 48, 60] as const;
const ANNUAL_KM = [10000, 20000, 30000, 40000] as const;
const FALLBACK_SLUGS = [
  'avante', 'tucson', 'k5', 'sportage', 'sorento',
  'ioniq5', 'grandeur', 'santafe', 'k8', 'palisade', 'ioniq6', 'carnival',
];

// CSV 파싱 (quoted fields 지원)
function parseCsvRow(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (line[i] === ',' && !inQuotes) {
      result.push(current); current = '';
    } else {
      current += line[i];
    }
  }
  result.push(current);
  return result;
}

export default function AdminPricesPage() {
  const [summaries, setSummaries] = useState<VehicleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBrands, setExpandedBrands] = useState<Set<string>>(new Set(['현대']));
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [addForm, setAddForm] = useState<{ brand: string; model: string } | null>(null);
  const [addSaving, setAddSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [popularItems, setPopularItems] = useState<VehicleSummary[]>([]);
  const [popularOpen, setPopularOpen] = useState(false);
  const [popularSaving, setPopularSaving] = useState(false);
  const [popularSavedMsg, setPopularSavedMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const [{ data: dbVehicles }, { data: prices }] = await Promise.all([
        supabase.from('vehicles').select('slug, image_url, min_price, max_price, is_active, display_order, manufacturer, name'),
        supabase.from('pricing').select('car_brand, car_model').eq('is_active', true),
      ]);

      const settingMap = new Map(
        (dbVehicles ?? []).filter((s: Record<string, unknown>) => s.slug != null).map((s: Record<string, unknown>) => [s.slug as string, s])
      );

      const priceCountMap = new Map<string, number>();
      for (const p of (prices ?? []) as { car_brand: string; car_model: string }[]) {
        const key = `${p.car_brand}||${p.car_model}`;
        priceCountMap.set(key, (priceCountMap.get(key) ?? 0) + 1);
      }

      const brandLocalIdx: Record<string, number> = {};
      const list: VehicleSummary[] = VEHICLE_LIST.map((v) => {
        const pos = brandLocalIdx[v.brand] ?? 0;
        brandLocalIdx[v.brand] = pos + 1;
        const s = settingMap.get(v.slug) as Record<string, unknown> | undefined;
        return {
          slug: v.slug,
          brand: v.brand,
          model: v.model,
          thumbnailUrl: (s?.image_url as string) ?? null,
          minCarPrice: s?.min_price != null ? (s.min_price as number) * 10000 : null,
          maxCarPrice: s?.max_price != null ? (s.max_price as number) * 10000 : null,
          priceCount: priceCountMap.get(`${v.brand}||${v.model}`) ?? 0,
          isCustom: false,
          isVisible: (s?.is_active as boolean) ?? true,
          displayOrder: (s?.display_order as number) ?? pos * 1000,
        };
      });

      const vehicleListSlugs = new Set(VEHICLE_LIST.map((v) => v.slug));
      for (const s of (dbVehicles ?? []) as Record<string, unknown>[]) {
        if (!vehicleListSlugs.has(s.slug as string) && s.manufacturer && s.name) {
          list.push({
            slug: s.slug as string,
            brand: s.manufacturer as string,
            model: s.name as string,
            thumbnailUrl: (s.image_url as string) ?? null,
            minCarPrice: s.min_price != null ? (s.min_price as number) * 10000 : null,
            maxCarPrice: s.max_price != null ? (s.max_price as number) * 10000 : null,
            priceCount: priceCountMap.get(`${s.manufacturer}||${s.name}`) ?? 0,
            isCustom: true,
            isVisible: (s.is_active as boolean) ?? true,
            displayOrder: (s.display_order as number) ?? 999,
          });
        }
      }

      setSummaries(list);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const ordered = FALLBACK_SLUGS
      .map((slug) => summaries.find((s) => s.slug === slug))
      .filter((s): s is VehicleSummary => s != null)
      .sort((a, b) => a.displayOrder - b.displayOrder);
    setPopularItems(ordered);
  }, [summaries]);

  const movePopular = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= popularItems.length) return;
    setPopularItems((prev) => {
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const savePopular = async () => {
    setPopularSaving(true);
    setPopularSavedMsg(null);
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.from('vehicles').upsert(
        popularItems.map((v, i) => ({
          slug: v.slug,
          manufacturer: v.brand,
          name: v.model,
          is_active: v.isVisible,
          display_order: i + 1,
          updated_at: new Date().toISOString(),
        })),
        { onConflict: 'slug' }
      );
      try {
        await fetch('/api/admin/revalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: 'all' }) });
      } catch { /* ignore */ }
      setPopularSavedMsg('저장되었습니다');
      await fetchData();
    } catch (err) {
      setPopularSavedMsg(`오류: ${err instanceof Error ? err.message : '저장 실패'}`);
    } finally {
      setPopularSaving(false);
    }
  };

  const allBrands = [
    ...STATIC_BRANDS,
    ...summaries.filter((s) => s.isCustom && !STATIC_BRANDS.includes(s.brand as typeof STATIC_BRANDS[number])).map((s) => s.brand),
  ].filter((b, i, arr) => arr.indexOf(b) === i);

  const toggleBrand = (brand: string) => {
    setExpandedBrands((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand); else next.add(brand);
      return next;
    });
  };

  const handleOpen = (v: VehicleSummary) => {
    setSelectedSlug(v.slug);
    setSelectedBrand(v.isCustom ? v.brand : null);
    setSelectedModel(v.isCustom ? v.model : null);
    setEditorOpen(true);
  };

  const toggleVisible = async (v: VehicleSummary) => {
    const supabase = createBrowserSupabaseClient();
    await supabase.from('vehicles').upsert({
      slug: v.slug,
      manufacturer: v.brand,
      name: v.model,
      is_active: !v.isVisible,
      display_order: v.displayOrder,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'slug' });
    await fetchData();
  };

  const moveOrder = async (brandVehicles: VehicleSummary[], idx: number, dir: -1 | 1) => {
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= brandVehicles.length) return;

    const newOrder = [...brandVehicles];
    [newOrder[idx], newOrder[targetIdx]] = [newOrder[targetIdx], newOrder[idx]];

    const supabase = createBrowserSupabaseClient();
    await Promise.all(
      newOrder.map((v, i) =>
        supabase.from('vehicles').upsert({
          slug: v.slug,
          manufacturer: v.brand,
          name: v.model,
          is_active: v.isVisible,
          display_order: i,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'slug' })
      )
    );
    await fetchData();
  };

  const handleAddVehicle = async () => {
    if (!addForm?.brand.trim() || !addForm?.model.trim()) return;
    setAddSaving(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const slug = `custom-${addForm.brand.trim()}-${addForm.model.trim()}`.replace(/\s+/g, '-');
      await supabase.from('vehicles').upsert({
        slug: slug,
        manufacturer: addForm.brand.trim(),
        name: addForm.model.trim(),
        is_active: true,
        display_order: 999,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'slug' });
      const newBrand = addForm.brand.trim();
      const newModel = addForm.model.trim();
      setAddForm(null);
      await fetchData();
      setSelectedSlug(slug);
      setSelectedBrand(newBrand);
      setSelectedModel(newModel);
      setEditorOpen(true);
      setExpandedBrands((prev) => new Set([...prev, newBrand]));
    } catch {
      // ignore
    } finally {
      setAddSaving(false);
    }
  };

  // CSV 다운로드
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const supabase = createBrowserSupabaseClient();
      const [{ data: dbVehiclesDown }, { data: prices }] = await Promise.all([
        supabase.from('vehicles').select('slug, image_url, min_price, max_price'),
        supabase.from('pricing').select('car_brand, car_model, contract_months, annual_km, min_monthly, max_monthly').eq('is_active', true),
      ]);

      const settingMap = new Map(
        (dbVehiclesDown ?? []).filter((s: Record<string, unknown>) => s.slug != null).map((s: Record<string, unknown>) => [s.slug as string, s])
      );

      const priceMap = new Map<string, { min: number; max: number }>();
      for (const p of (prices ?? []) as { car_brand: string; car_model: string; contract_months: number; annual_km: number; min_monthly: number; max_monthly: number }[]) {
        const key = `${p.car_brand}||${p.car_model}||${p.contract_months}||${p.annual_km}`;
        priceMap.set(key, { min: p.min_monthly, max: p.max_monthly });
      }

      const priceColHeaders = CONTRACT_MONTHS.flatMap((m) =>
        ANNUAL_KM.flatMap((k) => [`${m}m_${k / 10000}만km_최소(원)`, `${m}m_${k / 10000}만km_최대(원)`])
      );
      const headers = ['slug', '제조사', '차종명', '썸네일URL', '최소차량가격(만원)', '최대차량가격(만원)', '노출여부(TRUE/FALSE)', '노출순서', ...priceColHeaders];

      const dataRows = summaries.map((v) => {
        const s = settingMap.get(v.slug) as Record<string, unknown> | undefined;
        const priceCols = CONTRACT_MONTHS.flatMap((m) =>
          ANNUAL_KM.flatMap((k) => {
            const p = priceMap.get(`${v.brand}||${v.model}||${m}||${k}`);
            return [p?.min ?? '', p?.max ?? ''];
          })
        );
        return [
          v.slug,
          v.brand,
          v.model,
          (s?.image_url as string) ?? '',
          s?.min_price != null ? (s.min_price as number) : '',
          s?.max_price != null ? (s.max_price as number) : '',
          v.isVisible ? 'TRUE' : 'FALSE',
          v.displayOrder,
          ...priceCols,
        ];
      });

      const csv = [headers, ...dataRows]
        .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `인기차종_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  // CSV 업로드
  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadResult(null);
    try {
      const text = await file.text();
      const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((l) => l.trim());
      if (lines.length < 2) throw new Error('데이터가 없습니다');

      const rows = lines.slice(1).map(parseCsvRow).filter((r) => r[0]?.trim());

      const supabase = createBrowserSupabaseClient();

      // slug로 VEHICLE_LIST 조회 (인코딩 깨짐 방지: 한글 brand/model은 CSV 대신 VEHICLE_LIST 사용)
      const getCanonical = (slug: string) => VEHICLE_LIST.find((v) => v.slug === slug) ?? null;

      // 1. vehicles 일괄 upsert
      const settingsToUpsert = rows
        .map((row) => {
          const slug = row[0]?.trim();
          const canonical = slug ? getCanonical(slug) : null;
          const brand = canonical?.brand ?? row[1]?.trim();
          const model = canonical?.model ?? row[2]?.trim();
          return {
            slug: slug,
            manufacturer: brand,
            name: model,
            image_url: row[3]?.trim() || null,
            min_price: row[4]?.trim() ? Number(row[4].trim().replace(/,/g, '')) : null,
            max_price: row[5]?.trim() ? Number(row[5].trim().replace(/,/g, '')) : null,
            is_active: row[6]?.trim().toUpperCase() !== 'FALSE',
            display_order: parseInt(row[7]) || 0,
            updated_at: new Date().toISOString(),
          };
        })
        .filter((s) => s.slug && s.manufacturer && s.name);

      if (settingsToUpsert.length > 0) {
        const { error: settingsError } = await supabase
          .from('vehicles')
          .upsert(settingsToUpsert, { onConflict: 'slug' });
        if (settingsError) throw new Error(`설정 저장 실패: ${settingsError.message}`);
      }

      // 2. pricing: 기존 비활성화 후 신규 삽입 (DELETE 권한 불필요)
      let priceUpdated = 0;
      const priceErrors: string[] = [];

      for (const row of rows) {
        const slug = row[0]?.trim();
        const canonical = slug ? getCanonical(slug) : null;
        const brand = canonical?.brand ?? row[1]?.trim();
        const model = canonical?.model ?? row[2]?.trim();
        if (!brand || !model) continue;

        const toInsert: Record<string, unknown>[] = [];
        let colIdx = 8;
        for (const months of CONTRACT_MONTHS) {
          for (const km of ANNUAL_KM) {
            const minVal = parseInt(row[colIdx]?.replace(/,/g, '') ?? '') || 0;
            const maxVal = parseInt(row[colIdx + 1]?.replace(/,/g, '') ?? '') || 0;
            colIdx += 2;
            if (minVal || maxVal) {
              toInsert.push({ car_brand: brand, car_model: model, contract_months: months, annual_km: km, min_monthly: minVal, max_monthly: maxVal, is_active: true });
            }
          }
        }

        if (toInsert.length > 0) {
          // 기존 레코드 비활성화
          const { error: deactivateError } = await supabase
            .from('pricing')
            .update({ is_active: false })
            .eq('car_brand', brand)
            .eq('car_model', model)
            .eq('is_active', true);

          if (deactivateError) {
            priceErrors.push(`${model} 비활성화 실패: ${deactivateError.message}`);
            continue;
          }

          // 신규 삽입
          const { error: insertError } = await supabase.from('pricing').insert(toInsert);
          if (insertError) {
            priceErrors.push(`${model} 가격 저장 실패: ${insertError.message}`);
            continue;
          }
          priceUpdated++;
        }
      }

      try {
        await fetch('/api/admin/revalidate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug: 'all' }) });
      } catch { /* ignore */ }

      await fetchData();

      if (priceErrors.length > 0) {
        setUploadResult(`부분 완료: ${settingsToUpsert.length}개 설정, ${priceUpdated}개 가격 업데이트\n오류: ${priceErrors.join(' / ')}`);
      } else {
        setUploadResult(`완료: ${settingsToUpsert.length}개 차종 설정, ${priceUpdated}개 차종 가격 업데이트`);
      }
    } catch (err) {
      setUploadResult(`오류: ${err instanceof Error ? err.message : '업로드 실패'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto p-5">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <h1 className="text-xl font-bold text-text tracking-tight">인기차종 관리</h1>
        <div className="flex items-center gap-2 flex-wrap">
          {/* CSV 다운로드 */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading || loading}
            className="px-3 py-2 rounded-[10px] border border-border-solid bg-white text-sm font-semibold text-text hover:bg-surface-secondary disabled:opacity-50 whitespace-nowrap"
          >
            {downloading ? '다운로드 중...' : '⬇ CSV 다운로드'}
          </button>
          {/* CSV 업로드 */}
          <label className={`px-3 py-2 rounded-[10px] border border-border-solid bg-white text-sm font-semibold text-text hover:bg-surface-secondary cursor-pointer whitespace-nowrap ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploading ? '업로드 중...' : '⬆ CSV 업로드'}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
            />
          </label>
          {/* 새 차종 추가 */}
          <button
            type="button"
            onClick={() => setAddForm({ brand: '', model: '' })}
            className="px-3 py-2 rounded-[10px] bg-primary text-white text-sm font-semibold hover:opacity-90 whitespace-nowrap"
          >
            + 새 차종 추가
          </button>
        </div>
      </div>

      {/* 업로드 결과 */}
      {uploadResult && (
        <div className={`mb-4 px-4 py-3 rounded-2xl text-sm font-medium border ${uploadResult.startsWith('오류') ? 'bg-white text-danger border-[#FF3B3033]' : 'bg-white text-success border-[#34C75933]'}`}>
          {uploadResult}
          <button type="button" onClick={() => setUploadResult(null)} className="ml-3 text-text-muted hover:text-text-sub">✕</button>
        </div>
      )}

      {/* 새 차종 추가 폼 */}
      {addForm && (
        <div className="mb-4 p-5 rounded-2xl border border-border-solid bg-white">
          <p className="text-sm font-bold text-text mb-3">새 차종 추가</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="제조사 (예: BMW)"
              value={addForm.brand}
              onChange={(e) => setAddForm((f) => f ? { ...f, brand: e.target.value } : f)}
              className="flex-1 bg-surface-secondary border border-border-solid rounded-[10px] text-sm px-[14px] py-[10px] outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder="차종명 (예: 5시리즈)"
              value={addForm.model}
              onChange={(e) => setAddForm((f) => f ? { ...f, model: e.target.value } : f)}
              className="flex-1 bg-surface-secondary border border-border-solid rounded-[10px] text-sm px-[14px] py-[10px] outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={handleAddVehicle}
              disabled={addSaving}
              className="px-4 py-2 rounded-[10px] bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 whitespace-nowrap"
            >
              {addSaving ? '추가 중...' : '추가'}
            </button>
            <button
              type="button"
              onClick={() => setAddForm(null)}
              className="px-3 py-2 rounded-[10px] text-sm font-semibold text-text-sub hover:bg-surface-secondary"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* CSV 형식 안내 */}
      <div className="mb-4 px-4 py-3 rounded-2xl bg-white border border-border-solid text-xs text-text-sub">
        CSV 컬럼 순서: slug · 제조사 · 차종명 · 썸네일URL · 최소차량가격(만원) · 최대차량가격(만원) · 노출여부(TRUE/FALSE) · 노출순서 · [36m/48m/60m × 1/2/3/4만km 최소·최대(원) 각 2열씩 총 24열]
      </div>

      {/* 인기차종 순위 관리 */}
      <div className="mb-4 rounded-2xl border border-border-solid bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setPopularOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface-secondary transition-colors"
        >
          <span className="font-bold text-text">인기차종 순위</span>
          <span className="text-text-sub text-sm">{popularOpen ? '▼' : '▶'}</span>
        </button>
        {popularOpen && (
          <div className="border-t border-border-solid">
            {popularSavedMsg && (
              <div className={`mx-4 mt-3 px-4 py-2 rounded-xl text-sm font-medium border ${popularSavedMsg.startsWith('오류') ? 'text-danger border-[#FF3B3033]' : 'text-success border-[#34C75933]'}`}>
                {popularSavedMsg}
                <button type="button" onClick={() => setPopularSavedMsg(null)} className="ml-3 text-text-muted hover:text-text-sub">✕</button>
              </div>
            )}
            <div className="divide-y divide-[#E5E5EA]">
              {popularItems.map((item, idx) => {
                const rank = idx + 1;
                const rankColor = rank === 1 ? '#FFB800' : rank === 2 ? '#8E8E93' : rank === 3 ? '#CD7F32' : '#AEAEB2';
                return (
                  <div key={item.slug} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-secondary">
                    <div className="w-6 text-center font-bold text-sm shrink-0" style={{ color: rankColor }}>{rank}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text text-sm">{item.model}</p>
                      <p className="text-xs text-text-sub">{item.brand}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button type="button" onClick={() => movePopular(idx, -1)} disabled={idx === 0}
                        className="w-7 h-7 flex items-center justify-center rounded-[10px] text-text-sub hover:bg-[#E5E5EA] disabled:opacity-30 text-xs">▲</button>
                      <button type="button" onClick={() => movePopular(idx, 1)} disabled={idx === popularItems.length - 1}
                        className="w-7 h-7 flex items-center justify-center rounded-[10px] text-text-sub hover:bg-[#E5E5EA] disabled:opacity-30 text-xs">▼</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="px-4 py-3 border-t border-border-solid">
              <button type="button" onClick={savePopular} disabled={popularSaving}
                className="px-4 py-2 rounded-[10px] bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50">
                {popularSaving ? '저장 중...' : '순위 저장'}
              </button>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-2">
          {allBrands.map((brand) => {
            const vehicles = summaries
              .filter((s) => s.brand === brand)
              .sort((a, b) => a.displayOrder - b.displayOrder);
            if (vehicles.length === 0) return null;
            const isExpanded = expandedBrands.has(brand);
            const registeredCount = vehicles.filter((v) => v.priceCount > 0).length;
            return (
              <div key={brand} className="rounded-2xl border border-border-solid bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => toggleBrand(brand)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-surface-secondary transition-colors"
                >
                  <span className="font-bold text-text">{brand}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-text-sub">{registeredCount}/{vehicles.length} 등록</span>
                    <span className="text-text-sub text-sm">{isExpanded ? '▼' : '▶'}</span>
                  </div>
                </button>
                {isExpanded && (
                  <div className="border-t border-border-solid divide-y divide-[#E5E5EA]">
                    {vehicles.map((v, idx) => (
                      <div key={v.slug} className="flex items-center gap-2 px-3 py-2 hover:bg-surface-secondary">
                        <button
                          type="button"
                          onClick={() => handleOpen(v)}
                          className="flex items-center gap-3 flex-1 min-w-0 text-left"
                        >
                          <div className="shrink-0 w-14 h-9 rounded-[10px] bg-surface-secondary overflow-hidden flex items-center justify-center border border-border-solid">
                            {v.thumbnailUrl ? (
                              <img src={v.thumbnailUrl} alt={v.model} className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-[#D1D1D6] text-base">🚗</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-text text-sm truncate">{v.model}</p>
                            {v.minCarPrice ? (
                              <p className="text-xs text-text-sub">
                                {Math.round(v.minCarPrice / 10000).toLocaleString()}~{Math.round((v.maxCarPrice ?? 0) / 10000).toLocaleString()}만원
                              </p>
                            ) : (
                              <p className="text-xs text-text-muted">차량가격 미등록</p>
                            )}
                          </div>
                          <div className="shrink-0 mr-1">
                            {v.priceCount > 0 ? (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">{v.priceCount}건</span>
                            ) : (
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-secondary text-text-muted">미등록</span>
                            )}
                          </div>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => toggleVisible(v)}
                            className={`text-xs px-2 py-1 rounded-[10px] font-semibold transition-colors ${v.isVisible ? 'bg-success/10 text-success hover:bg-[#34C75926]' : 'bg-surface-secondary text-text-muted hover:bg-[#E5E5EA]'}`}
                          >
                            {v.isVisible ? '노출' : '비노출'}
                          </button>
                          <button
                            type="button"
                            onClick={() => moveOrder(vehicles, idx, -1)}
                            disabled={idx === 0}
                            className="w-7 h-7 flex items-center justify-center rounded-[10px] text-text-sub hover:bg-surface-secondary disabled:opacity-30 text-xs"
                          >▲</button>
                          <button
                            type="button"
                            onClick={() => moveOrder(vehicles, idx, 1)}
                            disabled={idx === vehicles.length - 1}
                            className="w-7 h-7 flex items-center justify-center rounded-[10px] text-text-sub hover:bg-surface-secondary disabled:opacity-30 text-xs"
                          >▼</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {editorOpen && (
          <VehicleEditor
            key={selectedSlug}
            vehicleSlug={selectedSlug}
            isOpen={editorOpen}
            onClose={() => { setEditorOpen(false); setSelectedSlug(null); setSelectedBrand(null); setSelectedModel(null); }}
            onSuccess={fetchData}
            customBrand={selectedBrand ?? undefined}
            customModel={selectedModel ?? undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
