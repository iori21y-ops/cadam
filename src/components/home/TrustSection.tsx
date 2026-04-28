import Link from 'next/link';
import { UserCheck, BarChart3, Shield } from 'lucide-react';

const FEATURES = [
  {
    icon: UserCheck,
    title: '무료 맞춤 상담',
    desc: '용도와 예산에 맞는 최적의 조건을 찾아드립니다',
  },
  {
    icon: BarChart3,
    title: '금융사 비교',
    desc: '여러 금융사의 조건을 한눈에 비교해드립니다',
  },
  {
    icon: Shield,
    title: '투명한 견적',
    desc: '숨은 비용 없이 정확한 견적을 제공합니다',
  },
] as const;

export function TrustSection() {
  return (
    <section className="bg-gray-50 py-16 px-5">
      <div className="max-w-lg mx-auto">
        <h2 className="text-primary font-bold text-2xl text-center mb-10">
          렌트 전문가가 직접 상담합니다
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex flex-col items-center text-center">
              <Icon className="w-12 h-12 text-accent mb-4" strokeWidth={1.5} />
              <p className="text-primary font-bold mb-1">{title}</p>
              <p className="text-text-sub text-sm">{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link
            href="/quote"
            className="inline-block bg-primary text-white font-bold rounded-xl px-8 py-4 text-lg transition-all hover:opacity-90 active:scale-[0.97]"
          >
            맞춤 상담 신청 &rarr;
          </Link>
        </div>
      </div>
    </section>
  );
}
