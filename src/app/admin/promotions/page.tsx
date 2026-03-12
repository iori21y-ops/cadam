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
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (err) throw err;
      setPromotions((data as PromotionData[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '목록 로드 실패');
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
        <h1 className="text-xl font-bold text-primary">프로모션 관리</h1>
        <button
          type="button"
          onClick={handleAddNew}
          className="px-4 py-2 rounded-lg font-bold bg-accent text-white hover:opacity-90 transition-opacity"
        >
          새 프로모션 추가
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-4">
          <p className="text-danger font-medium">{error}</p>
        </div>
      ) : promotions.length === 0 ? (
        <div className="rounded-xl bg-white border border-gray-200 p-12 text-center">
          <p className="text-gray-500 mb-2">등록된 프로모션이 없습니다</p>
          <p className="text-gray-400 text-sm mb-4">새 프로모션을 추가해 주세요</p>
          <button
            type="button"
            onClick={handleAddNew}
            className="px-4 py-2 rounded-lg font-semibold bg-accent text-white hover:opacity-90"
          >
            새 프로모션 추가
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {promotions.map((promo) => (
            <div
              key={promo.id}
              onClick={() => handleEdit(promo)}
              className="rounded-xl border border-gray-200 bg-white overflow-hidden hover:border-accent hover:shadow-md transition-all cursor-pointer"
            >
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {promo.image_url ? (
                  <img
                    src={promo.image_url}
                    alt={promo.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-400 text-4xl">📷</span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-bold text-gray-900 truncate mb-2">{promo.title}</h3>
                <p className="text-xs text-gray-500 mb-3">
                  {formatDateRange(promo.start_date, promo.end_date)}
                </p>
                <div
                  className="flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded ${
                      promo.is_active ? 'bg-success/20 text-success' : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {promo.is_active ? '노출중' : '비노출'}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleActive(promo);
                    }}
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      promo.is_active ? 'bg-accent' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        promo.is_active ? 'left-5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
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
