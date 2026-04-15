'use client';

import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { useRef, useState, useEffect } from 'react';
import { SelectCard } from '@/components/ui/SelectCard';
import { IconDiagnosis, IconCarSedan, IconMemo, IconShield, IconBolt, IconTarget, type IconProps } from '@/components/icons/RentailorIcons';
import type React from 'react';
import { ParkAI } from '@/components/diagnosis/ParkAI';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { DEFAULT_AI_CONFIG } from '@/data/diagnosis-ai';
import type { AIConfig } from '@/types/diagnosis';

const CONFIG_ID = 'diagnosis_data_v1';

const SERVICES = [
  {
    href: '/diagnosis/finance',
    accent: '#C9A84C',
    Icon: IconDiagnosis,
    title: '금융상품 진단',
    description: '할부·리스·렌트·현금 중 나에게 맞는 금융 방식을 1분 만에 알아보세요.',
    color: 'text-finance',
    bg: 'bg-finance/8',
  },
  {
    href: '/diagnosis/vehicle',
    accent: '#5856D6',
    Icon: IconCarSedan,
    title: '차종 추천',
    description: '라이프스타일과 예산에 딱 맞는 차종을 추천받으세요.',
    color: 'text-vehicle',
    bg: 'bg-vehicle/8',
  },
  {
    href: '/quote',
    accent: '#34C759',
    Icon: IconMemo,
    title: '무료 견적',
    description: '원하는 차종과 조건을 선택하면 전문가가 무료로 견적을 드립니다.',
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
      .single()
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
    <div className="min-h-screen bg-surface-secondary pb-24">
      {/* AI 캐릭터 인사말 */}
      <section className="px-5 pt-6 pb-0 max-w-lg mx-auto">
        <ParkAI
          ctx=""
          cfg={aiConfig}
          variant="light"
          staticText={aiConfig.introComment}
        />
      </section>

      {/* 서비스 카드 */}
      <section
        className="px-5 max-w-lg mx-auto flex flex-col gap-4"
      >
        {SERVICES.map((service, i) => (
          <motion.div
            key={service.href}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35, ease: 'easeOut' }}
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
                    color={ACCENT}
                    onClick={() => handleCardClick(service.href)}
                  >
                    <span className="w-14 h-14 flex items-center justify-center rounded-2xl shrink-0 bg-primary/5">
                      <service.Icon size={28} className={isActive ? 'text-white' : service.color} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[16px] font-medium mb-0.5 transition-colors ${
                          isActive ? 'text-white' : 'text-text'
                        }`}
                      >
                        {service.title}
                      </p>
                      <p
                        className={`text-sm leading-relaxed transition-colors ${
                          isActive ? 'text-white/70' : 'text-text-sub'
                        }`}
                      >
                        {service.description}
                      </p>
                    </div>
                  </SelectCard>
                );
              })()}
          </motion.div>
        ))}
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
