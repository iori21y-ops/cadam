import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

function getTodayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getTomorrowStart(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const todayStart = getTodayStart();
    const tomorrowStart = getTomorrowStart();

    const { data, error } = await supabase
      .from('consultations')
      .select('id, name, phone, car_brand, car_model, trim, callback_time, memo')
      .gte('callback_time', todayStart)
      .lt('callback_time', tomorrowStart)
      .order('callback_time', { ascending: true });

    if (error) {
      console.error('Callbacks query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch callbacks' },
        { status: 500 }
      );
    }

    const callbacks = (data ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      phone: row.phone,
      carDisplay: [row.car_brand, row.car_model, row.trim]
        .filter(Boolean)
        .join(' ') || '—',
      callbackTime: row.callback_time,
      memo: row.memo ?? null,
    }));

    return NextResponse.json({ callbacks });
  } catch (err) {
    console.error('Admin callbacks API error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch callbacks' },
      { status: 500 }
    );
  }
}
