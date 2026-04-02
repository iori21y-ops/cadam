'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { QuizModule } from '@/components/diagnosis/QuizModule';
import { ParkAI } from '@/components/diagnosis/ParkAI';
import { DEFAULT_VEHICLE_BASIC, DEFAULT_VEHICLE_DETAIL } from '@/data/diagnosis-vehicle';
import { VEHICLES, TRIMS } from '@/data/diagnosis-vehicles';
import { DEFAULT_PRODUCTS, PRODUCT_KEYS } from '@/data/diagnosis-products';
import { scoreByTags } from '@/lib/flow-engine';
import { VEHICLE_LIST } from '@/constants/vehicles';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import type { DiagnosisAnswer, DiagnosisVehicle, VehicleOption } from '@/types/diagnosis';
import { SimulationCalculator } from '@/components/diagnosis/SimulationCalculator';
import { BRAND } from '@/constants/brand';
import { FeedbackWidget } from '@/components/diagnosis/FeedbackWidget';
import { NextMission } from '@/components/diagnosis/NextMission';
import { buildShareUrl, copyShareUrl, shareToKakao, nativeShare } from '@/lib/diagnosis-share';
import { Button } from '@/components/ui/Button';
import { saveMissionStep, loadProgress } from '@/lib/mission-progress';

const CONFIG_ID = 'diagnosis_data_v1';

const COLOR = '#2563EB';

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
        {/* 모드 배지 */}
        <div className="flex items-center gap-2 mb-5">
          <span className="text-xs px-3 py-1 rounded-full bg-vehicle/8 text-vehicle font-semibold">
            {mode === 'basic' ? '간편 진단' : '상세 진단'} · {answerCount}개 응답
          </span>
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
                    <span className="text-2xl">{v.img}</span>
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

                {/* 상품별 월 비용 */}
                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {PRODUCT_KEYS.map((key) => (
                    <div key={key} className="text-center py-2 rounded-xl" style={{ backgroundColor: DEFAULT_PRODUCTS[key].lightBg }}>
                      <p className="text-[10px] text-text-muted">{DEFAULT_PRODUCTS[key].name}</p>
                      <p className="text-xs font-bold" style={{ color: DEFAULT_PRODUCTS[key].color }}>
                        {key === 'cash' ? '일시불' : `${v.monthly[key]}만`}
                      </p>
                    </div>
                  ))}
                </div>

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

                {/* 1순위에만 추가 정보 */}
                {isBest && (
                  <p className="text-[11px] text-text-muted">고객님의 용도·예산·탑승 인원에 가장 적합한 차종입니다</p>
                )}
              </div>
            );
          })}

          {/* 접기/펼치기 */}
          {scored.length > 1 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full py-3 border-t border-border text-xs font-semibold text-primary hover:bg-primary/[0.03] transition-colors"
            >
              {expanded ? '접기 ▲' : '2·3순위 보기 ▼'}
            </button>
          )}
        </motion.div>

        {/* 1순위 시뮬레이션 */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.32, duration: 0.35, ease: 'easeOut' }}
          className="mb-4"
        >
          <SimulationCalculator
            carPrice={best.price}
            carName={`${best.brand} ${best.name}`}
          />
        </motion.div>


        {/* 공유 + 하단 버튼 */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Button variant="surface" className="flex-1" onClick={handleKakaoShare}>카카오톡 공유</Button>
            <Button variant="surface" className="flex-1" onClick={handleShare}>{copied ? '복사됨!' : '링크 공유'}</Button>
          </div>
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
    supabase.from('diagnosis_config').select('data').eq('id', CONFIG_ID).single()
      .then(({ data }) => {
        const v = (data as { data?: { vehicles?: unknown } } | null)?.data?.vehicles;
        if (Array.isArray(v) && v.length > 0) {
          setVehicles(v as DiagnosisVehicle[]);
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
