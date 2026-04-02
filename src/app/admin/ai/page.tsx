'use client';

import { useEffect, useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { useToastStore } from '@/store/toastStore';
import { DEFAULT_AI_CONFIG, AI_MODELS } from '@/data/diagnosis-ai';
import type { AIConfig } from '@/types/diagnosis';

const CONFIG_ID = 'diagnosis_data_v1';

function isRecord(v: unknown): v is Record<string, unknown> {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v);
}

export default function AdminAIPage() {
  const [cfg, setCfg] = useState<AIConfig>({ ...DEFAULT_AI_CONFIG });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const showToast = useToastStore((s) => s.showToast);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const supabase = createBrowserSupabaseClient();
        const res = await supabase
          .from('diagnosis_config')
          .select('data')
          .eq('id', CONFIG_ID)
          .maybeSingle();
        if (res.error) throw new Error(res.error.message);
        const stored = res.data?.data as Record<string, unknown> | null;
        if (isRecord(stored) && isRecord(stored.aiConfig)) {
          setCfg({ ...DEFAULT_AI_CONFIG, ...(stored.aiConfig as Partial<AIConfig>) });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : '설정을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      // 기존 데이터를 먼저 로드하여 aiConfig만 덮어씀
      const res = await supabase
        .from('diagnosis_config')
        .select('data')
        .eq('id', CONFIG_ID)
        .maybeSingle();
      const existing = isRecord(res.data?.data) ? res.data!.data as Record<string, unknown> : {};
      const updated = { ...existing, aiConfig: cfg };
      const upsertRes = await supabase
        .from('diagnosis_config')
        .upsert({ id: CONFIG_ID, data: updated, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      if (upsertRes.error) throw new Error(upsertRes.error.message);
      showToast('저장 완료', 'success');
    } catch (e) {
      const msg = e instanceof Error ? e.message : '저장에 실패했습니다.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ai-comment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: '테스트: 할부 추천, 개인사업자, 36개월', config: cfg }),
      });
      const data = await res.json();
      setTestResult(data.comment);
    } catch {
      setTestResult('API 호출 실패');
    } finally {
      setTesting(false);
    }
  };

  const applyTone = (preset: { prompt: string }) => {
    setCfg({ ...cfg, promptTemplate: cfg.promptTemplate.replace(/^.*조언.*$/m, preset.prompt) });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-surface-secondary">
      <div className="px-5 py-6 max-w-[700px] mx-auto">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-text flex items-center gap-2">
              <span className="text-2xl">🤖</span> AI 설정
            </h1>
            <p className="text-sm text-text-sub mt-1">
              AI 캐릭터 및 코멘트 설정을 관리합니다.
            </p>
            {error && <p className="text-sm text-danger font-semibold mt-2">{error}</p>}
          </div>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="shrink-0 text-sm font-semibold text-white px-4 py-2 rounded-[10px] bg-primary shadow-[0_4px_16px_rgba(0,122,255,0.25)] disabled:opacity-60"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {/* 미리보기 */}
          <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #1D1D1F, #2C2C2E)' }}>
            <div className="flex items-start gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0"
                style={{ backgroundColor: cfg.bgColor || '#2563EB' }}
              >
                {cfg.charEmoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">{cfg.charTitle}</p>
                <p className="text-xs text-white/60">{cfg.charSubtitle}</p>
                {testResult && <p className="mt-2 text-sm text-white/85 leading-relaxed">{testResult}</p>}
              </div>
            </div>
          </div>

          {/* 진단 페이지 상단 코멘트 */}
          <div className="bg-white rounded-2xl p-5">
            <div className="text-sm font-bold text-text mb-1">진단 페이지 상단 코멘트</div>
            <div className="text-[11px] text-text-sub mb-3">AI 진단 탭 상단에 표시되는 AI 캐릭터 인삿말입니다.</div>
            <textarea
              value={cfg.introComment ?? ''}
              onChange={(e) => setCfg({ ...cfg, introComment: e.target.value })}
              className="w-full bg-surface-secondary border border-border-solid rounded-[10px] px-[14px] py-[10px] text-[13px] text-text outline-none resize-y"
              rows={3}
              placeholder="예: 고객님, 어떤 자동차 이용방법이 좋을지 고민되시나요? AI 진단으로 최적의 방법을 찾아드리겠습니다! 🚗"
            />
          </div>

          {/* 캐릭터 기본 정보 */}
          <div className="bg-white rounded-2xl p-5">
            <div className="text-sm font-bold text-text mb-4">캐릭터 기본 정보</div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {[
                { label: '캐릭터 이름', key: 'charName' as const },
                { label: '이모지', key: 'charEmoji' as const },
                { label: '표시 제목', key: 'charTitle' as const },
                { label: '부제', key: 'charSubtitle' as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-[11px] font-semibold text-text-sub mb-1">{label}</label>
                  <input
                    className="w-full bg-surface-secondary border border-border-solid rounded-[10px] px-[14px] py-[10px] text-sm text-text outline-none"
                    value={cfg[key]}
                    onChange={(e) => setCfg({ ...cfg, [key]: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-text-sub mb-1">아이콘 배경색</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={cfg.bgColor}
                    onChange={(e) => setCfg({ ...cfg, bgColor: e.target.value })}
                    className="w-10 h-9 rounded-lg cursor-pointer border border-border-solid"
                  />
                  <input
                    className="flex-1 bg-surface-secondary border border-border-solid rounded-[10px] px-[14px] py-[10px] text-sm text-text outline-none"
                    value={cfg.bgColor}
                    onChange={(e) => setCfg({ ...cfg, bgColor: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-text-sub mb-1">세션당 최대 호출</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={cfg.maxCalls}
                  onChange={(e) => setCfg({ ...cfg, maxCalls: Math.max(1, Number(e.target.value) || 1) })}
                  className="w-full bg-surface-secondary border border-border-solid rounded-[10px] px-[14px] py-[10px] text-sm text-text outline-none"
                />
              </div>
            </div>
          </div>

          {/* AI 모델 선택 */}
          <div className="bg-white rounded-2xl p-5">
            <div className="text-sm font-bold text-text mb-3">AI 모델 선택</div>
            <div className="flex flex-col gap-2">
              {AI_MODELS.map((m) => {
                const active = cfg.model === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCfg({ ...cfg, model: m.id })}
                    className={`flex items-center gap-3 p-4 rounded-xl text-left ${active ? 'bg-primary text-white' : 'bg-surface-secondary text-text'}`}
                  >
                    <div className={`w-[18px] h-[18px] rounded-full flex items-center justify-center ${active ? 'bg-white' : 'border-2 border-[#D1D1D6]'}`}>
                      {active && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm font-semibold ${active ? 'text-white' : 'text-text'}`}>
                        {m.name}
                        {m.badge && (
                          <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded ${active ? 'bg-white/20 text-white' : 'bg-[#2563EB1A] text-primary'}`}>
                            {m.badge}
                          </span>
                        )}
                      </div>
                      <div className={`text-[11px] mt-0.5 ${active ? 'text-white/70' : 'text-text-sub'}`}>{m.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 톤 프리셋 */}
          <div className="bg-white rounded-2xl p-5">
            <div className="text-sm font-bold text-text mb-2">톤 프리셋</div>
            <div className="text-xs text-text-sub mb-3">클릭하면 프롬프트의 조언 스타일 라인이 변경됩니다</div>
            <div className="grid grid-cols-2 gap-2">
              {(cfg.tonePresets ?? []).map((tp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyTone(tp)}
                  className="p-3 bg-surface-secondary rounded-xl text-left"
                >
                  <div className="text-[13px] font-semibold text-text">{tp.name}</div>
                  <div className="text-[11px] text-text-sub mt-0.5">{tp.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 프롬프트 템플릿 */}
          <div className="bg-white rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-text">프롬프트 템플릿</div>
              <button
                type="button"
                onClick={() => setCfg({ ...cfg, promptTemplate: DEFAULT_AI_CONFIG.promptTemplate })}
                className="bg-surface-secondary text-text-sub rounded-[10px] px-2.5 py-1.5 text-xs font-semibold"
              >
                기본값
              </button>
            </div>
            <div className="text-[11px] text-text-sub mb-2 leading-relaxed">
              사용 변수: <span className="font-mono bg-[#F0F0F5] px-1.5 py-0.5 rounded">{'{charName}'}</span>,{' '}
              <span className="font-mono bg-[#F0F0F5] px-1.5 py-0.5 rounded">{'{context}'}</span>
            </div>
            <textarea
              value={cfg.promptTemplate}
              onChange={(e) => setCfg({ ...cfg, promptTemplate: e.target.value })}
              className="w-full bg-surface-secondary border border-border-solid rounded-[10px] px-[14px] py-[10px] text-[13px] text-text outline-none font-mono leading-relaxed resize-y"
              rows={8}
            />
          </div>

          {/* 폴백 메시지 */}
          <div className="bg-white rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-bold text-text">폴백 메시지</div>
                <div className="text-[11px] text-text-sub mt-0.5">API 실패 또는 세션 한도 초과 시 표시됩니다</div>
              </div>
              <button
                type="button"
                onClick={() => setCfg({ ...cfg, fallbacks: [...cfg.fallbacks, ''] })}
                className="bg-surface-secondary text-primary rounded-[10px] px-2.5 py-1.5 text-xs font-semibold"
              >
                + 추가
              </button>
            </div>
            {cfg.fallbacks.map((fb, i) => (
              <div key={i} className="flex gap-2 items-start mb-2">
                <span className="text-xs text-text-muted mt-2 min-w-5">{i + 1}</span>
                <textarea
                  value={fb}
                  onChange={(e) => {
                    const next = [...cfg.fallbacks];
                    next[i] = e.target.value;
                    setCfg({ ...cfg, fallbacks: next });
                  }}
                  className="flex-1 bg-surface-secondary border border-border-solid rounded-[10px] px-[14px] py-[10px] text-[13px] text-text outline-none resize-y"
                  rows={2}
                />
                {cfg.fallbacks.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setCfg({ ...cfg, fallbacks: cfg.fallbacks.filter((_, j) => j !== i) })}
                    className="text-danger text-sm font-semibold px-2 mt-2"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* 테스트 실행 */}
          <div className="bg-white rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-bold text-text">테스트 실행</div>
              <button
                type="button"
                onClick={handleTest}
                disabled={testing}
                className={`px-4 py-2 rounded-[10px] text-xs font-semibold ${
                  testing ? 'bg-[#D1D1D6] text-white' : 'bg-primary text-white'
                }`}
              >
                {testing ? '생성 중...' : '테스트 호출'}
              </button>
            </div>
            <div className="text-[11px] text-text-sub mb-2">샘플 데이터로 실제 API를 호출합니다</div>
            {testResult && (
              <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #1D1D1F, #2C2C2E)' }}>
                <div className="flex items-start gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0"
                    style={{ backgroundColor: cfg.bgColor || '#2563EB' }}
                  >
                    {cfg.charEmoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{cfg.charTitle}</p>
                    <p className="text-xs text-white/60">{cfg.charSubtitle}</p>
                    <p className="mt-2 text-sm text-white/85 leading-relaxed">{testResult}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
