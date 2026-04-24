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
      .from('gas_stations')
      .select('id, kakao_id, name, brand, road_address, lat, lng, phone, place_url')
      .gte('lat', latMin).lte('lat', latMax)
      .gte('lng', lngMin).lte('lng', lngMax)
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .limit(500);

    if (error) throw error;
    return NextResponse.json({ data: data ?? [], count: data?.length ?? 0 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
