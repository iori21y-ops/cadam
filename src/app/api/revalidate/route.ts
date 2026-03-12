import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getAllSlugs } from '@/constants/vehicles';

const revalidateSchema = z.object({
  slug: z
    .string()
    .min(1)
    .refine((s) => getAllSlugs().includes(s), {
      message: 'Invalid slug',
    }),
  secret: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parseResult = revalidateSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { slug, secret } = parseResult.data;

    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    revalidatePath(`/cars/${slug}`);
    return NextResponse.json({ revalidated: true });
  } catch (err) {
    console.error('Revalidate API error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
