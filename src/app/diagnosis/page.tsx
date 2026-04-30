'use client';

import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { SelectCard } from '@/components/ui/SelectCard';
import { IconDiagnosis, IconCarSedan, IconMemo, IconShield, IconBolt, IconTarget, IconDiagnosisChart, IconInstallment, type IconProps } from '@/components/icons/RentailorIcons';
import type React from 'react';
import { ParkAI } from '@/components/diagnosis/ParkAI';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { DEFAULT_AI_CONFIG } from '@/data/diagnosis-ai';
import type { AIConfig } from '@/types/diagnosis';

const CONFIG_ID = 'diagnosis_data_v1';

// 상단 강조 카드 (비교 시뮬레이터)
const HERO_SERVICE = {
  href: '/diagnosis/compare',
  accent: '#C9A84C',
  Icon: IconInstallment,
  title: '결제방식 비교',
  description: '할부·리스·렌트 3가지 방식의 총비용을 한 번에 비교하세요. 엔카 시세·금융감독원 통계·법적 세율로 계산합니다.',
  badge: 'NEW',
};

// 하단 2×2 그리드 카드
const SERVICES = [
  {
    href: '/diagnosis/finance',
    accent: '#C9A84C',
    Icon: IconDiagnosis,
    title: '금융상품 진단',
    description: '나에게 맞는 금융 방식을 1분에',
    color: 'text-finance',
    bg: 'bg-finance/8',
  },
  {
    href: '/diagnosis/vehicle',
    accent: '#5856D6',
    Icon: IconCarSedan,
    title: '차종 추천',
    description: '라이프스타일·예산 맞춤 차종',
    color: 'text-vehicle',
    bg: 'bg-vehicle/8',
  },
  {
    href: '/diagnosis/report',
    accent: '#007AFF',
    Icon: IconDiagnosisChart,
    title: '감가상각 분석',
    description: '내 차 시세·전환 최적 시점',
    color: 'text-[#007AFF]',
    bg: 'bg-[#007AFF]/8',
  },
  {
    href: '/quote',
    accent: '#34C759',
    Icon: IconMemo,
    title: '무료 견적',
    description: '전문가 맞춤 견적 비교',
    color: 'text-success',
    bg: 'bg-[#34C759]/8',
  },
];

const BADGES: { Icon: React.ComponentType<IconProps>; text: string }[] = [
  { Icon: IconShield, text: '개인정보 미수집' },
  { Icon: IconBolt, text: '1분 소요' },
  { Icon: IconTarget, text: 'AI 맞춤 추천' },
];

export default function DiagnosisPage() {
  const pathname = usePathname();
  const ACCENT = '#C9A84C';
  const router = useRouter();
  const [clickedHref, setClickedHref] = useState<string | null>(null);
  const clickedRef = useRef<string | null>(null);
  const [aiConfig, setAiConfig] = useState<AIConfig>(DEFAULT_AI_CONFIG);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase
      .from('diagnosis_config')
      .select('data')
      .eq('id', CONFIG_ID)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.data?.aiConfig) {
          setAiConfig({ ...DEFAULT_AI_CONFIG, ...data.data.aiConfig });
        }
      });
  }, []);

  const handleCardClick = (href: string) => {
    if (clickedRef.current) return;
    clickedRef.current = href;
    setClickedHref(href);
    router.push(href);
  };

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* AI 캐릭터 인사말 */}
      <section className="px-5 pt-6 pb-0 max-w-lg mx-auto">
        <ParkAI
          ctx=""
          cfg={aiConfig}
          variant="light"
          staticText={aiConfig.introComment}
        />
      </section>

      {/* 서비스 카드 — B 레이아웃 */}
      <section className="px-5 max-w-lg mx-auto flex flex-col gap-4">

        {/* 상단 강조 카드 (결제방식 비교) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0, duration: 0.35, ease: 'easeOut' }}
        >
          {(() => {
            const isActive = clickedHref === HERO_SERVICE.href || pathname?.startsWith(HERO_SERVICE.href);
            const isDimmed = clickedHref !== null && !isActive;
            return (
              <SelectCard
                selected={isActive}
                dimmed={isDimmed}
                disabled={!!clickedHref && !isActive}
                color={ACCENT}
                onClick={() => handleCardClick(HERO_SERVICE.href)}
              >
                <span className="w-14 h-14 flex items-center justify-center rounded-2xl shrink-0 bg-primary/5">
                  <HERO_SERVICE.Icon size={28} className={isActive ? 'text-white' : 'text-finance'} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-[16px] font-semibold transition-colors ${isActive ? 'text-white' : 'text-text'}`}>
                      {HERO_SERVICE.title}
                    </p>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                      style={{ backgroundColor: ACCENT + '20', color: ACCENT }}>
                      {HERO_SERVICE.badge}
                    </span>
                  </div>
                  <p className={`text-sm leading-relaxed transition-colors ${isActive ? 'text-white/70' : 'text-text-sub'}`}>
                    {HERO_SERVICE.description}
                  </p>
                </div>
              </SelectCard>
            );
          })()}
        </motion.div>

        {/* 하단 2×2 그리드 */}
        <div className="grid grid-cols-2 gap-3">
          {SERVICES.map((service, i) => (
            <motion.div
              key={service.href}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: (i + 1) * 0.07, duration: 0.3, ease: 'easeOut' }}
            >
              {(() => {
                const isSel = pathname?.startsWith(service.href);
                const isActive = isSel || clickedHref === service.href;
                const isDimmed = clickedHref !== null && !isActive;
                return (
                  <SelectCard
                    selected={isActive}
                    dimmed={isDimmed}
                    disabled={!!clickedHref && !isActive}
                    color={service.accent}
                    compact
                    onClick={() => handleCardClick(service.href)}
                  >
                    <span className="w-10 h-10 flex items-center justify-center rounded-xl shrink-0"
                      style={{ backgroundColor: isActive ? 'rgba(255,255,255,0.15)' : service.accent + '12' }}>
                      <service.Icon size={22} className={isActive ? 'text-white' : service.color} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[14px] font-semibold mb-0.5 transition-colors leading-tight ${isActive ? 'text-white' : 'text-text'}`}>
                        {service.title}
                      </p>
                      <p className={`text-xs leading-relaxed transition-colors ${isActive ? 'text-white/65' : 'text-text-sub'}`}>
                        {service.description}
                      </p>
                    </div>
                  </SelectCard>
                );
              })()}
            </motion.div>
          ))}
        </div>
      </section>

      {/* 신뢰 배지 */}
      <section className="px-5 mt-8 max-w-lg mx-auto">
        <div className="flex justify-center gap-4 flex-wrap">
          {BADGES.map((badge) => (
            <div key={badge.text} className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface shadow-sm">
              <badge.Icon size={15} className="text-primary" />
              <span className="text-[13px] text-text-sub font-medium">{badge.text}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
