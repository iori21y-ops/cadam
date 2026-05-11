'use client';

import { useState, useEffect } from 'react';

interface ConsultationSheetProps {
  isOpen: boolean;
  onClose: () => void;
  note?: string;
}

export function ConsultationSheet({ isOpen, onClose, note }: ConsultationSheetProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitResult, setSubmitResult] = useState<'success' | 'duplicate' | 'error' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSubmitResult(null);
      setName('');
      setPhone('');
      setAgreed(false);
      setErrorMsg('');
    }
  }, [isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed) return;
    setLoading(true);
    setSubmitResult(null);
    setErrorMsg('');

    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          privacyAgreed: true,
          contactMethod: 'phone',
          stepCompleted: 1,
        }),
      });

      if (res.ok) {
        setSubmitResult('success');
      } else if (res.status === 409) {
        setSubmitResult('duplicate');
      } else if (res.status === 429) {
        setErrorMsg('잠시 후 다시 시도해주세요.');
        setSubmitResult('error');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg((data as { error?: string }).error ?? '오류가 발생했습니다.');
        setSubmitResult('error');
      }
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.');
      setSubmitResult('error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* 딤 오버레이 */}
      <div
        className={`fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* 하단 시트 */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out max-h-[85vh] flex flex-col lg:left-1/2 lg:right-auto lg:max-w-2xl lg:-translate-x-1/2 ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 bg-border rounded-full" />
        </div>

        {submitResult === 'success' ? (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              <div className="max-w-2xl mx-auto py-8 text-center">
                <div className="text-5xl mb-4">✅</div>
                <p className="text-xl font-bold text-text mb-2">신청이 완료됐습니다</p>
                <p className="text-sm text-text-sub">빠른 시간 내에 연락드리겠습니다.</p>
              </div>
            </div>
            <div className="shrink-0 px-5 pt-3 pb-24 bg-white border-t border-border">
              <button
                onClick={onClose}
                className="w-full py-4 bg-primary text-white rounded-xl font-semibold"
              >
                닫기
              </button>
            </div>
          </>
        ) : submitResult === 'duplicate' ? (
          <>
            <div className="flex-1 overflow-y-auto px-5">
              <div className="max-w-2xl mx-auto py-8 text-center">
                <div className="text-5xl mb-4">📋</div>
                <p className="text-xl font-bold text-text mb-2">이미 신청하셨습니다</p>
                <p className="text-sm text-text-sub">
                  24시간 내 동일한 신청이 접수되어 있습니다.<br />
                  담당자가 곧 연락드릴 예정입니다.
                </p>
              </div>
            </div>
            <div className="shrink-0 px-5 pt-3 pb-24 bg-white border-t border-border">
              <button
                onClick={onClose}
                className="w-full py-4 bg-primary text-white rounded-xl font-semibold"
              >
                확인
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 pb-4">
              <div className="max-w-2xl mx-auto">
                <div className="flex items-center justify-between py-4 border-b border-border mb-4">
                  <p className="text-base font-bold text-text">무료 견적 신청</p>
                  <button onClick={onClose} className="text-text-muted text-xl shrink-0">✕</button>
                </div>
                {note && (
                  <div className="bg-accent/10 rounded-xl px-4 py-2.5 mb-4">
                    <p className="text-xs text-text-sub mb-0.5">선택 조건</p>
                    <p className="text-sm font-semibold text-accent">{note}</p>
                  </div>
                )}

                <form id="consult-sheet-form" onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">
                      이름 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="홍길동"
                      className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-text mb-1.5">
                      연락처 <span className="text-danger">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="010-0000-0000"
                      className="w-full px-4 py-3 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <label className="flex items-start gap-2.5 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={agreed}
                      onChange={(e) => setAgreed(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-primary shrink-0"
                    />
                    <span className="text-xs text-text-sub leading-relaxed">
                      <a
                        href="/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline text-primary font-medium"
                      >
                        개인정보 처리방침
                      </a>
                      에 동의합니다. (필수)
                    </span>
                  </label>
                </form>
              </div>
            </div>

            <div className="shrink-0 px-5 pt-3 pb-24 bg-white border-t border-border">
              <div className="max-w-2xl mx-auto">
                {submitResult === 'error' && errorMsg && (
                  <p className="text-xs text-danger bg-red-50 px-3 py-2 rounded-lg mb-3">{errorMsg}</p>
                )}
                <button
                  type="submit"
                  form="consult-sheet-form"
                  disabled={loading || !agreed || !name || !phone}
                  className="w-full py-4 bg-primary text-white rounded-xl font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                >
                  {loading ? '처리 중...' : '무료 견적 신청하기'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
