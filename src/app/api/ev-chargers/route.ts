import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';

const FAST_TYPES = ['01', '03', '04', '05', '06', '07', '08'];
const SLOW_TYPES = ['02', '09'];

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const latMin = parseFloat(sp.get('lat_min') ?? '');
  const latMax = parseFloat(sp.get('lat_max') ?? '');
  const lngMin = parseFloat(sp.get('lng_min') ?? '');
  const lngMax = parseFloat(sp.get('lng_max') ?? '');
  const typeFilter = sp.get('type') ?? 'all';

  if ([latMin, latMax, lngMin, lngMax].some(isNaN)) {
    return NextResponse.json({ error: 'lat_min, lat_max, lng_min, lng_max 필수' }, { status: 400 });
  }

  try {
    const supabase = createServiceRoleSupabaseClient();
    let query = supabase
      .from('ev_chargers')
      .select('id, station_id, station_name, address, lat, lng, charger_type, output_kw, operator, status_code')
      .gte('lat', latMin)
      .lte('lat', latMax)
      .gte('lng', lngMin)
      .lte('lng', lngMax)
      .not('lat', 'is', null)
      .not('lng', 'is', null)
      .limit(400);

    if (typeFilter === 'fast') query = query.in('charger_type', FAST_TYPES);
    else if (typeFilter === 'slow') query = query.in('charger_type', SLOW_TYPES);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ data: data ?? [], count: data?.length ?? 0 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
