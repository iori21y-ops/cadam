'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { formatPhone, removePhoneHyphens, isValidPhone } from '@/lib/phoneUtils';
import { useQuoteStore } from '@/store/quoteStore';
import { useToast } from '@/hooks/useToast';
import { gtag } from '@/lib/gtag';
import { Button } from '@/components/ui/Button';
import { IconPhone } from '@/components/icons/RentailorIcons';

interface EstimateContactProps {
  onSubmitted: () => void;
}

export function EstimateContact({ onSubmitted }: EstimateContactProps) {
  const [nameValue, setNameValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [nameError, setNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setName = useQuoteStore((s) => s.setName);
  const setPhone = useQuoteStore((s) => s.setPhone);
  const { showToast } = useToast();

  const handleSubmit = useCallback(async () => {
    if (isSubmitting) return;
    const trimmedName = nameValue.trim();
    if (!trimmedName) { setNameError(true); return; }
    if (!isValidPhone(phoneValue)) { setPhoneError(true); return; }
    if (!privacyAgreed) return;

    setIsSubmitting(true);
    const state = useQuoteStore.getState();
    const body = {
      selectionPath: 'car' as const,
      carBrand: state.carBrand ?? null,
      carModel: state.carModel ?? null,
      trim: state.trim,
      contractMonths: state.contractMonths,
      annualKm: state.annualKm,
      deposit: state.deposit,
      prepaymentPct: state.prepaymentPct,
      name: trimmedName,
      phone: removePhoneHyphens(phoneValue),
      email: '',
      contactMethod: 'phone' as const,
      privacyAgreed: true as const,
      stepCompleted: 6,
    };

    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setName(trimmedName);
        setPhone(phoneValue);
        gtag.formSubmitSuccess(body.carBrand ?? undefined, body.carModel ?? undefined);
        onSubmitted();
        return;
      }
      if (res.status === 429) {
        gtag.formSubmitError('rate_limit');
        showToast('과도한 요청입니다. 1분 후 다시 시도해 주세요.', 'error');
        return;
      }
      if (res.status === 409) {
        gtag.formSubmitError('duplicate');
        showToast('이미 접수된 신청이 있습니다. 상담사가 곧 연락드립니다.', 'warning');
        onSubmitted();
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
  }, [isSubmitting, nameValue, phoneValue, privacyAgreed, setName, setPhone, showToast, onSubmitted]);

  return (
    <div className="px-5 pt-7 pb-4">
      <h2 className="text-[22px] font-bold text-text text-center leading-snug mb-2">
        상담을 신청해 주세요
      </h2>
      <p className="text-sm text-text-sub text-center mb-6">
        전문 상담사가 정확한 견적과 함께 연락드려요
      </p>

      <div className="mb-4">
        <label htmlFor="e-name" className="block text-[11px] font-semibold text-text-sub mb-1">이름</label>
        <input
          id="e-name" type="text" placeholder="홍길동"
          value={nameValue}
          onChange={(e) => { setNameValue(e.target.value); setNameError(false); }}
          className={`w-full bg-surface-secondary border rounded-[10px] px-[14px] py-[12px] text-sm text-text outline-none focus:border-primary ${nameError ? 'border-danger' : 'border-border-solid'}`}
        />
        {nameError && <p className="text-xs text-danger mt-1">이름을 입력해 주세요</p>}
      </div>

      <div className="mb-4">
        <label htmlFor="e-phone" className="block text-[11px] font-semibold text-text-sub mb-1">연락처</label>
        <input
          id="e-phone" type="tel" inputMode="numeric" placeholder="010-0000-0000"
          value={phoneValue}
          onChange={(e) => { setPhoneValue(formatPhone(e.target.value)); setPhoneError(false); }}
          className={`w-full bg-surface-secondary border rounded-[10px] px-[14px] py-[12px] text-sm text-text outline-none focus:border-primary ${phoneError ? 'border-danger' : 'border-border-solid'}`}
        />
        {phoneError && <p className="text-xs text-danger mt-1">올바른 연락처를 입력해 주세요</p>}
      </div>

      <label className="flex items-start gap-2.5 mt-4 cursor-pointer">
        <input type="checkbox" checked={privacyAgreed} onChange={(e) => setPrivacyAgreed(e.target.checked)}
          className="w-5 h-5 mt-0.5 shrink-0 accent-primary" />
        <span className="text-sm text-text leading-relaxed">
          개인정보 수집 및 이용에 동의합니다{' '}
          <Link href="/privacy" target="_blank" className="text-primary text-xs font-semibold">[전문보기]</Link>
        </span>
      </label>

      <Button type="button" variant="primary" size="lg" fullWidth
        disabled={isSubmitting || !nameValue.trim() || !isValidPhone(phoneValue) || !privacyAgreed}
        onClick={handleSubmit}
        className="min-h-12 mt-6 gap-2"
      >
        {isSubmitting
          ? (<><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />요청 중...</>)
          : (<><IconPhone size={16} className="mr-1.5" />상담 신청하기</>)}
      </Button>
    </div>
  );
}
