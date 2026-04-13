'use client';

import Link from 'next/link';
import { BRAND } from '@/constants/brand';

const PHONE = process.env.NEXT_PUBLIC_PHONE_NUMBER ?? '02-0000-0000';
const KAKAO_URL = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL ?? '#';

export function Footer() {
  const telHref = `tel:${PHONE.replace(/-/g, '')}`;

  return (
    <footer className="bg-primary text-white/80">
      <div className="max-w-[1024px] mx-auto px-5 py-10">
        {/* 상단: 로고 + 서비스 링크 */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
          <div>
            <p
              className="text-lg font-semibold text-white mb-1"
              style={{ fontFamily: 'var(--font-display), serif' }}
            >
              RenTailor
            </p>
            <p className="text-[13px] text-white/50">
              당신에게 맞춘 렌트
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[13px]">
            <Link href="/popular-estimates" className="hover:text-[#C9A84C] transition-colors">
              인기차종
            </Link>
            <Link href="/diagnosis" className="hover:text-[#C9A84C] transition-colors">
              AI 진단
            </Link>
            <Link href="/info" className="hover:text-[#C9A84C] transition-colors">
              렌트 가이드
            </Link>
            <Link href="/quote" className="hover:text-[#C9A84C] transition-colors">
              상담 신청
            </Link>
          </div>
        </div>

        {/* 구분선 */}
        <div className="border-t border-white/10 pt-6" />

        {/* 하단: 연락처 + 카피라이트 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-[12px] text-white/40">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            <span>
              운영시간: 평일 09:00 ~ 18:00
            </span>
            <a href={telHref} className="hover:text-[#C9A84C] transition-colors">
              {PHONE}
            </a>
            <a
              href={KAKAO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#C9A84C] transition-colors"
            >
              카카오톡 상담
            </a>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-[#C9A84C] transition-colors">
              개인정보 처리방침
            </Link>
            <span>{BRAND.footerCopy}</span>
          </div>
        </div>
      </div>

      {/* 모바일 하단 탭바 여백 */}
      <div className="h-16 md:hidden" />
    </footer>
  );
}
