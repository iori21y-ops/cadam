'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { LeadBadge } from './LeadBadge';

export interface ConsultationRow {
  id: string;
  name: string;
  phone: string;
  car_brand: string | null;
  car_model: string | null;
  trim: string | null;
  contract_months: number | null;
  annual_km: number | null;
  estimated_min: number | null;
  estimated_max: number | null;
  status: string;
  assigned_to: string | null;
  lead_score: number;
  memo: string | null;
  callback_time: string | null;
  consult_result: string | null;
  utm_source: string | null;
  referrer: string | null;
  inflow_page: string | null;
  device_type: string | null;
  deposit: number | null;
  prepayment_pct: number | null;
  monthly_budget: number | null;
  created_at: string;
}

type StatusFilter = 'all' | 'pending' | 'consulting' | 'completed';
type LeadFilter = 'all' | 'hot' | 'warm' | 'cool' | 'cold';
type SortOption = 'lead_score' | 'created_at' | 'callback_time';

const STATUS_OPTIONS = [
  { value: 'pending', label: '미처리' },
  { value: 'consulting', label: '상담중' },
  { value: 'completed', label: '완료' },
] as const;

const RESULT_OPTIONS = [
  { value: '', label: '—' },
  { value: 'contracted', label: '계약완료' },
  { value: 'competitor', label: '타사계약' },
  { value: 'hold', label: '보류' },
  { value: 'no_answer', label: '부재' },
  { value: 'cancelled', label: '취소' },
] as const;

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function formatCallbackTime(iso: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '—';
  }
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pending':
      return 'text-danger bg-[#FDEDEC]';
    case 'consulting':
      return 'text-warning bg-[#FEF9E7]';
    case 'completed':
      return 'text-success bg-[#E8F8F0]';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}

interface ConsultationTableProps {
  selectedId: string | null;
  onSelectRow: (id: string | null) => void;
  refreshTrigger?: number;
}

export function ConsultationTable({ selectedId, onSelectRow, refreshTrigger = 0 }: ConsultationTableProps) {
  const [rows, setRows] = useState<ConsultationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [leadFilter, setLeadFilter] = useState<LeadFilter>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [carFilter, setCarFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [assignedFilter, setAssignedFilter] = useState('');
  const [quickFilter, setQuickFilter] = useState<'none' | 'hot' | 'callback'>('none');
  const [sortBy, setSortBy] = useState<SortOption>('lead_score');

  const fetchConsultations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = createBrowserSupabaseClient();
      const { data, error: err } = await supabase
        .from('consultations')
        .select(
          'id, name, phone, car_brand, car_model, trim, contract_months, annual_km, estimated_min, estimated_max, status, assigned_to, lead_score, memo, callback_time, consult_result, utm_source, referrer, inflow_page, device_type, deposit, prepayment_pct, monthly_budget, created_at'
        )
        .order('created_at', { ascending: false });

      if (err) throw err;
      setRows((data as ConsultationRow[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터 로드 실패');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations, refreshTrigger]);

  const filteredRows = rows
    .filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (leadFilter !== 'all') {
        if (leadFilter === 'hot' && r.lead_score < 80) return false;
        if (leadFilter === 'warm' && (r.lead_score < 50 || r.lead_score >= 80)) return false;
        if (leadFilter === 'cool' && (r.lead_score < 20 || r.lead_score >= 50)) return false;
        if (leadFilter === 'cold' && r.lead_score >= 20) return false;
      }
      if (dateFrom && r.created_at < `${dateFrom}T00:00:00.000Z`) return false;
      if (dateTo && r.created_at > `${dateTo}T23:59:59.999Z`) return false;
      const carDisplay = [r.car_brand, r.car_model].filter(Boolean).join(' ');
      if (carFilter && carDisplay !== carFilter) return false;
      if (resultFilter && (r.consult_result ?? '') !== resultFilter) return false;
      if (assignedFilter && (r.assigned_to ?? '') !== assignedFilter) return false;
      if (quickFilter === 'hot' && (r.lead_score < 80 || r.status !== 'pending')) return false;
      if (quickFilter === 'callback' && !r.callback_time) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'lead_score') return (b.lead_score ?? 0) - (a.lead_score ?? 0);
      if (sortBy === 'created_at')
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'callback_time') {
        const ta = a.callback_time ? new Date(a.callback_time).getTime() : 0;
        const tb = b.callback_time ? new Date(b.callback_time).getTime() : 0;
        return ta - tb;
      }
      return 0;
    });

  const distinctCars = Array.from(
    new Set(
      rows
        .map((r) => [r.car_brand, r.car_model].filter(Boolean).join(' '))
        .filter(Boolean)
    )
  ).sort();
  const distinctAssigned = Array.from(
    new Set(rows.map((r) => r.assigned_to).filter((v): v is string => Boolean(v)))
  ).sort();

  async function updateField(
    id: string,
    field: 'status' | 'consult_result' | 'assigned_to',
    value: string | null
  ) {
    const supabase = createBrowserSupabaseClient();
    const payload =
      field === 'assigned_to'
        ? { assigned_to: value, updated_at: new Date().toISOString() }
        : { [field]: value, updated_at: new Date().toISOString() };
    await supabase.from('consultations').update(payload).eq('id', id);
    fetchConsultations();
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-200 p-4">
        <p className="text-danger font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">상태</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-accent"
          >
            <option value="all">전체</option>
            <option value="pending">미처리</option>
            <option value="consulting">상담중</option>
            <option value="completed">완료</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">리드 등급</label>
          <select
            value={leadFilter}
            onChange={(e) => setLeadFilter(e.target.value as LeadFilter)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-accent"
          >
            <option value="all">전체</option>
            <option value="hot">HOT</option>
            <option value="warm">WARM</option>
            <option value="cool">COOL</option>
            <option value="cold">COLD</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">시작일</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">종료일</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">차종</label>
          <select
            value={carFilter}
            onChange={(e) => setCarFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-accent min-w-[120px]"
          >
            <option value="">전체</option>
            {distinctCars.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">상담 결과</label>
          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-accent"
          >
            <option value="">전체</option>
            {RESULT_OPTIONS.filter((o) => o.value).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">상담사</label>
          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-accent min-w-[100px]"
          >
            <option value="">전체</option>
            {distinctAssigned.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setQuickFilter(quickFilter === 'hot' ? 'none' : 'hot')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
              quickFilter === 'hot'
                ? 'bg-danger text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            HOT 리드
          </button>
          <button
            type="button"
            onClick={() => setQuickFilter(quickFilter === 'callback' ? 'none' : 'callback')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold ${
              quickFilter === 'callback'
                ? 'bg-accent text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            콜백 예정
          </button>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">정렬</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:border-accent"
          >
            <option value="lead_score">리드 점수순</option>
            <option value="created_at">최신순</option>
            <option value="callback_time">콜백 시간순</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2.5 text-left font-semibold text-gray-700">신청일</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-700">리드</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-700">이름</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-700">연락처</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-700">차종</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-700">계약조건</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-700">예상금액</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-700">상태</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-700">결과</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-700">상담사</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-700">콜백</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => {
              const carDisplay = [row.car_brand, row.car_model].filter(Boolean).join(' ') || '—';
              const contractDisplay =
                row.contract_months && row.annual_km
                  ? `${row.contract_months}개월 / 연 ${(row.annual_km / 10000).toFixed(0)}만km`
                  : '—';
              const priceDisplay =
                row.estimated_min != null && row.estimated_max != null
                  ? `${row.estimated_min}~${row.estimated_max}만원`
                  : '—';
              const rowClass =
                row.lead_score >= 80
                  ? 'bg-red-50 border-l-4 border-l-red-500'
                  : row.lead_score >= 50
                    ? 'bg-orange-50'
                    : '';

              return (
                <tr
                  key={row.id}
                  onClick={() => onSelectRow(row.id)}
                  className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${rowClass}`}
                >
                  <td className="px-3 py-2.5 text-gray-600 whitespace-nowrap">
                    {formatDate(row.created_at)}
                  </td>
                  <td className="px-3 py-2.5">
                    <LeadBadge score={row.lead_score} />
                  </td>
                  <td className="px-3 py-2.5 font-medium text-gray-900">{row.name}</td>
                  <td className="px-3 py-2.5">
                    <a
                      href={`tel:${row.phone.replace(/\D/g, '')}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-accent hover:underline"
                    >
                      {row.phone}
                    </a>
                  </td>
                  <td className="px-3 py-2.5 text-gray-700">{carDisplay}</td>
                  <td className="px-3 py-2.5 text-gray-600">{contractDisplay}</td>
                  <td className="px-3 py-2.5 text-gray-700">{priceDisplay}</td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={row.status}
                      onChange={(e) => updateField(row.id, 'status', e.target.value)}
                      className={`text-xs font-semibold px-2 py-1 rounded-full border-0 ${getStatusBadgeClass(row.status)}`}
                    >
                      {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={row.consult_result ?? ''}
                      onChange={(e) =>
                        updateField(row.id, 'consult_result', e.target.value || null)
                      }
                      className="border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-accent"
                    >
                      {RESULT_OPTIONS.map((o) => (
                        <option key={o.value || 'empty'} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={row.assigned_to ?? ''}
                      onChange={(e) =>
                        updateField(row.id, 'assigned_to', e.target.value || null)
                      }
                      className="border border-gray-300 rounded px-2 py-1 text-xs outline-none focus:border-accent min-w-[80px]"
                    >
                      <option value="">—</option>
                      {distinctAssigned.map((a) => (
                        <option key={a} value={a}>
                          {a}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-2.5 text-warning font-semibold">
                    {formatCallbackTime(row.callback_time)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredRows.length === 0 && (
          <div className="py-12 text-center text-gray-500">조회 결과가 없습니다</div>
        )}
      </div>

    </div>
  );
}
