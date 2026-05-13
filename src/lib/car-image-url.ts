const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const BUCKET = 'car-images';

export function carImageUrl(imageKeyOrFile: string): string {
  const filename = imageKeyOrFile.endsWith('.webp')
    ? imageKeyOrFile
    : `${imageKeyOrFile}.webp`;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`;
}
