'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isValidPhone, removePhoneHyphens } from '@/lib/phoneUtils';
import { useToast } from '@/hooks/useToast';
import { gtag } from '@/lib/gtag';
import { Footer } from '@/components/Footer';
import { InfoArticles } from '@/components/info/InfoArticles';

const COMPARE_ROWS: { label: string; purchase: string; rent: string }[] = [
  { label: '초기 비용', purchase: '수천만원', rent: '보증금만' },
  { label: '세금/보험', purchase: '직접 관리', rent: '포함' },
  { label: '정비', purchase: '직접 부담', rent: '포함' },
  { label: '차량 교체', purchase: '매각 필요', rent: '반납/교체' },
];

export default function InfoPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    document.cookie = 'inflow_page=/info; path=/; max-age=86400';
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setNameError(true);
      return;
    }
    if (!isValidPhone(phone)) {
      setPhoneError(true);
      return;
    }
    if (!privacyAgreed) return;

    setIsSubmitting(true);
    setNameError(false);
    setPhoneError(false);

    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          phone: removePhoneHyphens(phone),
          privacyAgreed: true,
          selectionPath: 'budget' as const,
          stepCompleted: 0,
        }),
      });

      if (res.ok) {
        gtag.quickFormSubmit();
        showToast('상담 신청이 완료되었습니다. 곧 연락드리겠습니다.', 'success');
        setName('');
        setPhone('');
        setPrivacyAgreed(false);
        return;
      }

      if (res.status === 429) {
        showToast('과도한 요청입니다. 1분 후 다시 시도해 주세요.', 'error');
        return;
      }

      if (res.status === 409) {
        showToast(
          '이미 접수된 신청이 있습니다. 상담사가 곧 연락드립니다.',
          'warning'
        );
        return;
      }

      showToast('네트워크 오류가 발생했습니다. 다시 시도해 주세요.', 'error');
    } catch {
      showToast('네트워크 오류가 발생했습니다. 다시 시도해 주세요.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [name, phone, privacyAgreed, showToast]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ① Hero 배너 */}
      <section
        className="flex flex-col items-center justify-center px-5 py-16 min-h-[65vh] bg-gradient-to-br from-primary to-accent text-white text-center"
      >
        <h1 className="text-2xl sm:text-3xl font-bold leading-tight mb-3">
          장기렌터카, 카담에서 가장 쉽게
        </h1>
        <p className="text-base sm:text-lg text-white/90 mb-6">
          나에게 맞는 조건으로 월 납부금을 비교해 보세요
        </p>
        <button
          type="button"
          onClick={() => {
            gtag.infoCtaClick('hero');
            router.push('/quote');
          }}
          className="px-8 py-3.5 rounded-lg font-bold text-accent bg-white hover:opacity-90 transition-opacity"
        >
          무료 견적 받기
        </button>
      </section>

      {/* ② 장기렌터카 안내 */}
      <section className="px-5 py-12">
        <h2 className="text-xl font-bold text-primary mb-6 text-center">
          장기렌터카, 왜 좋을까요?
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full min-w-[280px] text-sm">
            <thead>
              <tr className="bg-primary text-white">
                <th className="py-3 px-4 text-left font-semibold">항목</th>
                <th className="py-3 px-4 text-left font-semibold">구매</th>
                <th className="py-3 px-4 text-left font-semibold">장기렌트</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr
                  key={row.label}
                  className="border-t border-gray-200 even:bg-gray-50"
                >
                  <td className="py-3 px-4 text-gray-700">{row.label}</td>
                  <td className="py-3 px-4 text-gray-600">{row.purchase}</td>
                  <td className="py-3 px-4 text-accent font-semibold">
                    {row.rent}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ③ 장기렌터카 정보 (블로그/유튜브 포스팅) */}
      <InfoArticles />

      {/* ④ 간단 상담 폼 */}
      <section className="px-5 py-12 bg-gray-50">
        <h2 className="text-xl font-bold text-primary mb-6 text-center">
          1분 만에 상담 신청하기
        </h2>
        <div className="max-w-md mx-auto bg-white rounded-xl p-5 border border-gray-200">
          <div className="mb-4">
            <label
              htmlFor="info-name"
              className="block text-sm font-semibold text-gray-700 mb-1.5"
            >
              이름
            </label>
            <input
              id="info-name"
              type="text"
              placeholder="홍길동"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameError(false);
              }}
              className={`w-full py-3.5 px-4 border rounded-lg text-base outline-none focus:border-accent font-sans ${
                nameError ? 'border-danger' : 'border-gray-300'
              }`}
            />
            {nameError && (
              <p className="text-danger text-xs mt-1">이름을 입력해 주세요</p>
            )}
          </div>
          <div className="mb-4">
            <label
              htmlFor="info-phone"
              className="block text-sm font-semibold text-gray-700 mb-1.5"
            >
              연락처
            </label>
            <input
              id="info-phone"
              type="tel"
              placeholder="010-1234-5678"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setPhoneError(false);
              }}
              className={`w-full py-3.5 px-4 border rounded-lg text-base outline-none focus:border-accent font-sans ${
                phoneError ? 'border-danger' : 'border-gray-300'
              }`}
            />
            {phoneError && (
              <p className="text-danger text-xs mt-1">
                올바른 연락처를 입력해 주세요
              </p>
            )}
          </div>
          <label className="flex gap-2 items-start mb-6 cursor-pointer">
            <input
              type="checkbox"
              checked={privacyAgreed}
              onChange={(e) => setPrivacyAgreed(e.target.checked)}
              className="w-5 h-5 mt-0.5 shrink-0 accent-accent"
            />
            <span className="text-sm text-gray-700">
              개인정보 수집 및 이용에 동의합니다
            </span>
          </label>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 rounded-lg font-bold text-base bg-accent text-white hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? '처리 중...' : '상담 신청'}
          </button>
        </div>
      </section>

      {/* ⑤ Footer */}
      <Footer />
    </div>
  );
}
