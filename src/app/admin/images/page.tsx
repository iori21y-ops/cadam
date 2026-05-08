import { readdirSync } from 'fs';
import { join } from 'path';
import { ImageGrid } from './ImageGrid';

export const metadata = { title: '차량 이미지 관리 | Admin' };

export default function AdminImagesPage() {
  const carsDir = join(process.cwd(), 'public', 'cars');
  const files = readdirSync(carsDir)
    .filter((f) => f.endsWith('-v2.webp'))
    .sort();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">차량 이미지 관리</h1>
        <p className="text-sm text-gray-500 mt-1">
          총 {files.length}개 · public/cars/*-v2.webp · 실제 카드 비율(4:3)로 표시
        </p>
      </div>
      <ImageGrid files={files} />
    </div>
  );
}
