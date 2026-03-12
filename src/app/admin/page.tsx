'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CallbackList, type CallbackItem } from '@/components/admin/CallbackList';

interface DashboardStats {
  todayCount: number;
  pendingCount: number;
  hotLeadCount: number;
  weekCount: number;
  conversionRate: string;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [callbacks, setCallbacks] = useState<CallbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);
      try {
        const [statsRes, callbacksRes] = await Promise.all([
          fetch('/api/admin/dashboard'),
          fetch('/api/admin/callbacks'),
        ]);

        if (!statsRes.ok) {
          throw new Error('대시보드 통계를 불러오지 못했습니다.');
        }
        if (!callbacksRes.ok) {
          throw new Error('콜백 목록을 불러오지 못했습니다.');
        }

        const [statsJson, callbacksJson] = await Promise.all([
          statsRes.json(),
          callbacksRes.json(),
        ]);

        setStats(statsJson);
        setCallbacks(callbacksJson.callbacks ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : '데이터 로드 실패');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto p-5 flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto p-5">
        <p className="text-danger font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto p-5">
      <h1 className="text-xl font-bold text-primary mb-6">대시보드</h1>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">오늘 신청</div>
          <div className="text-2xl font-bold text-accent">
            {stats?.todayCount ?? 0}건
          </div>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">미처리</div>
          <div className="text-2xl font-bold text-danger">
            {stats?.pendingCount ?? 0}건
          </div>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 border-l-4 border-l-danger p-4 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">🔥 HOT 리드</div>
          <div className="text-2xl font-bold text-danger">
            {stats?.hotLeadCount ?? 0}건
          </div>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
          <div className="text-sm text-gray-500 mb-1">이번 주 신청</div>
          <div className="text-2xl font-bold text-success">
            {stats?.weekCount ?? 0}건
          </div>
        </div>
        <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm md:col-span-2 lg:col-span-1">
          <div className="text-sm text-gray-500 mb-1">전환율</div>
          <div className="text-2xl font-bold text-warning">
            {stats?.conversionRate ?? '0'}%
          </div>
        </div>
      </div>

      {/* 오늘의 콜백 리스트 */}
      <section className="mb-8">
        <h2 className="text-base font-bold text-gray-900 mb-3">
          📞 오늘의 콜백
        </h2>
        <CallbackList items={callbacks} />
      </section>

      {/* 하단 빠른 메뉴 */}
      <section>
        <h2 className="text-base font-bold text-gray-900 mb-3">빠른 메뉴</h2>
        <div className="flex flex-col gap-2">
          <Link
            href="/admin/consultations"
            className="block w-full py-3 px-4 rounded-xl bg-white border border-gray-200 text-left font-medium text-gray-900 hover:border-accent hover:bg-[#EBF5FB] transition-colors"
          >
            📋 상담 관리
          </Link>
          <Link
            href="/admin/info"
            className="block w-full py-3 px-4 rounded-xl bg-white border border-gray-200 text-left font-medium text-gray-900 hover:border-accent hover:bg-[#EBF5FB] transition-colors"
          >
            📰 정보관리
          </Link>
          <Link
            href="/admin/promotions"
            className="block w-full py-3 px-4 rounded-xl bg-white border border-gray-200 text-left font-medium text-gray-900 hover:border-accent hover:bg-[#EBF5FB] transition-colors"
          >
            🎫 프로모션 관리
          </Link>
          <Link
            href="/admin/prices"
            className="block w-full py-3 px-4 rounded-xl bg-white border border-gray-200 text-left font-medium text-gray-900 hover:border-accent hover:bg-[#EBF5FB] transition-colors"
          >
            💰 가격표 관리
          </Link>
        </div>
      </section>
    </div>
  );
}
