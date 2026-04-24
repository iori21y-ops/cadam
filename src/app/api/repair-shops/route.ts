import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const latMin = parseFloat(sp.get('lat_min') ?? '');
  const latMax = parseFloat(sp.get('lat_max') ?? '');
  const lngMin = parseFloat(sp.get('lng_min') ?? '');
  const lngMax = parseFloat(sp.get('lng_max') ?? '');

  if ([latMin, latMax, lngMin, lngMax].some(isNaN)) {
    return NextResponse.json({ error: 'lat_min, lat_max, lng_min, lng_max 필수' }, { status: 400 });
  }

  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from('repair_shops')
      .select('id, shop_name, shop_type, road_address, latitude, longitude, phone, business_status')
      .gte('latitude', latMin).lte('latitude', latMax)
      .gte('longitude', lngMin).lte('longitude', lngMax)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .limit(400);

    if (error) throw error;
    return NextResponse.json({ data: data ?? [], count: data?.length ?? 0 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
