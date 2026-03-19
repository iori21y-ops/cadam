'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { VEHICLE_LIST } from '@/constants/vehicles';

interface InfoCategory {
  id: string;
  value: string;
  label: string;
  display_order: number;
}

interface InfoArticle {
  id: string;
  title: string;
  excerpt: string | null;
  link_url: string;
  thumbnail_url: string | null;
  source_type: string | null;
  published_at: string | null;
  is_active: boolean;
  display_order: number;
  category: string;
  vehicle_slug: string | null;
}

function parseUrl(url: string): { sourceType: string; thumbnailUrl: string | null } {
  try {
    const lower = url.trim().toLowerCase();
    if (
      lower.includes('youtube.com/watch') ||
      lower.includes('youtu.be/') ||
      lower.includes('youtube.com/shorts/')
    ) {
      let videoId: string | null = null;
      const watchMatch = url.match(/[?&]v=([^&]+)/);
      const shortMatch = url.match(/youtu\.be\/([^?]+)/);
      const shortsMatch = url.match(/youtube\.com\/shorts\/([^?]+)/);
      if (watchMatch) videoId = watchMatch[1];
      else if (shortMatch) videoId = shortMatch[1];
      else if (shortsMatch) videoId = shortsMatch[1];
      const thumbnail = videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : null;
      return { sourceType: 'youtube', thumbnailUrl: thumbnail };
    }
    return { sourceType: 'blog', thumbnailUrl: null };
  } catch {
    return { sourceType: 'blog', thumbnailUrl: null };
  }
}


const BRANDS = ['현대', '기아', '제네시스'] as const;

function getVehicleLabel(slug: string | null): string {
  if (!slug) return '';
  const v = VEHICLE_LIST.find((v) => v.slug === slug);
  return v ? `${v.brand} ${v.model}` : slug;
}

interface EditState {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  vehicle_slug: string;
  saving: boolean;
}

export default function AdminInfoPage() {
  const [articles, setArticles] = useState<InfoArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [categories, setCategories] = useState<InfoCategory[]>([]);
  const [newCatValue, setNewCatValue] = useState('');
  const [newCatLabel, setNewCatLabel] = useState('');
  const [catSaving, setCatSaving] = useState(false);
  const [catError, setCatError] = useState<string | null>(null);

  const [urlInput, setUrlInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [excerptInput, setExcerptInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('rental');
  const [vehicleSlugInput, setVehicleSlugInput] = useState('');
  const [brandFilter, setBrandFilter] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [editState, setEditState] = useState<EditState | null>(null);
  const [editBrandFilter, setEditBrandFilter] = useState<string>('');

  const fetchCategories = useCallback(async () => {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase
      .from('info_categories')
      .select('*')
      .order('display_order', { ascending: true });
    setCategories((data as InfoCategory[]) ?? []);
  }, []);

  const handleAddCategory = async () => {
    const val = newCatValue.trim().toLowerCase().replace(/\s+/g, '-');
    const lbl = newCatLabel.trim();
    if (!val || !lbl) { setCatError('슬러그와 표시명을 모두 입력해 주세요'); return; }
    if (!/^[a-z0-9-]+$/.test(val)) { setCatError('슬러그는 영문 소문자, 숫자, 하이픈만 사용 가능합니다'); return; }
    setCatSaving(true);
    setCatError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: err } = await supabase.from('info_categories').insert({
        value: val,
        label: lbl,
        display_order: categories.length + 1,
      });
      if (err) throw err;
      setNewCatValue('');
      setNewCatLabel('');
      fetchCategories();
    } catch (err) {
      setCatError(err instanceof Error ? err.message : '추가 실패');
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('카테고리를 삭제하시겠습니까?')) return;
    const supabase = createBrowserSupabaseClient();
    await supabase.from('info_categories').delete().eq('id', id);
    fetchCategories();
  };

  const fetchArticles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error: err } = await supabase
        .from('info_articles')
        .select('id, title, excerpt, link_url, thumbnail_url, source_type, published_at, is_active, display_order, category, vehicle_slug')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (err) throw err;
      setArticles((data as InfoArticle[]) ?? []);
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
    fetchCategories();
    fetchArticles();
  }, [fetchCategories, fetchArticles]);

  const handleUrlPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').trim();
    if (pasted.startsWith('http://') || pasted.startsWith('https://')) {
      e.preventDefault();
      setUrlInput(pasted);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = urlInput.trim();
    const title = titleInput.trim();
    if (!url || !title) {
      setSubmitError('URL과 제목을 입력해 주세요');
      return;
    }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setSubmitError('올바른 URL을 입력해 주세요');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { sourceType, thumbnailUrl } = parseUrl(url);
      const supabase = createBrowserSupabaseClient();
      const { error: err } = await supabase.from('info_articles').insert({
        title,
        excerpt: excerptInput.trim() || null,
        link_url: url,
        thumbnail_url: thumbnailUrl,
        source_type: sourceType,
        is_active: true,
        display_order: articles.length,
        category: categoryInput,
        vehicle_slug: categoryInput === 'car' ? (vehicleSlugInput || null) : null,
      });

      if (err) throw err;
      setUrlInput('');
      setTitleInput('');
      setExcerptInput('');
      setCategoryInput('rental');
      setVehicleSlugInput('');
      fetchArticles();
    } catch (err) {
      const msg = err instanceof Error
        ? err.message
        : (err as { message?: string })?.message ?? '등록 실패';
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase
        .from('info_articles')
        .update({ is_active: !isActive, updated_at: new Date().toISOString() })
        .eq('id', id);
      fetchArticles();
    } catch {
      // ignore
    }
  };

  const handleEditSave = async () => {
    if (!editState) return;
    const title = editState.title.trim();
    if (!title) return;
    setEditState((prev) => prev ? { ...prev, saving: true } : null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { error: err } = await supabase
        .from('info_articles')
        .update({
          title,
          excerpt: editState.excerpt.trim() || null,
          category: editState.category,
          vehicle_slug: editState.category === 'car' ? (editState.vehicle_slug || null) : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editState.id);
      if (err) throw err;
      setEditState(null);
      fetchArticles();
    } catch {
      setEditState((prev) => prev ? { ...prev, saving: false } : null);
    }
  };

  const getDisplayType = (article: InfoArticle): 'blog' | 'youtube' | 'shorts' => {
    if (article.link_url.includes('youtube.com/shorts/')) return 'shorts';
    if (article.source_type === 'youtube') return 'youtube';
    return 'blog';
  };

  const handleMoveOrder = async (id: string, direction: 'up' | 'down') => {
    const article = articles.find((a) => a.id === id);
    if (!article) return;
    const type = getDisplayType(article);
    const sameType = [...articles]
      .filter((a) => getDisplayType(a) === type)
      .sort((a, b) => a.display_order - b.display_order);
    const idx = sameType.findIndex((a) => a.id === id);
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= sameType.length) return;
    const target = sameType[targetIdx];
    const supabase = createBrowserSupabaseClient();
    await Promise.all([
      supabase.from('info_articles').update({ display_order: target.display_order }).eq('id', id),
      supabase.from('info_articles').update({ display_order: article.display_order }).eq('id', target.id),
    ]);
    fetchArticles();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      const supabase = createBrowserSupabaseClient();
      await supabase.from('info_articles').delete().eq('id', id);
      fetchArticles();
    } catch {
      setError('삭제 실패');
    }
  };

  const getCategoryLabel = (category: string) =>
    categories.find((o) => o.value === category)?.label ?? category;

  return (
    <div className="max-w-[1200px] mx-auto p-5">
      <h1 className="text-xl font-bold text-[#1D1D1F] mb-6 tracking-tight">정보관리</h1>

      {/* 카테고리 관리 */}
      <div className="mb-6 rounded-2xl bg-white border border-[#E5E5EA] p-5 shadow-sm">
        <h2 className="text-base font-bold text-[#1D1D1F] mb-3">카테고리 관리</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {categories.map((cat) => (
            <span
              key={cat.id}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-[#F5F5F7] text-[#1D1D1F] border border-[#E5E5EA]"
            >
              {cat.label}
              <button
                type="button"
                onClick={() => handleDeleteCategory(cat.id)}
                className="text-[#AEAEB2] hover:text-danger transition-colors text-xs leading-none"
                title="삭제"
              >
                ✕
              </button>
            </span>
          ))}
          {categories.length === 0 && (
            <span className="text-sm text-[#AEAEB2]">카테고리 없음</span>
          )}
        </div>
        <div className="flex gap-2 items-start flex-wrap">
          <input
            type="text"
            value={newCatValue}
            onChange={(e) => setNewCatValue(e.target.value)}
            placeholder="슬러그 (예: carnival)"
            className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-[10px] px-3 py-2 text-sm outline-none focus:border-[#007AFF] w-36"
          />
          <input
            type="text"
            value={newCatLabel}
            onChange={(e) => setNewCatLabel(e.target.value)}
            placeholder="표시명 (예: 카니발)"
            className="bg-[#F5F5F7] border border-[#E5E5EA] rounded-[10px] px-3 py-2 text-sm outline-none focus:border-[#007AFF] w-36"
          />
          <button
            type="button"
            onClick={handleAddCategory}
            disabled={catSaving}
            className="px-4 py-2 rounded-[10px] text-sm font-semibold bg-[#007AFF] text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {catSaving ? '추가 중...' : '추가'}
          </button>
        </div>
        {catError && <p className="text-sm text-danger mt-2">{catError}</p>}
      </div>

      {/* 등록 폼 */}
      <div className="mb-8 rounded-2xl bg-white border border-[#E5E5EA] p-5 shadow-sm">
        <h2 className="text-base font-bold text-[#1D1D1F] mb-2">URL 등록</h2>
        <p className="text-sm text-[#86868B] mb-4">
          블로그나 유튜브 등 외부 URL을 붙여넣으면 정보 페이지에 노출됩니다.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 카테고리 */}
          <div>
            <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
              카테고리 <span className="text-danger">*</span>
            </label>
            <div className="flex gap-2">
              {categories.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => { setCategoryInput(opt.value); setVehicleSlugInput(''); setBrandFilter(''); }}
                  className={`px-4 py-2 rounded-[10px] text-sm font-semibold border transition-all ${
                    categoryInput === opt.value
                      ? 'bg-[#007AFF] text-white border-[#007AFF]'
                      : 'bg-white text-[#86868B] border-[#E5E5EA] hover:border-[#007AFF]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 차종 선택 (자동차 카테고리일 때만) */}
          {categoryInput === 'car' && (
            <div>
              <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
                차종 선택 (선택)
              </label>
              {/* 제조사 필터 */}
              <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
                {['전체', ...BRANDS].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => { setBrandFilter(b === '전체' ? '' : b); setVehicleSlugInput(''); }}
                    className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap transition-all ${
                      (b === '전체' ? brandFilter === '' : brandFilter === b)
                        ? 'bg-[#007AFF] text-white border-[#007AFF]'
                        : 'bg-white text-[#86868B] border-[#E5E5EA] hover:border-[#007AFF]'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
              <select
                value={vehicleSlugInput}
                onChange={(e) => setVehicleSlugInput(e.target.value)}
                className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-[10px] px-[14px] py-[10px] outline-none focus:border-[#007AFF] text-sm"
              >
                <option value="">전체 / 미지정</option>
                {(brandFilter ? BRANDS.filter((b) => b === brandFilter) : BRANDS).map((brand) => (
                  <optgroup key={brand} label={brand}>
                    {VEHICLE_LIST.filter((v) => v.brand === brand).map((v) => (
                      <option key={v.slug} value={v.slug}>
                        {v.model}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          {/* URL */}
          <div>
            <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
              URL <span className="text-danger">*</span>
            </label>
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onPaste={handleUrlPaste}
              placeholder="https://blog.naver.com/... 또는 https://www.youtube.com/watch?v=..."
              className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-[10px] px-[14px] py-[10px] outline-none focus:border-[#007AFF]"
            />
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
              제목 <span className="text-danger">*</span>
            </label>
            <input
              type="text"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
              placeholder="예: 장기렌터카 vs 리스, 뭐가 다를까?"
              maxLength={200}
              className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-[10px] px-[14px] py-[10px] outline-none focus:border-[#007AFF]"
            />
          </div>

          {/* 요약 */}
          <div>
            <label className="block text-[11px] font-semibold text-[#86868B] mb-1">
              요약 (선택)
            </label>
            <textarea
              value={excerptInput}
              onChange={(e) => setExcerptInput(e.target.value)}
              placeholder="간단한 설명을 입력하세요"
              rows={2}
              className="w-full bg-[#F5F5F7] border border-[#E5E5EA] rounded-[10px] px-[14px] py-[10px] outline-none focus:border-[#007AFF] resize-none"
            />
          </div>

          {submitError && (
            <p className="text-sm text-danger">{submitError}</p>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-[10px] font-semibold bg-[#007AFF] text-white hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {isSubmitting ? '등록 중...' : '등록'}
          </button>
        </form>
      </div>

      {/* 목록 */}
      <div>
        <h2 className="text-base font-bold text-[#1D1D1F] mb-4">등록된 정보</h2>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#007AFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-2xl bg-white border border-[#FF3B3033] p-4">
            <p className="text-danger font-medium">{error}</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="rounded-2xl bg-white border border-[#E5E5EA] p-8 text-center">
            <p className="text-[#86868B]">등록된 정보가 없습니다</p>
            <p className="text-[#AEAEB2] text-sm mt-1">위 폼에서 URL을 등록해 주세요</p>
          </div>
        ) : (
          <div className="space-y-6">
            {(
              [
                { type: 'blog' as const, label: '블로그' },
                { type: 'youtube' as const, label: '유튜브' },
                { type: 'shorts' as const, label: '쇼츠' },
              ] as const
            ).map(({ type, label }) => {
              const group = [...articles]
                .filter((a) => getDisplayType(a) === type)
                .sort((a, b) => a.display_order - b.display_order);
              if (group.length === 0) return null;
              return (
                <div key={type}>
                  <h3 className="text-sm font-bold text-[#86868B] mb-2 uppercase tracking-wide">
                    {label} ({group.length})
                  </h3>
                  <div className="space-y-2">
                    {group.map((article, idx) => {
                      const isEditing = editState?.id === article.id;
                      return (
                        <div
                          key={article.id}
                          className={`p-3 rounded-2xl border bg-white ${
                            article.is_active ? 'border-[#E5E5EA]' : 'border-[#E5E5EA] bg-[#F5F5F7] opacity-75'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* 순서 변경 버튼 */}
                            <div className="flex flex-col gap-0.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleMoveOrder(article.id, 'up')}
                                disabled={idx === 0}
                                className="w-6 h-6 flex items-center justify-center rounded-[10px] text-[#86868B] hover:bg-[#F5F5F7] disabled:opacity-20 text-xs"
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveOrder(article.id, 'down')}
                                disabled={idx === group.length - 1}
                                className="w-6 h-6 flex items-center justify-center rounded-[10px] text-[#86868B] hover:bg-[#F5F5F7] disabled:opacity-20 text-xs"
                              >
                                ▼
                              </button>
                            </div>
                            {/* 썸네일 */}
                            <div className="shrink-0 w-14 h-14 rounded-[10px] overflow-hidden bg-[#F5F5F7] border border-[#E5E5EA]">
                              {article.thumbnail_url ? (
                                <img
                                  src={article.thumbnail_url}
                                  alt={article.title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                                  {article.source_type === 'youtube' ? '▶' : '📄'}
                                </div>
                              )}
                            </div>
                            {/* 제목 / URL */}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  article.category === 'car'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-accent/10 text-accent'
                                }`}>
                                  {getCategoryLabel(article.category)}
                                </span>
                                {article.category === 'car' && article.vehicle_slug && (
                                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                                    {getVehicleLabel(article.vehicle_slug)}
                                  </span>
                                )}
                              </div>
                              <h3 className="font-semibold text-gray-900 text-sm truncate">{article.title}</h3>
                              <a
                                href={article.link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-accent hover:underline truncate block"
                              >
                                {article.link_url}
                              </a>
                            </div>
                            {/* 액션 버튼 */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleToggleActive(article.id, article.is_active)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                                  article.is_active
                                    ? 'bg-success/20 text-success'
                                    : 'bg-gray-200 text-gray-600'
                                }`}
                              >
                                {article.is_active ? '노출' : '비노출'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (isEditing) {
                                    setEditState(null);
                                    setEditBrandFilter('');
                                  } else {
                                    setEditState({
                                      id: article.id,
                                      title: article.title,
                                      excerpt: article.excerpt ?? '',
                                      category: article.category ?? 'rental',
                                      vehicle_slug: article.vehicle_slug ?? '',
                                      saving: false,
                                    });
                                    setEditBrandFilter('');
                                  }
                                }}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                              >
                                {isEditing ? '취소' : '수정'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(article.id)}
                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-danger/20 text-danger hover:bg-danger/30"
                              >
                                삭제
                              </button>
                            </div>
                          </div>

                          {/* 인라인 수정 */}
                          {isEditing && editState && (
                            <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                              {/* 카테고리 */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">카테고리</label>
                                <div className="flex gap-2">
                                  {categories.map((opt) => (
                                    <button
                                      key={opt.value}
                                      type="button"
                                      onClick={() => setEditState({ ...editState, category: opt.value, vehicle_slug: '' })}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                        editState.category === opt.value
                                          ? 'bg-accent text-white border-accent'
                                          : 'bg-white text-gray-600 border-gray-300 hover:border-accent'
                                      }`}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* 차종 선택 */}
                              {editState.category === 'car' && (
                                <div>
                                  <label className="block text-xs font-semibold text-gray-600 mb-1">차종 선택 (선택)</label>
                                  {/* 제조사 필터 */}
                                  <div className="flex gap-2 mb-2 overflow-x-auto pb-1 scrollbar-hide">
                                    {['전체', ...BRANDS].map((b) => (
                                      <button
                                        key={b}
                                        type="button"
                                        onClick={() => { setEditBrandFilter(b === '전체' ? '' : b); setEditState({ ...editState, vehicle_slug: '' }); }}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap transition-all ${
                                          (b === '전체' ? editBrandFilter === '' : editBrandFilter === b)
                                            ? 'bg-accent text-white border-accent'
                                            : 'bg-white text-gray-600 border-gray-300 hover:border-accent'
                                        }`}
                                      >
                                        {b}
                                      </button>
                                    ))}
                                  </div>
                                  <select
                                    value={editState.vehicle_slug}
                                    onChange={(e) => setEditState({ ...editState, vehicle_slug: e.target.value })}
                                    className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-accent bg-white"
                                  >
                                    <option value="">전체 / 미지정</option>
                                    {(editBrandFilter ? BRANDS.filter((b) => b === editBrandFilter) : BRANDS).map((brand) => (
                                      <optgroup key={brand} label={brand}>
                                        {VEHICLE_LIST.filter((v) => v.brand === brand).map((v) => (
                                          <option key={v.slug} value={v.slug}>
                                            {v.model}
                                          </option>
                                        ))}
                                      </optgroup>
                                    ))}
                                  </select>
                                </div>
                              )}

                              {/* 제목 */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">제목</label>
                                <input
                                  type="text"
                                  value={editState.title}
                                  onChange={(e) => setEditState({ ...editState, title: e.target.value })}
                                  maxLength={200}
                                  className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-accent"
                                />
                              </div>

                              {/* 요약 */}
                              <div>
                                <label className="block text-xs font-semibold text-gray-600 mb-1">요약</label>
                                <textarea
                                  value={editState.excerpt}
                                  onChange={(e) => setEditState({ ...editState, excerpt: e.target.value })}
                                  rows={2}
                                  className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm outline-none focus:border-accent resize-none"
                                />
                              </div>

                              <button
                                type="button"
                                onClick={handleEditSave}
                                disabled={editState.saving}
                                className="px-5 py-2 rounded-lg text-sm font-bold bg-accent text-white hover:opacity-90 disabled:opacity-60"
                              >
                                {editState.saving ? '저장 중...' : '저장'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
