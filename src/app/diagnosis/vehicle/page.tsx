'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { QuizModule } from '@/components/diagnosis/QuizModule';
import { ParkAI } from '@/components/diagnosis/ParkAI';
import { DEFAULT_VEHICLE_BASIC, DEFAULT_VEHICLE_DETAIL } from '@/data/diagnosis-vehicle';
import { VEHICLES } from '@/data/diagnosis-vehicles';
import { DEFAULT_PRODUCTS, PRODUCT_KEYS } from '@/data/diagnosis-products';
import { scoreByTags } from '@/lib/flow-engine';
import { VEHICLE_LIST } from '@/constants/vehicles';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import type { DiagnosisAnswer, DiagnosisVehicle, VehicleOption } from '@/types/diagnosis';
import { SimulationCalculator } from '@/components/diagnosis/SimulationCalculator';
import { BRAND } from '@/constants/brand';
import { FeedbackWidget } from '@/components/diagnosis/FeedbackWidget';
import { buildShareUrl, copyShareUrl, shareToKakao, nativeShare } from '@/lib/diagnosis-share';
import { Button } from '@/components/ui/Button';

const CONFIG_ID = 'diagnosis_data_v1';

const COLOR = '#2563EB';

function VehResult({ answers, mode, restart, toDetail, onHome, vehicles }: {
  answers: Record<string, DiagnosisAnswer>;
  mode: 'basic' | 'detail';
  restart: () => void;
  toDetail: () => void;
  onHome: () => void;
  vehicles: DiagnosisVehicle[];
}) {
  const router = useRouter();

  const answerTags = Object.values(answers).flatMap((a) =>
    'tags' in a ? (a as VehicleOption).tags : []
  );

  const scored = scoreByTags(vehicles, answerTags, 4);
  const best = scored[0];
  const answerCount = Object.keys(answers).length;

  // vehicles.ts에서 slug 찾기
  const matchSlug = (name: string) => {
    const found = VEHICLE_LIST.find((v) =>
      v.model.includes(name) || name.includes(v.model.split(' ')[0])
    );
    return found?.slug ?? null;
  };

  const [copied, setCopied] = useState(false);
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

        {/* TOP 4 카드 */}
        <div className="flex flex-col gap-3 mb-4">
          {scored.map((v, i) => {
            const slug = matchSlug(v.name);
            return (
              <motion.div
                key={v.name}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08, duration: 0.35, ease: 'easeOut' }}
                className="p-4 rounded-2xl bg-surface shadow-sm"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{v.img}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-text text-sm">{v.brand} {v.name}</p>
                      {i === 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full text-white font-semibold" style={{ backgroundColor: COLOR }}>
                          BEST
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-muted">{v.class} · {v.price}만원~</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5 mb-2">
                  {PRODUCT_KEYS.map((key) => (
                    <div key={key} className="text-center py-1.5 rounded-xl" style={{ backgroundColor: DEFAULT_PRODUCTS[key].lightBg }}>
                      <p className="text-[10px] text-text-muted">{DEFAULT_PRODUCTS[key].name}</p>
                      <p className="text-xs font-bold" style={{ color: DEFAULT_PRODUCTS[key].color }}>
                        {key === 'cash' ? '일시불' : `${v.monthly[key]}만`}
                      </p>
                    </div>
                  ))}
                </div>
                {i === 0 && slug && (
                  <button
                    onClick={() => router.push(`/cars/${slug}`)}
                    className="w-full py-2 rounded-xl text-xs font-semibold text-vehicle border border-vehicle/20 hover:bg-vehicle/5 transition-colors"
                  >
                    {v.name} 상세 정보 보기 →
                  </button>
                )}
              </motion.div>
            );
          })}
        </div>

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

        {/* 옵션 추천 CTA */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35, duration: 0.35, ease: 'easeOut' }}
          className="p-6 rounded-2xl mb-4 text-center"
          style={{ background: 'linear-gradient(135deg, #2563EB, #3395FF)' }}
        >
          <p className="text-[17px] font-bold text-white mb-1.5">{best.name}의 최적 옵션은?</p>
          <p className="text-[13px] mb-4" style={{ color: 'rgba(255,255,255,0.7)' }}>5개 질문으로 딱 맞는 트림과 옵션을 추천해드립니다</p>
          <button
            onClick={() => router.push(`/diagnosis/vehicle/option?car=${encodeURIComponent(best.name)}`)}
            className="py-3.5 px-8 rounded-2xl text-sm font-semibold"
            style={{ background: '#FFF', color: COLOR }}
          >
            🎯 옵션 추천받기
          </button>
        </motion.div>

        {/* 공유 + 하단 버튼 */}
        <div className="flex flex-col gap-3">
          <div className="flex gap-2">
            <Button variant="surface" className="flex-1" onClick={handleKakaoShare}>카카오톡 공유</Button>
            <Button variant="surface" className="flex-1" onClick={handleShare}>{copied ? '복사됨!' : '링크 공유'}</Button>
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

  return (
    <QuizModule
      basicQs={DEFAULT_VEHICLE_BASIC}
      detailQs={DEFAULT_VEHICLE_DETAIL}
      color={COLOR}
      onHome={() => router.push('/diagnosis')}
      renderResult={(props) => <VehResult {...props} vehicles={vehicles} />}
    />
  );
}
