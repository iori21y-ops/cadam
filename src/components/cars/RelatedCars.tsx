import Link from 'next/link';
import { VEHICLE_LIST } from '@/constants/vehicles';
import type { Vehicle } from '@/constants/vehicles';
import { CarImageFallback } from './CarImageFallback';

interface RelatedCarsProps {
  currentVehicle: Vehicle;
}

export function RelatedCars({ currentVehicle }: RelatedCarsProps) {
  const related = VEHICLE_LIST.filter(
    (v) => v.category === currentVehicle.category && v.id !== currentVehicle.id
  ).slice(0, 4);

  if (related.length === 0) return null;

  return (
    <section className="px-5 py-8">
      <h2 className="text-lg font-bold text-text mb-4">비슷한 차종</h2>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
        {related.map((v) => (
          <Link
            key={v.id}
            href={`/cars/${v.slug}`}
            className="shrink-0 w-[140px] rounded-2xl border border-border-solid bg-white overflow-hidden hover:border-accent hover:shadow-md transition-all group"
          >
            <div className="relative w-full aspect-[4/3] bg-white">
              <CarImageFallback
                src={`/cars/${v.imageKey}.webp`}
                alt={v.model}
                sizes="140px"
                className="object-contain p-2 group-hover:scale-105 transition-transform"
              />
            </div>
            <div className="p-3 text-center">
              <span className="text-sm font-bold text-text block">{v.model}</span>
              <span className="text-[11px] text-accent font-semibold mt-1 block">견적 보기 →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
