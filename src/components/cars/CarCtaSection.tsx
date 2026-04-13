'use client';

import { useRouter } from 'next/navigation';
import { useQuoteStore } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';
import type { Vehicle } from '@/constants/vehicles';
import { Phone, MessageCircle } from 'lucide-react';

interface CarCtaSectionProps {
  vehicle: Vehicle;
}

const KAKAO_URL = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL ?? '#';
const PHONE = process.env.NEXT_PUBLIC_PHONE_NUMBER ?? '02-0000-0000';

export function CarCtaSection({ vehicle }: CarCtaSectionProps) {
  const router = useRouter();
  const setSelectionPath = useQuoteStore((s) => s.setSelectionPath);
  const setCarBrand = useQuoteStore((s) => s.setCarBrand);
  const setCarModel = useQuoteStore((s) => s.setCarModel);
  const setTrim = useQuoteStore((s) => s.setTrim);
  const setCurrentStep = useQuoteStore((s) => s.setCurrentStep);

  const handleQuoteClick = () => {
    gtag.seoCtaClick(vehicle.slug, 'quote');
    setSelectionPath('car');
    setCarBrand(vehicle.brand);
    setCarModel(vehicle.model);
    setTrim(vehicle.trims[0] ?? null);
    setCurrentStep(3);
    router.push('/quote');
  };

  const telHref = `tel:${PHONE.replace(/-/g, '')}`;

  return (
    <section className="px-5 py-6">
      <div className="space-y-2.5">
        <button
          type="button"
          onClick={handleQuoteClick}
          className="w-full py-4 rounded-xl bg-primary text-white font-bold text-base hover:bg-primary/90 transition-colors active:scale-[0.98]"
        >
          이 차량으로 무료 견적 받기
        </button>
        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={KAKAO_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => gtag.seoCtaClick(vehicle.slug, 'kakao')}
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl bg-[#FEE500] text-[#3C1E1E] font-semibold text-sm hover:brightness-95 transition-all"
          >
            <MessageCircle size={16} />
            카카오톡
          </a>
          <a
            href={telHref}
            onClick={() => gtag.seoCtaClick(vehicle.slug, 'call')}
            className="flex items-center justify-center gap-1.5 py-3 rounded-xl border border-border-solid bg-white text-text font-semibold text-sm hover:bg-surface-secondary transition-colors"
          >
            <Phone size={16} />
            전화 상담
          </a>
        </div>
      </div>
    </section>
  );
}
