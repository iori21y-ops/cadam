'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase';

export interface PromotionData {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
  start_date: string | null;
  end_date: string | null;
}

interface PromotionFormProps {
  promotion: PromotionData | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PromotionForm({
  promotion,
  isOpen,
  onClose,
  onSuccess,
}: PromotionFormProps) {
  const isEdit = promotion !== null;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (promotion) {
      setTitle(promotion.title);
      setDescription(promotion.description ?? '');
      setImageUrl(promotion.image_url ?? '');
      setLinkUrl(promotion.link_url ?? '');
      setStartDate(promotion.start_date ?? '');
      setEndDate(promotion.end_date ?? '');
      setDisplayOrder(promotion.display_order ?? 0);
      setIsActive(promotion.is_active);
    } else {
      setTitle('');
      setDescription('');
      setImageUrl('');
      setLinkUrl('');
      setStartDate('');
      setEndDate('');
      setDisplayOrder(0);
      setIsActive(true);
    }
    setError(null);
    setShowDeleteConfirm(false);
  }, [promotion, isOpen]);

  const supabase = createBrowserSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError('제목을 입력해 주세요');
      return;
    }
    if (!startDate) {
      setError('시작일을 선택해 주세요');
      return;
    }
    if (!endDate) {
      setError('종료일을 선택해 주세요');
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('시작일은 종료일보다 이전이어야 합니다');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        title: trimmedTitle,
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        link_url: linkUrl.trim() || null,
        start_date: startDate,
        end_date: endDate,
        display_order: displayOrder,
        is_active: isActive,
      };

      if (isEdit && promotion) {
        const { error: err } = await supabase
          .from('promotions')
          .update(payload)
          .eq('id', promotion.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase.from('promotions').insert(payload);
        if (err) throw err;
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '저장 실패');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!promotion) return;
    setSaving(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('promotions')
        .delete()
        .eq('id', promotion.id);
      if (err) throw err;
      onSuccess();
      onClose();
      setShowDeleteConfirm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '삭제 실패');
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={false}
      animate={false}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className="absolute inset-0 bg-black/30"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'tween', duration: 0.25 }}
        className="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-xl flex flex-col"
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? '프로모션 수정' : '새 프로모션 추가'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            닫기
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              제목 <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="프로모션 제목"
              className="w-full py-2.5 px-3 border border-gray-300 rounded-lg outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="설명 (선택)"
              className="w-full py-2.5 px-3 border border-gray-300 rounded-lg outline-none focus:border-accent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              이미지 URL
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full py-2.5 px-3 border border-gray-300 rounded-lg outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              링크 URL
            </label>
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://..."
              className="w-full py-2.5 px-3 border border-gray-300 rounded-lg outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              시작일 <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full py-2.5 px-3 border border-gray-300 rounded-lg outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              종료일 <span className="text-danger">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full py-2.5 px-3 border border-gray-300 rounded-lg outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              정렬 순서
            </label>
            <input
              type="number"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(Number(e.target.value) || 0)}
              min={0}
              className="w-full py-2.5 px-3 border border-gray-300 rounded-lg outline-none focus:border-accent"
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700">
              활성 여부 <span className="text-danger">*</span>
            </label>
            <button
              type="button"
              role="switch"
              aria-checked={isActive}
              onClick={() => setIsActive(!isActive)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                isActive ? 'bg-accent' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  isActive ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg font-bold bg-accent text-white hover:opacity-90 disabled:opacity-60"
            >
              {saving ? '저장 중...' : isEdit ? '수정' : '등록'}
            </button>
            {isEdit && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={saving}
                className="px-4 py-2.5 rounded-lg font-semibold text-danger border border-danger hover:bg-danger/10 disabled:opacity-60"
              >
                삭제
              </button>
            )}
          </div>
        </form>
      </motion.div>

      {/* 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <>
          <div
            className="fixed inset-0 bg-black/30 z-[60]"
            onClick={() => setShowDeleteConfirm(false)}
            aria-hidden="true"
          />
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-xl">
              <p className="text-gray-900 font-semibold mb-4">
                정말 삭제하시겠습니까?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-lg font-semibold bg-danger text-white hover:opacity-90 disabled:opacity-60"
                >
                  {saving ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
