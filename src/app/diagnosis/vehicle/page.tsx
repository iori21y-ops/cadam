'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { QuizModule } from '@/components/diagnosis/QuizModule';
import { ParkAI } from '@/components/diagnosis/ParkAI';
import { DEFAULT_VEHICLE_BASIC, DEFAULT_VEHICLE_DETAIL } from '@/data/diagnosis-vehicle';
import { VEHICLES, TRIMS } from '@/data/diagnosis-vehicles';
import { DEFAULT_PRODUCTS, PRODUCT_KEYS } from '@/data/diagnosis-products';
import { scoreByTags } from '@/lib/flow-engine';
import { calcMonthly, conditionLabel, DEFAULT_PERIOD, DEFAULT_MILEAGE, DEFAULT_DOWN_RATE } from '@/lib/calc-monthly';
import { VEHICLE_LIST } from '@/constants/vehicles';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import type { DiagnosisAnswer, DiagnosisVehicle, VehicleOption } from '@/types/diagnosis';
import { BRAND } from '@/constants/brand';
import { FeedbackWidget } from '@/components/diagnosis/FeedbackWidget';
import { NextMission } from '@/components/diagnosis/NextMission';
import { buildShareUrl, copyShareUrl, shareToKakao, nativeShare } from '@/lib/diagnosis-share';
import { Button } from '@/components/ui/Button';
import { saveMissionStep, loadProgress } from '@/lib/mission-progress';
import { useQuoteStore } from '@/store/quoteStore';

const COLOR = '#2563EB';

function VehicleImage({ imageKey, brand, name, emoji }: { imageKey?: string; brand: string; name: string; emoji: string }) {
  const [failed, setFailed] = useState(false);
  if (!imageKey || failed) return <span className="text-2xl">{emoji}</span>;
  return (
    <div className="w-16 h-10 relative">
      <Image src={`/cars/${imageKey}.webp`} alt={`${brand} ${name}`} fill sizes="64px" className="object-contain" onError={() => setFailed(true)} />
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const badges = ['1st', '2nd', '3rd'];
  const colors = ['#EF4444', '#F59E0B', '#8E8E93'];
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
      style={{ backgroundColor: colors[rank] ?? '#8E8E93' }}
    >
      {badges[rank] ?? ''}
    </span>
  );
}

function VehResult({ answers, mode, restart, toDetail, onHome, vehicles }: {
  answers: Record<string, DiagnosisAnswer>;
  mode: 'basic' | 'detail';
  restart: () => void;
  toDetail: () => void;
  onHome: () => void;
  vehicles: DiagnosisVehicle[];
}) {
  const router = useRouter();

  // 차종 태그와 옵션 태그 분리
  const vehicleTags: string[] = [];
  const optionTags: string[] = [];
  for (const [qId, ans] of Object.entries(answers)) {
    if ('tags' in ans) {
      const tags = (ans as VehicleOption).tags;
      if (qId.startsWith('o_')) {
        optionTags.push(...tags);
      } else {
        vehicleTags.push(...tags);
      }
    }
  }

  const scored = scoreByTags(vehicles, vehicleTags, 3);
  const best = scored[0];
  const answerCount = Object.keys(answers).length;

  // 1순위 차종의 트림 추천
  const bestTrims = TRIMS[best.name] ?? [];
  const scoredTrims = optionTags.length > 0
    ? scoreByTags(bestTrims, optionTags, 3)
    : [];
  const bestTrim = scoredTrims[0];

  // 미션 완료 저장 (답변 포함 — 결과 복원용)
  useEffect(() => {
    const serialized: Record<string, { value: string; label: string }> = {};
    for (const [k, v] of Object.entries(answers)) {
      serialized[k] = { value: v.value, label: v.label };
    }
    saveMissionStep('vehicle', `${best.brand} ${best.name}`, serialized, mode);
  }, [answers, best.brand, best.name, mode]);

  // vehicles.ts에서 slug 찾기
  const matchSlug = (name: string) => {
    const found = VEHICLE_LIST.find((v) =>
      v.model.includes(name) || name.includes(v.model.split(' ')[0])
    );
    return found?.slug ?? null;
  };

  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const shareUrl = buildShareUrl('/diagnosis/vehicle', mode, answers);
  const prefillFromDiagnosis = useQuoteStore((s) => s.prefillFromDiagnosis);

  // 이용방법 진단 결과 (있으면 CTA에 함께 표시)
  const financeProgress = loadProgress().finance;
  const financeSummary = financeProgress.done ? financeProgress.summary : null;

  const handleQuoteNav = () => {
    prefillFromDiagnosis();
    router.push('/quote');
  };

  const handleCopy = async () => {
    const ok = await copyShareUrl(shareUrl);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    const shared = await nativeShare({
      title: `${BRAND.sharePrefix} 차종추천 결과: ${best.brand} ${best.name}`,
      text: `나에게 맞는 차종은 ${best.brand} ${best.name}! 당신도 추천받아 보세요.`,
      url: shareUrl,
    });
    if (!shared) handleCopy();
  };

  const handleKakaoShare = () => {
    shareToKakao({
      title: `${BRAND.sharePrefix} 차종추천 결과: ${best.brand} ${best.name}`,
      description: `나에게 맞는 차종은 ${best.brand} ${best.name}! (${best.class}, ${best.price}만원~)`,
      url: shareUrl,
    });
  };

  return (
    <div className="min-h-screen bg-surface-secondary pb-16">
      <div className="px-5 pt-10 max-w-lg mx-auto">
        {/* 모드 배지 + 공유 */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-xs px-3 py-1 rounded-full bg-vehicle/8 text-vehicle font-semibold">
            {mode === 'basic' ? '간편 진단' : '상세 진단'} · {answerCount}개 응답
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={handleKakaoShare}
              className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-sm border border-border-solid hover:border-primary transition-colors"
              title="카카오톡 공유"
            >
              💬
            </button>
            <button
              onClick={handleShare}
              className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center text-sm border border-border-solid hover:border-primary transition-colors"
              title="링크 복사"
            >
              {copied ? '✓' : '🔗'}
            </button>
          </div>
        </div>

        {/* 헤드라인 */}
        <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35, ease: 'easeOut' }}>
          <p className="text-sm text-text-sub mb-1">차종 추천 결과</p>
          <h1 className="text-2xl font-bold text-text tracking-tight mb-4">
            <span style={{ color: COLOR }}>{best.name}</span>을(를)<br />추천합니다
          </h1>
        </motion.div>

        {/* ParkAI */}
        <ParkAI
          ctx={`차종추천결과: TOP3 - ${scored.slice(0, 3).map(v => `${v.name}(${v.score}점)`).join(', ')}. 응답수: ${answerCount}개. 모드: ${mode}. 1순위: ${best.brand} ${best.name} (${best.class}, ${best.price}만원~). 용도: ${answers['v_purpose']?.label ?? '미응답'}. 예산: ${answers['v_budget']?.label ?? '미응답'}.`}
          mode="report"
        />

        {/* 추천 순위 (1순위 상세 + 접기/펼치기) */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1, duration: 0.35, ease: 'easeOut' }}
          className="rounded-2xl bg-surface shadow-sm mb-4 overflow-hidden"
        >
          {scored.map((v, i) => {
            const slug = matchSlug(v.name);
            const isBest = i === 0;
            if (!isBest && !expanded) return null;

            // 해당 차종의 트림 추천
            const vTrims = TRIMS[v.name] ?? [];
            const vScoredTrims = optionTags.length > 0 ? scoreByTags(vTrims, optionTags, 1) : [];
            const vBestTrim = vScoredTrims[0];

            return (
              <div key={v.name} className={`px-5 py-5 ${!isBest ? 'border-t border-border' : ''}`}>
                {/* 헤더 */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex flex-col items-center gap-1">
                    <RankBadge rank={i} />
                    <VehicleImage imageKey={v.imageKey} brand={v.brand} name={v.name} emoji={v.img} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-text text-[17px]">{v.brand} {v.name}</p>
                    </div>
                    <p className="text-xs text-text-muted">{v.class} · {v.price.toLocaleString()}만원~</p>
                  </div>
                  {slug && (
                    <button
                      onClick={() => router.push(`/cars/${slug}`)}
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-lg text-vehicle border border-vehicle/20 hover:bg-vehicle/5 transition-colors shrink-0"
                    >
                      상세 →
                    </button>
                  )}
                </div>

                {/* 상품별 월 비용 (동적 계산) */}
                <div className="grid grid-cols-4 gap-1.5 mb-1.5">
                  {PRODUCT_KEYS.map((key) => (
                    <div key={key} className="text-center py-2 rounded-xl" style={{ backgroundColor: DEFAULT_PRODUCTS[key].lightBg }}>
                      <p className="text-[10px] text-text-muted">{DEFAULT_PRODUCTS[key].name}</p>
                      <p className="text-xs font-bold" style={{ color: DEFAULT_PRODUCTS[key].color }}>
                        {key === 'cash' ? '일시불' : `${calcMonthly(v.price, key, DEFAULT_PERIOD, DEFAULT_DOWN_RATE, DEFAULT_MILEAGE)}만`}
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-text-muted mb-3">{conditionLabel()} (참고용)</p>

                {/* 추천 트림 (옵션 태그가 있을 때) */}
                {vBestTrim && (
                  <div className="p-3 rounded-xl bg-surface-secondary mb-2">
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-semibold text-text">추천 트림: {vBestTrim.name}</p>
                      <p className="text-xs font-bold text-text">{vBestTrim.price.toLocaleString()}만원</p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {vBestTrim.feats.map((f) => (
                        <span key={f} className="text-[10px] px-1.5 py-0.5 rounded-md bg-white text-text-sub">{f}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 1순위 상세 정보 */}
                {isBest && (
                  <div className="mt-2">
                    {/* 핵심 스펙 */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {v.seats && <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-secondary text-text-sub">{v.seats}</span>}
                      {v.engine && <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-secondary text-text-sub">{v.engine}</span>}
                    </div>

                    {/* 핵심 특징 */}
                    {v.highlights && v.highlights.length > 0 && (
                      <div className="flex flex-col gap-1 mb-3">
                        {v.highlights.map((h, hi) => (
                          <p key={hi} className="text-xs text-text-sub"><span className="text-primary mr-1">✓</span>{h}</p>
                        ))}
                      </div>
                    )}

                    {/* 장점 / 유의사항 */}
                    {v.pros && v.cons && (
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <p className="text-[11px] font-semibold text-success mb-1">장점</p>
                          {v.pros.map((p) => (
                            <p key={p} className="text-[11px] text-text-sub mb-0.5">✓ {p}</p>
                          ))}
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold text-danger mb-1">유의사항</p>
                          {v.cons.map((c) => (
                            <p key={c} className="text-[11px] text-text-sub mb-0.5">· {c}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 추천 대상 */}
                    {v.bestFor && (
                      <p className="text-[11px] text-text-muted">이런 분께 최적: {v.bestFor}</p>
                    )}

                    {/* 진단 답변 기반 추천 이유 */}
                    {Object.keys(answers).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p className="text-[11px] font-semibold text-text-sub mb-2">고객님의 진단 결과 기반 추천 이유</p>
                        <div className="flex flex-wrap gap-1.5">
                          {answers['v_purpose'] && (
                            <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-primary/10 text-primary">
                              용도: {answers['v_purpose'].label}
                            </span>
                          )}
                          {answers['v_budget'] && (
                            <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-primary/10 text-primary">
                              예산: {answers['v_budget'].label}
                            </span>
                          )}
                          {answers['v_people'] && (
                            <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-primary/10 text-primary">
                              인원: {answers['v_people'].label}
                            </span>
                          )}
                          {answers['v_fuel'] && (
                            <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-primary/10 text-primary">
                              연료: {answers['v_fuel'].label}
                            </span>
                          )}
                          {answers['v_priority'] && (
                            <span className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-primary/10 text-primary">
                              우선: {answers['v_priority'].label}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* 접기/펼치기 */}
          {scored.length > 1 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full py-4 border-t-2 border-border text-sm font-bold text-primary bg-primary/[0.04] hover:bg-primary/[0.08] active:bg-primary/[0.12] transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-base">{expanded ? '▲' : '▼'}</span>
              {expanded ? '접기' : '2·3순위 결과 보기'}
            </button>
          )}
        </motion.div>

        {/* 하단 버튼 */}
        <div className="flex flex-col gap-3">
          <div className="mb-3">
            <NextMission current="vehicle" />
          </div>
          <div className="mb-3">
            <FeedbackWidget
              type="vehicle"
              mode={mode}
              result={{ best: best.name, brand: best.brand, top3: scored.slice(0, 3).map((v) => v.name) }}
              answers={answers as Record<string, { value: string; label: string }>}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="surface" className="flex-1" onClick={restart}>다시 진단</Button>
            {mode === 'basic' && (
              <Button variant="surface" className="flex-1 text-vehicle font-semibold" onClick={toDetail}>상세 테스트 →</Button>
            )}
            <Button variant="surface" className="flex-1" onClick={onHome}>홈으로</Button>
          </div>
        </div>
      </div>

      {/* 하단 고정 CTA 바 */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-t border-border-solid shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <div className="max-w-lg mx-auto px-5 py-3 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-text">🚗 {best.brand} {best.name}</span>
              {financeSummary && <span className="text-xs text-text-sub">· 🎯 {financeSummary}</span>}
            </div>
            <p className="text-[10px] text-text-muted mt-0.5">진단 결과가 자동 반영됩니다</p>
          </div>
          <button
            onClick={handleQuoteNav}
            className="shrink-0 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:opacity-90 active:scale-[0.97] transition-all"
          >
            상담 신청 →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VehiclePage() {
  const router = useRouter();
  const [vehicles, setVehicles] = useState<DiagnosisVehicle[]>(VEHICLES);
  const [saved, setSaved] = useState<{ answers: Record<string, { value: string; label: string }>; mode: 'basic' | 'detail' } | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.from('vehicles')
      .select('name, manufacturer, diagnosis_class, base_price, diagnosis_tags, img_emoji, image_key, parent_name, highlights, pros, cons, best_for, seats, engine')
      .eq('is_active', true)
      .eq('is_diagnosis', true)
      .order('display_order')
      .then(({ data }) => {
        if (data && data.length > 0) {
          const mapped: DiagnosisVehicle[] = data.map((v) => ({
            name: v.name,
            brand: v.manufacturer,
            class: v.diagnosis_class ?? '',
            price: v.base_price ?? 0,
            tags: v.diagnosis_tags ?? [],
            img: v.img_emoji ?? '🚗',
            imageKey: v.image_key ?? undefined,
            parentName: v.parent_name ?? undefined,
            highlights: v.highlights ?? undefined,
            pros: v.pros ?? undefined,
            cons: v.cons ?? undefined,
            bestFor: v.best_for ?? undefined,
            seats: v.seats ?? undefined,
            engine: v.engine ?? undefined,
          }));
          setVehicles(mapped);
        }
      });
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('restore') === '1') {
      const progress = loadProgress();
      if (progress.vehicle.done && progress.vehicle.answers) {
        setSaved({ answers: progress.vehicle.answers, mode: progress.vehicle.mode ?? 'basic' });
      }
    }
    setChecked(true);
  }, []);

  if (!checked) return null;

  return (
    <QuizModule
      basicQs={DEFAULT_VEHICLE_BASIC}
      detailQs={DEFAULT_VEHICLE_DETAIL}
      color={COLOR}
      onHome={() => router.push('/')}
      savedResult={saved}
      renderResult={(props) => <VehResult {...props} vehicles={vehicles} />}
    />
  );
}
