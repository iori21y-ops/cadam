import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { getVehicleBySlug, VEHICLE_LIST } from '@/constants/vehicles';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import VehicleOptionsClient, {
  type TrimRow,
  type OptionRow,
} from '@/components/cars/VehicleOptionsClient';

export const revalidate = 3600;

export async function generateStaticParams() {
  return VEHICLE_LIST.map((v) => ({ slug: v.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);
  if (!vehicle) return { title: '차량을 찾을 수 없습니다' };
  return {
    title: `${vehicle.brand} ${vehicle.model} 옵션 정보 | 카담`,
    description: `${vehicle.brand} ${vehicle.model} 트림별 선택 옵션과 공통 옵션 정보를 확인하세요.`,
  };
}

export default async function VehicleOptionsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);
  if (!vehicle) notFound();

  const vehicleName = `${vehicle.brand} ${vehicle.model}`;
  const supabase = createServiceRoleSupabaseClient();

  // vehicles 테이블에서 DB id 조회
  const { data: vehicleDb } = await supabase
    .from('vehicles')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  // DB 레코드 없으면 빈 데이터로 "준비 중" 표시
  if (!vehicleDb?.id) {
    return (
      <VehicleOptionsClient
        vehicleName={vehicleName}
        slug={slug}
        trims={[]}
        options={[]}
      />
    );
  }

  const [{ data: trimData }, { data: optionData }] = await Promise.all([
    supabase
      .from('vehicle_trims')
      .select(
        'id, trim_name, trim_name_en, base_price, tax_reduced_price, drive_type, fuel_eff_combined, fuel_eff_city, fuel_eff_highway, co2_emission, curb_weight_kg, wheel_size, display_order'
      )
      .eq('vehicle_id', vehicleDb.id)
      .order('display_order', { ascending: true }),
    supabase
      .from('trim_options')
      .select('id, trim_id, option_name, option_price, option_type')
      .eq('vehicle_id', vehicleDb.id),
  ]);

  return (
    <VehicleOptionsClient
      vehicleName={vehicleName}
      slug={slug}
      trims={(trimData ?? []) as TrimRow[]}
      options={(optionData ?? []) as OptionRow[]}
    />
  );
}
