'use client';

import { useState } from 'react';
import { VEHICLE_LIST } from '@/constants/vehicles';

type Step = 'vehicle' | 'details' | 'contact' | 'done';

const PERIOD_OPTIONS = ['24개월', '36개월', '48개월', '60개월'];
const MILEAGE_OPTIONS = ['연 1만km', '연 1.5만km', '연 2만km', '연 2.5만km', '연 3만km'];
const DEPOSIT_OPTIONS = [
  { label: '없음 (0원)', value: 0 },
  { label: '100만원', value: 1000000 },
  { label: '300만원', value: 3000000 },
  { label: '500만원', value: 5000000 },
  { label: '1,000만원', value: 10000000 },
  { label: '직접 상담', value: -1 },
];

const brands = ['현대', '기아', '제네시스'] as const;

export default function DirectPage() {
  const [step, setStep] = useState<Step>('vehicle');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [period, setPeriod] = useState('');
  const [mileage, setMileage] = useState('');
  const [deposit, setDeposit] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [contactMethod, setContactMethod] = useState<'phone' | 'kakao'>('phone');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const filteredVehicles = VEHICLE_LIST.filter((v) => v.brand === selectedBrand);
  const selectedModel = VEHICLE_LIST.find((v) => v.id === selectedVehicle);
  const canGoToDetails = !!selectedVehicle;
  const canGoToContact = !!period && !!mileage && deposit !== null;
  const canSubmit = name.trim().length >= 2 && phone.replace(/[^0-9]/g, '').length >= 10;

  async function handleSubmit() {
    if (!canSubmit || isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/consultation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          phone: phone.replace(/[^0-9]/g, ''),
          contactMethod,
          deposit: deposit === -1 ? null : deposit,
          vehicleAnswers: {
            vehicle: { value: selectedVehicle, label: selectedModel?.model || '' },
            brand: { value: selectedBrand, label: selectedBrand },
            period: { value: period, label: period },
            mileage: { value: mileage, label: mileage },
            deposit: { value: String(deposit), label: DEPOSIT_OPTIONS.find((d) => d.value === deposit)?.label || '' },
            source: { value: 'direct', label: '다이렉트 폼' },
          },
        }),
      });
      if (!res.ok) throw new Error('전송 실패');
      setStep('done');
    } catch {
      setError('전송 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7]">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">카담</span>
          <span className="text-xs text-gray-400">장기렌트 간편 상담</span>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">
        {step !== 'done' && (
          <div className="flex gap-1 mb-6">
            {(['vehicle', 'details', 'contact'] as Step[]).map((s, i) => (
              <div key={s} className={`h-1 flex-1 rounded-full transition-colors ${['vehicle', 'details', 'contact'].indexOf(step) >= i ? 'bg-[#007AFF]' : 'bg-gray-200'}`} />
            ))}
          </div>
        )}
        {step === 'vehicle' && (
          <div className="space-y-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">어떤 차량을 찾으시나요?</h1>
              <p className="text-sm text-gray-500 mt-1">브랜드와 차종을 선택해주세요</p>
            </div>
            <div className="flex gap-2">
              {brands.map((b) => (
                <button key={b} onClick={() => { setSelectedBrand(b); setSelectedVehicle(''); }} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedBrand === b ? 'bg-[#007AFF] text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200'}`}>{b}</button>
              ))}
            </div>
            {selectedBrand && (
              <div className="grid grid-cols-2 gap-2">
                {filteredVehicles.map((v) => (
                  <button key={v.id} onClick={() => setSelectedVehicle(v.id)} className={`p-3 rounded-xl text-left transition-all ${selectedVehicle === v.id ? 'bg-[#007AFF] text-white shadow-sm' : 'bg-white text-gray-700 border border-gray-200'}`}>
                    <div className="text-sm font-medium">{v.model}</div>
                    <div className={`text-xs mt-0.5 ${selectedVehicle === v.id ? 'text-blue-100' : 'text-gray-400'}`}>{v.segment} · {v.fuel}</div>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setStep('details')} disabled={!canGoToDetails} className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${canGoToDetails ? 'bg-[#007AFF] text-white shadow-sm active:scale-[0.98]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>다음</button>
          </div>
        )}
        {step === 'details' && (
          <div className="space-y-5">
            <div>
              <button onClick={() => setStep('vehicle')} className="text-sm text-[#007AFF] mb-2">← 차종 다시 선택</button>
              <h1 className="text-xl font-bold text-gray-900">렌트 조건을 선택해주세요</h1>
              <p className="text-sm text-gray-500 mt-1">{selectedModel?.brand} {selectedModel?.model}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">계약 기간</label>
              <div className="grid grid-cols-2 gap-2">
                {PERIOD_OPTIONS.map((p) => (
                  <button key={p} onClick={() => setPeriod(p)} className={`py-2.5 rounded-xl text-sm font-medium transition-all ${period === p ? 'bg-[#007AFF] text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200'}`}>{p}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">연간 주행거리</label>
              <div className="grid grid-cols-2 gap-2">
                {MILEAGE_OPTIONS.map((m) => (
                  <button key={m} onClick={() => setMileage(m)} className={`py-2.5 rounded-xl text-sm font-medium transition-all ${mileage === m ? 'bg-[#007AFF] text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200'}`}>{m}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">선납금 / 보증금</label>
              <div className="grid grid-cols-2 gap-2">
                {DEPOSIT_OPTIONS.map((d) => (
                  <button key={d.value} onClick={() => setDeposit(d.value)} className={`py-2.5 rounded-xl text-sm font-medium transition-all ${deposit === d.value ? 'bg-[#007AFF] text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200'}`}>{d.label}</button>
                ))}
              </div>
            </div>
            <button onClick={() => setStep('contact')} disabled={!canGoToContact} className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${canGoToContact ? 'bg-[#007AFF] text-white shadow-sm active:scale-[0.98]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>다음</button>
          </div>
        )}
        {step === 'contact' && (
          <div className="space-y-5">
            <div>
              <button onClick={() => setStep('details')} className="text-sm text-[#007AFF] mb-2">← 조건 다시 선택</button>
              <h1 className="text-xl font-bold text-gray-900">연락처를 남겨주세요</h1>
              <p className="text-sm text-gray-500 mt-1">빠른 시간 내에 맞춤 견적을 보내드립니다</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <div className="text-xs text-gray-400 mb-2">선택 내역</div>
              <div className="space-y-1 text-sm text-gray-700">
                <div>🚗 {selectedModel?.brand} {selectedModel?.model}</div>
                <div>📅 {period}</div>
                <div>🛣️ {mileage}</div>
                <div>💰 {DEPOSIT_OPTIONS.find((d) => d.value === deposit)?.label}</div>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">이름</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">연락처</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#007AFF] focus:border-transparent" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">선호 연락 방법</label>
              <div className="flex gap-2">
                <button onClick={() => setContactMethod('phone')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${contactMethod === 'phone' ? 'bg-[#007AFF] text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200'}`}>전화</button>
                <button onClick={() => setContactMethod('kakao')} className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${contactMethod === 'kakao' ? 'bg-[#007AFF] text-white shadow-sm' : 'bg-white text-gray-600 border border-gray-200'}`}>카카오톡</button>
              </div>
            </div>
            {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded-xl">{error}</div>}
            <button onClick={handleSubmit} disabled={!canSubmit || isSubmitting} className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${canSubmit && !isSubmitting ? 'bg-[#007AFF] text-white shadow-sm active:scale-[0.98]' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>{isSubmitting ? '전송 중...' : '무료 견적 요청하기'}</button>
            <p className="text-xs text-gray-400 text-center">상담 신청 시 개인정보 수집 및 이용에 동의합니다</p>
          </div>
        )}
        {step === 'done' && (
          <div className="text-center py-12 space-y-4">
            <div className="text-5xl">✅</div>
            <h1 className="text-xl font-bold text-gray-900">상담 신청 완료!</h1>
            <p className="text-sm text-gray-500">빠른 시간 내에 맞춤 견적을 보내드리겠습니다.<br />감사합니다.</p>
            <div className="bg-white rounded-xl p-4 border border-gray-100 text-left max-w-xs mx-auto">
              <div className="space-y-1 text-sm text-gray-700">
                <div>🚗 {selectedModel?.brand} {selectedModel?.model}</div>
                <div>📅 {period}</div>
                <div>🛣️ {mileage}</div>
                <div>💰 {DEPOSIT_OPTIONS.find((d) => d.value === deposit)?.label}</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
