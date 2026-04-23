import type { Metadata } from 'next';
import { EvChargerMapLazy } from '@/components/info/EvChargerMapLazy';

export const metadata: Metadata = {
  title: '전기차 충전소 지도 | 렌테일러',
  description: '전국 전기차 충전소 위치와 충전 가능 현황을 지도에서 확인하세요. 급속·완속 필터, 위치 기반 검색 지원.',
};

export default function EvChargersPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-main mb-1">전기차 충전소 지도</h1>
        <p className="text-text-sub text-sm">
          전국 99,419개 충전기 현황 · 현재 위치 기반 검색 지원
        </p>
      </div>
      <EvChargerMapLazy />
    </div>
  );
}
