import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '무료 진단 | 렌테일러',
  description: '절세 혜택과 실제 차량 유지비를 1분 안에 확인하세요. 사업자 절세 진단과 내 차 유지비 진단을 무료로 제공합니다.',
  openGraph: {
    title: '무료 진단 | 렌테일러',
    description: '절세 혜택과 실제 차량 유지비를 1분 안에 확인하세요.',
  },
};

const CARDS = [
  {
    href:  '/simulator/compare',
    icon:  '⚖️',
    title: '결제방식 비교',
    sub:   '할부 vs 리스 vs 렌트 — 총비용 한눈에 비교',
    badge: '✨ NEW',
    accent: '#3b82f6',
  },
  {
    href:  '/simulator/tax',
    icon:  '💼',
    title: '사업자 절세 진단',
    sub:   '장기렌트로 연간 얼마나 절세할 수 있을까?',
    badge: '사업자용',
    accent: '#22c55e',
  },
  {
    href:  '/simulator/cost',
    icon:  '🚗',
    title: '내 차 유지비 진단',
    sub:   '숨은 비용 포함, 진짜 내 차 유지비는?',
    badge: '개인용',
    accent: '#ef4444',
  },
];

export default function SimulatorPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: 'linear-gradient(160deg, #0c0c1d 0%, #1a1a2e 60%, #0c0c1d 100%)' }}
    >
      <div className="max-w-[520px] mx-auto px-4 py-12">
        {/* 헤더 */}
        <div className="mb-10 text-center">
          <p className="text-slate-500 text-xs font-medium tracking-widest uppercase mb-3">
            RENTAILOR
          </p>
          <h1 className="text-white text-3xl font-bold mb-3">무료 진단</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            1분 안에 절세 혜택 또는 실제 유지비를<br />바로 확인하세요.
          </p>
        </div>

        {/* 카드 목록 */}
        <div className="flex flex-col gap-4">
          {CARDS.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="group block bg-[#12122a] border border-[#2a2a3e] rounded-2xl p-6 hover:border-[#3a3a5e] transition-all duration-200 hover:translate-y-[-2px]"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl shrink-0">{c.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ color: c.accent, backgroundColor: `${c.accent}18` }}
                    >
                      {c.badge}
                    </span>
                  </div>
                  <p className="text-white font-semibold text-lg leading-snug mb-1">
                    {c.title}
                  </p>
                  <p className="text-slate-400 text-sm leading-relaxed">{c.sub}</p>
                </div>
                <span className="text-slate-600 group-hover:text-slate-400 transition-colors text-lg mt-1">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <p className="text-slate-600 text-xs text-center mt-10">
          진단 결과는 참고용이며 개인정보를 수집하지 않습니다.
        </p>
      </div>
    </div>
  );
}
