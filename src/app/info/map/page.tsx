import type { Metadata } from 'next';
import { KakaoMapLazy } from '@/components/map/KakaoMapLazy';

export const metadata: Metadata = {
  title: '내 주변 찾기 | 렌테일러',
  description: '전기차 충전소, 주유소, 자동차 정비소를 한 지도에서 확인하세요. 현재 위치 기반 검색 지원.',
};

export default function NearMeMapPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-main mb-1">내 주변 찾기</h1>
        <p className="text-text-sub text-sm">충전소 · 주유소 · 정비소를 한 지도에서 검색하세요</p>
      </div>
      <KakaoMapLazy />
    </div>
  );
}
