import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="px-5 pt-24 pb-16 text-center max-w-2xl mx-auto">
      <p className="hero-fade-1 text-accent font-display tracking-widest uppercase text-sm mb-4">
        Tailored to your drive
      </p>

      <h1 className="hero-fade-2 text-primary text-3xl md:text-5xl font-bold leading-tight mb-4 whitespace-pre-line">
        {'당신에게 맞춘 렌트,\n렌테일러가 재단합니다'}
      </h1>

      <p className="hero-fade-3 text-text-sub text-base mb-8">
        전문가의 맞춤 상담부터 AI 견적 비교까지
      </p>

      <div className="hero-fade-4">
        <Link
          href="/diagnosis"
          className="inline-block cta-gold text-primary font-bold rounded-xl px-8 py-4 text-lg"
        >
          AI 맞춤 진단 시작 &rarr;
        </Link>
      </div>
    </section>
  );
}
