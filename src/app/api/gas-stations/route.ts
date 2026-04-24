import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const latMin = parseFloat(sp.get('lat_min') ?? '');
  const latMax = parseFloat(sp.get('lat_max') ?? '');
  const lngMin = parseFloat(sp.get('lng_min') ?? '');
  const lngMax = parseFloat(sp.get('lng_max') ?? '');
  const sortBy = sp.get('sort') ?? '';          // 'gasoline_asc' | 'diesel_asc'

  if ([latMin, latMax, lngMin, lngMax].some(isNaN)) {
    return NextResponse.json({ error: 'lat_min, lat_max, lng_min, lng_max 필수' }, { status: 400 });
  }

  try {
    const supabase = createServiceRoleSupabaseClient();
    let query = supabase
      .from('gas_stations')
      .select(
        'id, kakao_id, name, brand, road_address, lat, lng, phone, place_url,' +
        ' gasoline_price, diesel_price, premium_gasoline_price, lpg_price, price_updated_at'
      )
      .gte('lat', latMin).lte('lat', latMax)
      .gte('lng', lngMin).lte('lng', lngMax)
      .not('lat', 'is', null)
      .not('lng', 'is', null);

    if (sortBy === 'gasoline_asc') {
      query = query.not('gasoline_price', 'is', null).order('gasoline_price', { ascending: true });
    } else if (sortBy === 'diesel_asc') {
      query = query.not('diesel_price', 'is', null).order('diesel_price', { ascending: true });
    }

    query = query.limit(500);

    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ data: data ?? [], count: data?.length ?? 0 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
