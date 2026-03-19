'use client';

import { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { PromotionForm, type PromotionData } from '@/components/admin/PromotionForm';

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<PromotionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<PromotionData | null>(null);

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error: err } = await supabase
        .from('promotions')
        .select('id, title, description, image_url, link_url, is_active, display_order, start_date, end_date')
        .order('display_order', { ascending: true });

      if (err) throw err;
      setPromotions((data as PromotionData[]) ?? []);
    } catch (err) {
      const msg = err instanceof Error
        ? err.message
        : (err as { message?: string })?.message ?? '목록 로드 실패';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
  }, [fetchPromotions]);

  const handleAddNew = () => {
    setEditingPromotion(null);
    setFormOpen(true);
  };

  const handleEdit = (promotion: PromotionData) => {
    setEditingPromotion(promotion);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingPromotion(null);
  };

  const handleToggleActive = async (promotion: PromotionData) => {
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase
        .from('promotions')
        .update({ is_active: !promotion.is_active })
        .eq('id', promotion.id);
      fetchPromotions();
    } catch {
      setError('토글 실패');
    }
  };

  function formatDateRange(start: string | null, end: string | null): string {
    if (!start && !end) return '—';
    if (!start) return `~ ${end}`;
    if (!end) return `${start} ~`;
    return `${start} ~ ${end}`;
  }

  return (
    <div className="max-w-[1200px] mx-auto p-5">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#1D1D1F] tracking-tight">프로모션 관리</h1>
        <button
          type="button"
          onClick={handleAddNew}
          className="px-4 py-2 rounded-[10px] font-semibold bg-[#007AFF] text-white hover:opacity-90 transition-opacity"
        >
          새 프로모션 추가
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-2xl bg-white border border-[#FF3B3033] p-4">
          <p className="text-danger font-medium">{error}</p>
        </div>
      ) : promotions.length === 0 ? (
        <div className="rounded-2xl bg-white border border-[#E5E5EA] p-12 text-center">
          <p className="text-[#86868B] mb-2">등록된 프로모션이 없습니다</p>
          <p className="text-[#AEAEB2] text-sm mb-4">새 프로모션을 추가해 주세요</p>
          <button
            type="button"
            onClick={handleAddNew}
            className="px-4 py-2 rounded-[10px] font-semibold bg-[#007AFF] text-white hover:opacity-90"
          >
            새 프로모션 추가
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="flex items-center gap-3 p-3 rounded-2xl border border-[#E5E5EA] bg-white hover:border-[#007AFF] transition-all"
            >
              {/* 썸네일 */}
              <div className="shrink-0 w-14 h-14 rounded-[10px] overflow-hidden bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center">
                {promo.image_url ? (
                  <img
                    src={promo.image_url}
                    alt={promo.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-[#AEAEB2] text-2xl">📷</span>
                )}
              </div>
              {/* 제목 + 날짜 */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-[#1D1D1F] truncate">{promo.title}</h3>
                <p className="text-xs text-[#86868B] mt-0.5">
                  {formatDateRange(promo.start_date, promo.end_date)}
                </p>
              </div>
              {/* 상태 + 토글 + 수정 */}
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    promo.is_active ? 'bg-[#34C7591A] text-[#34C759]' : 'bg-[#F5F5F7] text-[#86868B]'
                  }`}
                >
                  {promo.is_active ? '노출중' : '비노출'}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleActive(promo)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    promo.is_active ? 'bg-[#007AFF]' : 'bg-[#D1D1D6]'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                      promo.is_active ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => handleEdit(promo)}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#F5F5F7] text-[#1D1D1F] hover:bg-[#E5E5EA] transition-colors"
                >
                  수정
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {formOpen && (
          <PromotionForm
            key={editingPromotion?.id ?? 'new'}
            promotion={editingPromotion}
            isOpen={formOpen}
            onClose={handleCloseForm}
            onSuccess={fetchPromotions}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
