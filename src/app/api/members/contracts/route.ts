import { NextResponse } from 'next/server';
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
import { getMemberId } from '@/lib/member-session';

export async function GET() {
  const memberId = await getMemberId();
  if (!memberId) {
    return NextResponse.json({ contracts: null }, { status: 401 });
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from('customer_contracts')
    .select(
      'id, car_slug, car_name, contract_type, status, capital_id, monthly_payment, term_months, deposit, prepayment, residual_value, annual_km_limit, contract_start_date, contract_end_date, created_at'
    )
    .eq('member_id', memberId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contracts: data });
}
