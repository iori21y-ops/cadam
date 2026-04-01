'use client';

import { useRouter } from 'next/navigation';
import { useQuoteStore } from '@/store/quoteStore';
import { gtag } from '@/lib/gtag';
import type { Vehicle } from '@/constants/vehicles';
import { Button, ButtonLink } from '@/components/ui/Button';

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
    <div className="p-5 flex flex-col gap-3 bg-white rounded-2xl border border-border-solid">
      <Button type="button" variant="primary" size="lg" fullWidth onClick={handleQuoteClick}>
        이 차량으로 무료 견적 받기
      </Button>
      <ButtonLink
        variant="kakao"
        size="lg"
        fullWidth
        href={KAKAO_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => gtag.seoCtaClick(vehicle.slug, 'kakao')}
      >
        💬 카카오톡 상담
      </ButtonLink>
      <ButtonLink
        variant="outline"
        size="lg"
        fullWidth
        href={telHref}
        onClick={() => gtag.seoCtaClick(vehicle.slug, 'call')}
      >
        📞 전화 상담
      </ButtonLink>
    </div>
  );
}
