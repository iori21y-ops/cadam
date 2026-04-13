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
import { loadProgress } from '@/lib/mission-progress';
import { VEHICLES } from '@/data/diagnosis-vehicles';
import type { Brand } from '@/constants/vehicles';

type ContactMethod = 'phone' | 'email' | 'kakao' | 'skip';

const KAKAO_URL = process.env.NEXT_PUBLIC_KAKAO_CHANNEL_URL ?? '#';

/** 진단 결과에서 차종 정보 보충 */
function getCarFromDiagnosis(): { brand: Brand; model: string } | null {
  const progress = loadProgress();
  if (!progress.vehicle.done || !progress.vehicle.summary) return null;
  const parts = progress.vehicle.summary.split(' ');
  if (parts.length < 2) return null;
  const brand = parts[0];
  const name = parts.slice(1).join(' ');
  const found = VEHICLES.find((v) => v.brand === brand && v.name === name);
  return found ? { brand: found.brand as Brand, model: found.name } : null;
}

export function Step6Contact() {
  const router = useRouter();
  const [method, setMethod] = useState<ContactMethod | null>(null);
  const [nameValue, setNameValue] = useState('');
  const [phoneValue, setPhoneValue] = useState('');
  const [emailValue, setEmailValue] = useState('');
  const [nameError, setNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const setName = useQuoteStore((s) => s.setName);
  const setPhone = useQuoteStore((s) => s.setPhone);

  const { showToast } = useToast();

  const handleSubmit = useCallback(async (submitMethod: ContactMethod) => {
    if (isSubmitting) return;

    // 건너뛰기
    if (submitMethod === 'skip') {
      // 이름만 임시로 설정해서 결과 페이지 접근 허용
      setName('고객');
      setPhone('skip');
      router.push('/result');
      return;
    }

    // 카카오 — API 저장 + 진단 결과 요약 메시지 포함하여 채널 이동
    if (submitMethod === 'kakao') {
      const trimmedKakaoName = nameValue.trim() || '고객';
      setName(trimmedKakaoName);
      setPhone('kakao');
      setIsSubmitting(true);

      // 1) consultation INSERT + 이메일 발송 (phone/email과 동일)
      const state = useQuoteStore.getState();
      const carInfo = (state.carBrand && state.carModel) ? null : getCarFromDiagnosis();
      const progress = loadProgress();

      try {
        await fetch('/api/consultation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            selectionPath: state.selectionPath ?? null,
            carBrand: state.carBrand ?? carInfo?.brand ?? null,
            carModel: state.carModel ?? carInfo?.model ?? null,
            trim: state.trim,
            contractMonths: state.contractMonths,
            annualKm: state.annualKm,
            deposit: state.deposit,
            prepaymentPct: state.prepaymentPct,
            monthlyBudget: state.monthlyBudget,
            name: trimmedKakaoName,
            phone: '',
            email: '',
            contactMethod: 'kakao',
            financeSummary: progress.finance.summary ?? null,
            vehicleAnswers: progress.vehicle.answers ?? null,
            financeAnswers: progress.finance.answers ?? null,
            privacyAgreed: true,
            stepCompleted: 5,
          }),
        });
      } catch {
        // API 실패해도 카카오 채널은 이동
      }

      // 2) 진단 결과 요약 메시지 생성 → 카카오 채널 채팅 URL에 포함
      const lines = ['[렌테일러 AI 진단 결과]'];
      if (progress.vehicle.done && progress.vehicle.summary) lines.push(`추천 차종: ${progress.vehicle.summary}`);
      if (progress.finance.done && progress.finance.summary) lines.push(`추천 이용방법: ${progress.finance.summary}`);
      if (trimmedKakaoName !== '고객') lines.push(`이름: ${trimmedKakaoName}`);
      lines.push('', '위 결과를 바탕으로 맞춤 상담 부탁드립니다.');
      const chatText = encodeURIComponent(lines.join('\n'));
      const chatUrl = KAKAO_URL.replace(/\/?\s*$/, '') + `/chat?text=${chatText}`;

      window.open(chatUrl, '_blank');
      setIsSubmitting(false);
      router.push('/result');
      return;
    }

    // 유효성 검사
    const trimmedName = nameValue.trim();
    if (!trimmedName) { setNameError(true); return; }

    if (submitMethod === 'phone') {
      if (!isValidPhone(phoneValue)) { setPhoneError(true); return; }
      if (!privacyAgreed) return;
    }

    if (submitMethod === 'email') {
      if (!emailValue.includes('@') || emailValue.length < 5) { setEmailError(true); return; }
      if (!privacyAgreed) return;
    }

    setIsSubmitting(true);

    const state = useQuoteStore.getState();
    // quoteStore에 이미 차종이 있으면 (prefillFromDiagnosis로 세팅됨) 그대로 사용
    const carInfo = (state.carBrand && state.carModel) ? null : getCarFromDiagnosis();

    const progress = loadProgress();

    const body = {
      selectionPath: state.selectionPath ?? null,
      carBrand: state.carBrand ?? carInfo?.brand ?? null,
      carModel: state.carModel ?? carInfo?.model ?? null,
      trim: state.trim,
      contractMonths: state.contractMonths,
      annualKm: state.annualKm,
      deposit: state.deposit,
      prepaymentPct: state.prepaymentPct,
      monthlyBudget: state.monthlyBudget,
      name: trimmedName,
      phone: submitMethod === 'phone' ? removePhoneHyphens(phoneValue) : '',
      email: submitMethod === 'email' ? emailValue : '',
      contactMethod: submitMethod,
      financeSummary: progress.finance.summary ?? null,
      vehicleAnswers: progress.vehicle.answers ?? null,
      financeAnswers: progress.finance.answers ?? null,
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
        setName(trimmedName);
        setPhone(submitMethod === 'phone' ? phoneValue : submitMethod);
        useQuoteStore.getState().setEstimatedMin(json.estimatedMin ?? null);
        useQuoteStore.getState().setEstimatedMax(json.estimatedMax ?? null);
        gtag.formSubmitSuccess(
          body.carBrand ?? undefined,
          body.carModel ?? undefined
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
        showToast('이미 접수된 신청이 있습니다. 상담사가 곧 연락드립니다.', 'warning');
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
  }, [isSubmitting, nameValue, phoneValue, emailValue, privacyAgreed, router, setName, setPhone, showToast]);

  // ─── 방식 미선택: 선택 화면 ───
  if (!method) {
    return (
      <div className="px-5 py-6">
        <h2 className="text-[20px] font-bold text-text text-center leading-snug mb-2">
          결과를 어떻게 받으시겠어요?
        </h2>
        <p className="text-xs text-text-sub text-center mb-6">
          연락처 없이도 결과를 확인할 수 있어요
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            onClick={() => setMethod('phone')}
            className="w-full p-4 rounded-2xl bg-surface border border-border-solid text-left hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📞</span>
              <div>
                <p className="text-sm font-bold text-text">전화번호로 상담 신청</p>
                <p className="text-[11px] text-text-sub">전문 상담사가 직접 연락드립니다</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setMethod('email')}
            className="w-full p-4 rounded-2xl bg-surface border border-border-solid text-left hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">📧</span>
              <div>
                <p className="text-sm font-bold text-text">이메일로 결과 받기</p>
                <p className="text-[11px] text-text-sub">상세 견적서를 이메일로 보내드립니다</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setMethod('kakao')}
            className="w-full p-4 rounded-2xl bg-surface border border-border-solid text-left hover:border-primary transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-xl">💬</span>
              <div>
                <p className="text-sm font-bold text-text">카카오톡으로 상담하기</p>
                <p className="text-[11px] text-text-sub">카카오 채널에서 바로 상담 가능</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => handleSubmit('skip')}
            className="w-full py-3 text-xs text-text-muted hover:text-primary transition-colors"
          >
            연락처 없이 결과만 보기
          </button>
        </div>
      </div>
    );
  }

  // ─── 전화번호 입력 ───
  if (method === 'phone') {
    return (
      <div className="px-5 py-4">
        <button onClick={() => setMethod(null)} className="flex items-center gap-1.5 text-sm font-semibold text-primary mb-5 hover:opacity-80 transition-opacity">
          <span>←</span> 다른 방식 선택
        </button>

        <div className="mb-4">
          <label htmlFor="c-name" className="block text-[11px] font-semibold text-text-sub mb-1">이름</label>
          <input
            id="c-name" type="text" placeholder="홍길동"
            value={nameValue}
            onChange={(e) => { setNameValue(e.target.value); setNameError(false); }}
            className={`w-full bg-surface-secondary border rounded-[10px] px-[14px] py-[12px] text-sm text-text outline-none focus:border-primary ${nameError ? 'border-danger' : 'border-border-solid'}`}
          />
          {nameError && <p className="text-xs text-danger mt-1">이름을 입력해 주세요</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="c-phone" className="block text-[11px] font-semibold text-text-sub mb-1">연락처</label>
          <input
            id="c-phone" type="tel" placeholder="010-0000-0000"
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
          onClick={() => handleSubmit('phone')}
          className="min-h-12 mt-6 gap-2"
        >
          {isSubmitting ? (<><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />요청 중...</>) : '📞 전화 상담 신청'}
        </Button>
      </div>
    );
  }

  // ─── 이메일 입력 ───
  if (method === 'email') {
    return (
      <div className="px-5 py-4">
        <button onClick={() => setMethod(null)} className="flex items-center gap-1.5 text-sm font-semibold text-primary mb-5 hover:opacity-80 transition-opacity">
          <span>←</span> 다른 방식 선택
        </button>

        <div className="mb-4">
          <label htmlFor="c-name-e" className="block text-[11px] font-semibold text-text-sub mb-1">이름</label>
          <input
            id="c-name-e" type="text" placeholder="홍길동"
            value={nameValue}
            onChange={(e) => { setNameValue(e.target.value); setNameError(false); }}
            className={`w-full bg-surface-secondary border rounded-[10px] px-[14px] py-[12px] text-sm text-text outline-none focus:border-primary ${nameError ? 'border-danger' : 'border-border-solid'}`}
          />
          {nameError && <p className="text-xs text-danger mt-1">이름을 입력해 주세요</p>}
        </div>

        <div className="mb-4">
          <label htmlFor="c-email" className="block text-[11px] font-semibold text-text-sub mb-1">이메일</label>
          <input
            id="c-email" type="email" placeholder="example@email.com"
            value={emailValue}
            onChange={(e) => { setEmailValue(e.target.value); setEmailError(false); }}
            className={`w-full bg-surface-secondary border rounded-[10px] px-[14px] py-[12px] text-sm text-text outline-none focus:border-primary ${emailError ? 'border-danger' : 'border-border-solid'}`}
          />
          {emailError && <p className="text-xs text-danger mt-1">올바른 이메일을 입력해 주세요</p>}
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
          disabled={isSubmitting || !nameValue.trim() || !emailValue.includes('@') || !privacyAgreed}
          onClick={() => handleSubmit('email')}
          className="min-h-12 mt-6 gap-2"
        >
          {isSubmitting ? (<><span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />요청 중...</>) : '📧 이메일로 결과 받기'}
        </Button>
      </div>
    );
  }

  // ─── 카카오 (이름만 + 채널 이동) ───
  if (method === 'kakao') {
    return (
      <div className="px-5 py-4">
        <button onClick={() => setMethod(null)} className="flex items-center gap-1.5 text-sm font-semibold text-primary mb-5 hover:opacity-80 transition-opacity">
          <span>←</span> 다른 방식 선택
        </button>

        <div className="mb-4">
          <label htmlFor="c-name-k" className="block text-[11px] font-semibold text-text-sub mb-1">이름 (선택)</label>
          <input
            id="c-name-k" type="text" placeholder="홍길동"
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            className="w-full bg-surface-secondary border border-border-solid rounded-[10px] px-[14px] py-[12px] text-sm text-text outline-none focus:border-primary"
          />
        </div>

        <p className="text-xs text-text-sub mb-4 leading-relaxed">
          카카오톡 채널로 이동하여 상담사와 직접 대화할 수 있습니다.
          진단 결과를 함께 전달하면 더 정확한 상담이 가능합니다.
        </p>

        <Button type="button" variant="kakao" size="lg" fullWidth
          onClick={() => handleSubmit('kakao')}
          className="min-h-12 gap-2"
        >
          💬 카카오톡 채널로 이동
        </Button>
      </div>
    );
  }

  return null;
}
