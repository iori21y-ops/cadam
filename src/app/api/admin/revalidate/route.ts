import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getAllSlugs } from '@/constants/vehicles';
import { createServerSupabaseClient } from '@/lib/supabase-server';

const revalidateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .refine((s) => getAllSlugs().includes(s), {
      message: 'Invalid slug',
    }),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parseResult = revalidateSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { slug } = parseResult.data;
    revalidatePath(`/cars/${slug}`);
    return NextResponse.json({ revalidated: true });
  } catch (err) {
    console.error('Admin revalidate API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
