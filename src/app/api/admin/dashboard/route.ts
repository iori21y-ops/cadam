import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

function getTodayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getThisWeekMonday(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const todayStart = getTodayStart();
    const weekStart = getThisWeekMonday();

    const [
      { count: todayCount },
      { count: pendingCount },
      { count: hotLeadCount },
      { count: weekCount },
      { count: totalCount },
      { count: contractedCount },
    ] = await Promise.all([
      supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', todayStart),
      supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
      supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .gte('lead_score', 80)
        .eq('status', 'pending'),
      supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekStart),
      supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true }),
      supabase
        .from('consultations')
        .select('*', { count: 'exact', head: true })
        .eq('consult_result', 'contracted'),
    ]);

    const conversionRate =
      (totalCount ?? 0) > 0
        ? (((contractedCount ?? 0) / (totalCount ?? 1)) * 100).toFixed(1)
        : '0';

    return NextResponse.json({
      todayCount: todayCount ?? 0,
      pendingCount: pendingCount ?? 0,
      hotLeadCount: hotLeadCount ?? 0,
      weekCount: weekCount ?? 0,
      conversionRate,
    });
  } catch (err) {
    console.error('Admin dashboard API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
