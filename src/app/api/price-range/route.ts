import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const BRANDS = ['현대', '기아', '제네시스'] as const;
const MONTHS = [36, 48, 60] as const;
const KM_VALUES = [10000, 20000, 30000, 40000] as const;

type Brand = (typeof BRANDS)[number];
type Months = (typeof MONTHS)[number];
type Km = (typeof KM_VALUES)[number];

function parseQueryParams(
  searchParams: URLSearchParams
): { brand: Brand; model: string; months: Months; km: Km } | { error: string } {
  const brand = searchParams.get('brand');
  const model = searchParams.get('model');
  const monthsStr = searchParams.get('months');
  const kmStr = searchParams.get('km');

  if (!brand || !BRANDS.includes(brand as Brand)) {
    return { error: 'brand is required and must be 현대, 기아, or 제네시스' };
  }
  if (!model || model.trim().length === 0) {
    return { error: 'model is required' };
  }
  const monthsNum = monthsStr ? parseInt(monthsStr, 10) : NaN;
  if (!Number.isInteger(monthsNum) || !MONTHS.includes(monthsNum as Months)) {
    return { error: 'months is required and must be 36, 48, or 60' };
  }
  const kmNum = kmStr ? parseInt(kmStr, 10) : NaN;
  if (!Number.isInteger(kmNum) || !KM_VALUES.includes(kmNum as Km)) {
    return { error: 'km is required and must be 10000, 20000, 30000, or 40000' };
  }

  return {
    brand: brand as Brand,
    model: model.trim(),
    months: monthsNum as Months,
    km: kmNum as Km,
  };
}

export async function GET(request: NextRequest) {
  try {
    const params = parseQueryParams(request.nextUrl.searchParams);
    if ('error' in params) {
      return NextResponse.json({ error: params.error }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    const { data, error } = await supabase
      .from('price_ranges')
      .select('min_monthly, max_monthly, conditions')
      .eq('car_brand', params.brand)
      .eq('car_model', params.model)
      .eq('contract_months', params.months)
      .eq('annual_km', params.km)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('price_ranges query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch price range' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({
        minMonthly: null,
        maxMonthly: null,
        message: '상담 문의',
      });
    }

    return NextResponse.json({
      minMonthly: data.min_monthly,
      maxMonthly: data.max_monthly,
      conditions: data.conditions ?? null,
    });
  } catch (err) {
    console.error('Price range API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
