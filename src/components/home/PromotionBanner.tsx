const PROMOTIONS = [
  {
    id: 1,
    title: '신규 상담 고객 특별 혜택',
    subtitle: '첫 상담 시 렌트료 비교표 무료 제공',
    gradient: 'from-gray-900 to-gray-800',
  },
  {
    id: 2,
    title: '장기렌트 선납금 지원 이벤트',
    subtitle: '선납 200만원 지원 · 한정 수량',
    gradient: 'from-primary to-gray-900',
  },
  {
    id: 3,
    title: '친환경차 특별 할인',
    subtitle: '하이브리드·전기차 월 렌트료 최대 15% 할인',
    gradient: 'from-accent/80 to-gray-900',
  },
];

export function PromotionBanner() {
  return (
    <section className="bg-gray-50 py-12">
      <div className="max-w-lg mx-auto">
        <h2 className="text-primary font-bold text-xl mb-6 px-5">
          렌테일러가 준비한 혜택
        </h2>

        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-5">
          {PROMOTIONS.map((promo, i) => (
            <div
              key={promo.id}
              className={`w-[85vw] max-w-[400px] shrink-0 snap-center rounded-2xl overflow-hidden bg-gradient-to-br ${promo.gradient} aspect-[16/9] relative p-6 flex flex-col justify-between`}
            >
              <div>
                <p className="text-white font-bold text-lg">{promo.title}</p>
                <p className="text-gray-300 text-sm mt-2">{promo.subtitle}</p>
              </div>
              <p className="text-white/60 text-xs self-end">
                {i + 1}/{PROMOTIONS.length}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
