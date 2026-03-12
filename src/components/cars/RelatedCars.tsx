import Link from 'next/link';
import { VEHICLE_LIST } from '@/constants/vehicles';
import type { Vehicle } from '@/constants/vehicles';

interface RelatedCarsProps {
  currentVehicle: Vehicle;
}

export function RelatedCars({ currentVehicle }: RelatedCarsProps) {
  const related = VEHICLE_LIST.filter(
    (v) =>
      v.category === currentVehicle.category && v.id !== currentVehicle.id
  ).slice(0, 4);

  if (related.length === 0) return null;

  return (
    <section className="px-5 py-8">
      <h2 className="text-lg font-bold text-primary mb-4">
        비슷한 차종도 확인해 보세요
      </h2>
      <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-5 px-5">
        {related.map((v) => (
          <Link
            key={v.id}
            href={`/cars/${v.slug}`}
            className="flex-shrink-0 min-w-[120px] p-3 rounded-xl border border-gray-200 bg-white text-center hover:border-accent hover:bg-[#EBF5FB] transition-colors"
          >
            <span className="text-sm font-bold text-gray-900">{v.model}</span>
            <span className="block text-xs text-accent mt-1">견적 보기 →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
