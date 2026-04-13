'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const FAQ_ITEMS = [
  {
    q: '월 납입금에 어떤 비용이 포함되나요?',
    a: '장기렌트의 경우 자동차세, 보험료가 모두 포함됩니다. 리스는 자동차세와 보험이 별도입니다. 정확한 조건은 상담을 통해 확인할 수 있습니다.',
  },
  {
    q: '신용등급에 영향이 있나요?',
    a: '장기렌트는 신용등급에 영향을 주지 않습니다. 리스의 경우 부채로 잡힐 수 있으나, 운용리스는 영향이 적습니다.',
  },
  {
    q: '계약 중간에 해지할 수 있나요?',
    a: '중도 해지는 가능하지만, 위약금이 발생할 수 있습니다. 계약 조건에 따라 다르므로 상담 시 확인해 주세요.',
  },
  {
    q: '계약이 끝나면 차를 인수할 수 있나요?',
    a: '네, 계약 종료 후 잔존가치를 지불하고 인수하거나, 반납 또는 재계약 중 선택할 수 있습니다.',
  },
];

export function CarFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="px-5 py-8">
      <h2 className="text-lg font-bold text-text mb-4">자주 묻는 질문</h2>
      <div className="rounded-2xl border border-border-solid bg-white overflow-hidden divide-y divide-border-solid">
        {FAQ_ITEMS.map((item, idx) => (
          <div key={idx}>
            <button
              type="button"
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full flex items-center justify-between px-4 py-4 text-left"
            >
              <span className="flex items-start gap-2">
                <span className="text-accent font-bold text-sm shrink-0">Q</span>
                <span className="text-sm font-medium text-text">{item.q}</span>
              </span>
              <ChevronDown
                size={16}
                className={`text-text-sub shrink-0 ml-2 transition-transform ${openIndex === idx ? 'rotate-180' : ''}`}
              />
            </button>
            {openIndex === idx && (
              <div className="px-4 pb-4 pl-9">
                <p className="text-sm text-text-sub leading-relaxed">{item.a}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
