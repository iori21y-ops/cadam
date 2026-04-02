'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  formatPhone,
  removePhoneHyphens,
  isValidPhone,
} from '@/lib/phoneUtils';
import { useQuoteStore } from '@/store/quoteStore';
import { useToast } from '@/hooks/useToast';
import { gtag } from '@/lib/gtag';
import { Button } from '@/components/ui/Button';

export function Step6Contact() {
  const router = useRouter();
  const [nameError, setNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const name = useQuoteStore((s) => s.name);
  const phone = useQuoteStore((s) => s.phone);
  const privacyAgreed = useQuoteStore((s) => s.privacyAgreed);
  const setName = useQuoteStore((s) => s.setName);
  const setPhone = useQuoteStore((s) => s.setPhone);
  const setPrivacyAgreed = useQuoteStore((s) => s.setPrivacyAgreed);

  const { showToast } = useToast();
  const isNameValid = name.trim().length > 0;
  const isPhoneValid = isValidPhone(phone);
  const isFormValid = isNameValid && isPhoneValid && privacyAgreed;
  const isButtonDisabled = !isFormValid || isSubmitting;

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setName(e.target.value);
      setNameError(false);
    },
    [setName]
  );

  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const formatted = formatPhone(e.target.value);
      setPhone(formatted);
      setPhoneError(false);
    },
    [setPhone]
  );

  const handleSubmit = useCallback(async () => {
    if (isButtonDisabled) return;

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

    const state = useQuoteStore.getState();
    const body = {
      selectionPath: state.selectionPath,
      carBrand: state.carBrand,
      carModel: state.carModel,
      trim: state.trim,
      contractMonths: state.contractMonths,
      annualKm: state.annualKm,
      deposit: state.deposit,
      prepaymentPct: state.prepaymentPct,
      monthlyBudget: state.monthlyBudget,
      name: trimmedName,
      phone: removePhoneHyphens(phone),
      privacyAgreed: true,
      stepCompleted: 5,
    };

    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const json = await res.json();
        useQuoteStore.getState().setEstimatedMin(json.estimatedMin ?? null);
        useQuoteStore.getState().setEstimatedMax(json.estimatedMax ?? null);
        gtag.formSubmitSuccess(
          state.carBrand ?? undefined,
          state.carModel ?? undefined
        );
        router.push('/result');
        return;
      }

      if (res.status === 429) {
        gtag.formSubmitError('rate_limit');
        showToast('과도한 요청입니다. 1분 후 다시 시도해 주세요.', 'error');
        return;
      }

      if (res.status === 409) {
        gtag.formSubmitError('duplicate');
        showToast(
          '이미 접수된 신청이 있습니다. 상담사가 곧 연락드립니다.',
          'warning'
        );
        return;
      }

      gtag.formSubmitError('server_error');
      showToast('네트워크 오류가 발생했습니다. 다시 시도해 주세요.', 'error');
    } catch {
      gtag.formSubmitError('network_error');
      showToast('네트워크 오류가 발생했습니다. 다시 시도해 주세요.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [isButtonDisabled, name, phone, privacyAgreed, router, showToast]);

  return (
    <div className="px-5 py-4">
      {/* 이름 */}
      <div className="mb-4">
        <label
          htmlFor="step6-name"
          className="block text-[11px] font-semibold text-text-sub mb-1"
        >
          이름
        </label>
        <input
          id="step6-name"
          type="text"
          placeholder="홍길동"
          value={name}
          onChange={handleNameChange}
          className={`w-full bg-surface-secondary border rounded-[10px] px-[14px] py-[12px] text-sm text-text outline-none focus:border-primary ${
            nameError ? 'border-[#FF3B30]' : 'border-border-solid'
          }`}
        />
        {nameError && (
          <p className="text-xs text-danger mt-1">이름을 입력해 주세요</p>
        )}
      </div>

      {/* 연락처 */}
      <div className="mb-4">
        <label
          htmlFor="step6-phone"
          className="block text-[11px] font-semibold text-text-sub mb-1"
        >
          연락처
        </label>
        <input
          id="step6-phone"
          type="tel"
          placeholder="010-0000-0000"
          value={phone}
          onChange={handlePhoneChange}
          className={`w-full bg-surface-secondary border rounded-[10px] px-[14px] py-[12px] text-sm text-text outline-none focus:border-primary ${
            phoneError ? 'border-[#FF3B30]' : 'border-border-solid'
          }`}
        />
        {phoneError && (
          <p className="text-xs text-danger mt-1">
            올바른 연락처를 입력해 주세요
          </p>
        )}
      </div>

      {/* 개인정보 동의 */}
      <label className="flex items-start gap-2.5 mt-4 cursor-pointer">
        <input
          type="checkbox"
          checked={privacyAgreed}
          onChange={(e) => setPrivacyAgreed(e.target.checked)}
          className="w-5 h-5 mt-0.5 shrink-0 accent-primary"
        />
        <span className="text-sm text-text leading-relaxed">
          개인정보 수집 및 이용에 동의합니다{' '}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary text-xs font-semibold"
          >
            [전문보기]
          </Link>
        </span>
      </label>

      {/* 제출 버튼 */}
      <Button
        type="button"
        variant="primary"
        size="lg"
        fullWidth
        disabled={isButtonDisabled}
        onClick={handleSubmit}
        className="min-h-12 mt-6 gap-2"
      >
        {isSubmitting ? (
          <>
            <span
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"
              aria-hidden
            />
            견적 요청 중...
          </>
        ) : (
          '무료 견적 받기'
        )}
      </Button>
    </div>
  );
}
