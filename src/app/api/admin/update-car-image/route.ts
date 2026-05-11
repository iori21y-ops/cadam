import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { join } from 'path';
import { existsSync } from 'fs';

const execFileAsync = promisify(execFile);

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '요청 형식 오류' }, { status: 400 });
  }

  const { imageKey, widthRatio, vPosition, frameIndex, slug } = body as Record<string, unknown>;

  // imageKey 검증 — 경로 순회 방지
  if (typeof imageKey !== 'string' || !/^[a-z0-9-]+$/.test(imageKey)) {
    return NextResponse.json({ error: 'imageKey 형식 오류' }, { status: 400 });
  }
  if (typeof widthRatio !== 'number' || widthRatio < 50 || widthRatio > 90) {
    return NextResponse.json({ error: 'widthRatio는 50~90 사이여야 합니다' }, { status: 400 });
  }
  if (typeof vPosition !== 'number' || vPosition < 40 || vPosition > 70) {
    return NextResponse.json({ error: 'vPosition은 40~70 사이여야 합니다' }, { status: 400 });
  }

  const cwd = process.cwd();
  const outputPath = join(cwd, 'public', 'cars', `${imageKey}.webp`);

  // Python 스크립트 경로
  const scriptPath = join(cwd, 'scripts', 'reprocess_car_image.py');
  if (!existsSync(scriptPath)) {
    return NextResponse.json({ error: `스크립트 없음: scripts/reprocess_car_image.py` }, { status: 500 });
  }

  // 소스: 360 스핀 프레임 vs 백업 파일
  let sourceArg: string;
  if (typeof frameIndex === 'number' && typeof slug === 'string' && /^[a-z0-9-]+$/.test(slug)) {
    const paddedFrame = String(frameIndex + 1).padStart(3, '0');
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_SUPABASE_URL 미설정' }, { status: 500 });
    }
    sourceArg = `${supabaseUrl}/storage/v1/object/public/car-360/${slug}/${paddedFrame}.webp`;
  } else {
    const backupPath = join(cwd, 'backups', 'cars_before_resize', `${imageKey}.webp`);
    if (!existsSync(backupPath)) {
      return NextResponse.json({ error: `백업 파일 없음: ${imageKey}.webp` }, { status: 404 });
    }
    sourceArg = backupPath;
  }

  try {
    const { stdout, stderr } = await execFileAsync('python3', [
      scriptPath,
      '--source', sourceArg,
      '--output', outputPath,
      '--width-ratio', String(widthRatio),
      '--v-position', String(vPosition),
    ], { timeout: 60000 });

    if (stderr && stderr.trim()) {
      console.warn('[update-car-image] stderr:', stderr.trim());
    }
    console.log('[update-car-image] stdout:', stdout.trim());

    revalidatePath('/');
    if (typeof slug === 'string' && /^[a-z0-9-]+$/.test(slug)) {
      revalidatePath(`/cars/${slug}`);
    }

    return NextResponse.json({ ok: true, imageKey, message: stdout.trim() || '완료' });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Python 오류: ${msg}` }, { status: 500 });
  }
}
