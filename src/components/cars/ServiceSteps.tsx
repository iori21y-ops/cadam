import { ClipboardList, MessageSquare, CarFront } from 'lucide-react';

const STEPS = [
  {
    icon: ClipboardList,
    step: 'Step 1',
    title: '견적 비교',
    desc: '여러 금융사 조건을\n한눈에 비교',
  },
  {
    icon: MessageSquare,
    step: 'Step 2',
    title: '전문가 상담',
    desc: '맞춤 조건으로\n최적가 안내',
  },
  {
    icon: CarFront,
    step: 'Step 3',
    title: '계약 · 출고',
    desc: '간편 계약 후\n빠른 출고',
  },
];

export function ServiceSteps() {
  return (
    <section className="px-5 py-8">
      <h2 className="text-lg font-bold text-text mb-5">렌테일러와 함께하면</h2>
      <div className="grid grid-cols-3 gap-3">
        {STEPS.map(({ icon: Icon, step, title, desc }) => (
          <div
            key={step}
            className="flex flex-col items-center text-center p-4 rounded-2xl bg-white border border-border-solid"
          >
            <div className="w-11 h-11 rounded-full bg-accent/15 flex items-center justify-center mb-2.5">
              <Icon size={22} className="text-accent" strokeWidth={1.8} />
            </div>
            <span className="text-[11px] font-bold text-accent">{step}</span>
            <span className="text-sm font-bold text-text mt-1">{title}</span>
            <span className="text-[11px] text-text-sub mt-1 whitespace-pre-line leading-relaxed">
              {desc}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
