'use client';

import { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { motion } from 'framer-motion';
import { createBrowserSupabaseClient } from '@/lib/supabase';
import { useToast } from '@/hooks/useToast';
import { LeadBadge } from './LeadBadge';

export interface ConsultationDetailData {
  id: string;
  name: string;
  phone: string;
  car_brand: string | null;
  car_model: string | null;
  trim: string | null;
  contract_months: number | null;
  annual_km: number | null;
  deposit: number | null;
  prepayment_pct: number | null;
  monthly_budget: number | null;
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
  created_at: string;
}

interface NotificationLogItem {
  id: string;
  channel: string | null;
  status: string | null;
  sent_at: string | null;
}

interface ConsultationDetailProps {
  consultationId: string | null;
  onClose: () => void;
  onUpdate: () => void;
}

const STATUS_OPTIONS = [
  { value: 'pending', label: '미처리' },
  { value: 'consulting', label: '상담중' },
  { value: 'completed', label: '완료' },
] as const;

const RESULT_OPTIONS = [
  { value: '', label: '— 미정 —' },
  { value: 'contracted', label: '🟢 계약완료' },
  { value: 'competitor', label: '🔴 타사계약' },
  { value: 'hold', label: '🟡 보류' },
  { value: 'no_answer', label: '⚫ 부재' },
  { value: 'cancelled', label: '⚪ 취소' },
] as const;

function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
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

function toDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function inferSelectionPath(c: ConsultationDetailData): '차종' | '예산' | null {
  if (c.car_brand || c.car_model) return '차종';
  if (c.monthly_budget != null && c.monthly_budget > 0) return '예산';
  return null;
}

function sanitizeMemo(value: string): string {
  return DOMPurify.sanitize(value, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

export function ConsultationDetail({
  consultationId,
  onClose,
  onUpdate,
}: ConsultationDetailProps) {
  const { showToast } = useToast();
  const [consultation, setConsultation] = useState<ConsultationDetailData | null>(null);
  const [loading, setLoading] = useState(false);
  const [memo, setMemo] = useState('');
  const [callbackTime, setCallbackTime] = useState('');
  const [consultResult, setConsultResult] = useState('');
  const [status, setStatus] = useState('');
  const [notificationLogs, setNotificationLogs] = useState<NotificationLogItem[]>([]);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!consultationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear state when id is null
      setConsultation(null);
      return;
    }
    const client = createBrowserSupabaseClient();
    setLoading(true);
    client
      .from('consultations')
      .select(
        'id, name, phone, car_brand, car_model, trim, contract_months, annual_km, deposit, prepayment_pct, monthly_budget, estimated_min, estimated_max, status, assigned_to, lead_score, memo, callback_time, consult_result, utm_source, referrer, inflow_page, device_type, created_at'
      )
      .eq('id', consultationId)
      .single()
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) {
          setConsultation(null);
          return;
        }
        const c = data as ConsultationDetailData;
        setConsultation(c);
        setMemo(c.memo ?? '');
        setCallbackTime(toDatetimeLocal(c.callback_time));
        setConsultResult(c.consult_result ?? '');
        setStatus(c.status);
      });
  }, [consultationId]);

  useEffect(() => {
    if (!consultationId || !consultation) return;
    const client = createBrowserSupabaseClient();
    async function fetchLogs() {
      const { data } = await client
        .from('notification_log')
        .select('id, channel, status, sent_at')
        .eq('consultation_id', consultationId)
        .order('sent_at', { ascending: false });
      setNotificationLogs(data ?? []);
    }
    fetchLogs();
  }, [consultationId, consultation]);

  const supabase = createBrowserSupabaseClient();

  async function saveMemo() {
    if (!consultationId || !consultation) return;
    setSaving('memo');
    const sanitized = sanitizeMemo(memo);
    const { error } = await supabase
      .from('consultations')
      .update({ memo: sanitized, updated_at: new Date().toISOString() })
      .eq('id', consultationId);
    setSaving(null);
    if (!error) {
      showToast('메모가 저장되었습니다', 'success');
      onUpdate();
    }
  }

  async function saveCallbackTime() {
    if (!consultationId) return;
    setSaving('callback');
    const value = callbackTime ? new Date(callbackTime).toISOString() : null;
    const { error } = await supabase
      .from('consultations')
      .update({ callback_time: value, updated_at: new Date().toISOString() })
      .eq('id', consultationId);
    setSaving(null);
    if (!error) {
      showToast('콜백 시간이 설정되었습니다', 'success');
      onUpdate();
    }
  }

  async function saveConsultResult() {
    if (!consultationId) return;
    setSaving('result');
    const value = consultResult || null;
    const { error } = await supabase
      .from('consultations')
      .update({ consult_result: value, updated_at: new Date().toISOString() })
      .eq('id', consultationId);
    setSaving(null);
    if (!error) {
      onUpdate();
    }
  }

  async function saveStatus(newStatus: string) {
    if (!consultationId) return;
    setSaving('status');
    setStatus(newStatus);
    const { error } = await supabase
      .from('consultations')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', consultationId);
    setSaving(null);
    if (!error) {
      onUpdate();
    }
  }

  if (!consultationId) return null;

  const selectionPath = consultation ? inferSelectionPath(consultation) : null;
  const carDisplay = consultation
    ? [consultation.car_brand, consultation.car_model, consultation.trim]
        .filter(Boolean)
        .join(' ') || '—'
    : '—';
  const contractDisplay =
    consultation?.contract_months && consultation?.annual_km
      ? `${consultation.contract_months}개월 / 연 ${(consultation.annual_km / 10000).toFixed(0)}만km`
      : '—';
  const priceDisplay =
    consultation?.estimated_min != null && consultation?.estimated_max != null
      ? `${consultation.estimated_min}~${consultation.estimated_max}만원`
      : '—';

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.25 }}
        className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col"
      >
        {/* 헤더 — 닫기 버튼 상단 우측 */}
        <div className="flex items-center justify-between p-4 border-b border-[#E5E5EA] shrink-0">
          <span className="font-bold text-[#1D1D1F]">
            CRM 상세 — {consultation?.name ?? '로딩 중...'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-[10px] text-sm font-semibold text-[#86868B] hover:bg-[#F5F5F7] transition-colors"
          >
            닫기
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !consultation ? (
            <p className="text-[#86868B] text-center py-8">상담 정보를 불러올 수 없습니다</p>
          ) : (
            <>
          {/* 고객 기본 정보 */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#007AFF1A] flex items-center justify-center text-xl font-bold text-[#007AFF]">
              {consultation.name.charAt(0)}
            </div>
            <div>
              <div className="font-bold text-[#1D1D1F] flex items-center gap-2">
                {consultation.name}
                <LeadBadge score={consultation.lead_score} />
              </div>
              <a
                href={`tel:${consultation.phone.replace(/\D/g, '')}`}
                className="text-sm text-[#007AFF] hover:underline"
              >
                📞 {consultation.phone}
              </a>
            </div>
          </div>

          {/* [고객 선택 내역] */}
          <div className="rounded-2xl bg-[#F5F5F7] p-4">
            <h3 className="text-sm font-bold text-[#1D1D1F] mb-3">고객 선택 내역</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#86868B]">선택 경로</span>
                <span>
                  {selectionPath === '차종'
                    ? '차종 먼저 선택'
                    : selectionPath === '예산'
                      ? '월 예산 먼저 선택'
                      : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">차종</span>
                <span>{carDisplay}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">계약 기간</span>
                <span>{consultation.contract_months ? `${consultation.contract_months}개월` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">연간 주행거리</span>
                <span>
                  {consultation.annual_km
                    ? `연 ${(consultation.annual_km / 10000).toFixed(0)}만km`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">보증금</span>
                <span>
                  {consultation.deposit != null
                    ? `${(consultation.deposit / 10000).toFixed(0)}만원`
                    : '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86868B]">선납금 비율</span>
                <span>
                  {consultation.prepayment_pct != null ? `${consultation.prepayment_pct}%` : '—'}
                </span>
              </div>
              {selectionPath === '예산' && (
                <div className="flex justify-between">
                  <span className="text-[#86868B]">월 예산</span>
                  <span>
                    {consultation.monthly_budget != null
                      ? `${(consultation.monthly_budget / 10000).toFixed(0)}만원`
                      : '—'}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-[#86868B]">예상 금액</span>
                <span className="text-[#007AFF] font-semibold">{priceDisplay}</span>
              </div>
            </div>
          </div>

          {/* [유입 정보] */}
          <div className="rounded-xl bg-[#F0F7FF] p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-3">유입 정보</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-2">
                <span className="text-gray-500 shrink-0">utm_source</span>
                <span className="truncate text-right">{consultation.utm_source ?? '—'}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-gray-500 shrink-0">referrer</span>
                <span className="truncate text-right max-w-[180px]">
                  {consultation.referrer ?? '—'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">inflow_page</span>
                <span>{consultation.inflow_page ?? '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">device_type</span>
                <span>{consultation.device_type ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* [리드 점수] */}
          <div className="rounded-xl bg-gray-100 p-4 flex items-center justify-between">
            <span className="text-sm font-bold text-gray-700">리드 점수</span>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-primary">{consultation.lead_score}점</span>
              <LeadBadge score={consultation.lead_score} />
            </div>
          </div>

          {/* [CRM — 상담 메모] */}
          <div className="rounded-xl bg-gray-100 p-4">
            <h4 className="text-sm font-bold text-gray-700 mb-2">📝 CRM — 상담 메모</h4>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="상담 내용을 기록하세요..."
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none outline-none focus:border-primary font-sans"
            />
            <button
              type="button"
              onClick={saveMemo}
              disabled={saving !== null}
              className="mt-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {saving === 'memo' ? '저장 중...' : '저장'}
            </button>
          </div>

          {/* [CRM — 재연락 시간] */}
          <div className="rounded-xl bg-gray-100 p-4">
            <h4 className="text-sm font-bold text-gray-700 mb-2">📅 CRM — 재연락 시간</h4>
            <input
              type="datetime-local"
              value={callbackTime}
              onChange={(e) => setCallbackTime(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 text-sm outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={saveCallbackTime}
              disabled={saving !== null}
              className="mt-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {saving === 'callback' ? '저장 중...' : '저장'}
            </button>
          </div>

          {/* [CRM — 상담 결과] */}
          <div className="rounded-xl bg-gray-100 p-4">
            <h4 className="text-sm font-bold text-gray-700 mb-2">📋 CRM — 상담 결과</h4>
            <select
              value={consultResult}
              onChange={(e) => setConsultResult(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {RESULT_OPTIONS.map((o) => (
                <option key={o.value || 'empty'} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={saveConsultResult}
              disabled={saving !== null}
              className="mt-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {saving === 'result' ? '저장 중...' : '저장'}
            </button>
          </div>

          {/* [알림 발송 이력] */}
          <div className="rounded-xl bg-gray-100 p-4">
            <h4 className="text-sm font-bold text-gray-700 mb-2">📧 알림 발송 이력</h4>
            {notificationLogs.length === 0 ? (
              <p className="text-sm text-gray-500">— 발송 이력 없음 —</p>
            ) : (
              <div className="space-y-2 text-sm">
                {notificationLogs.map((log) => (
                  <div key={log.id} className="flex justify-between items-center">
                    <span className="text-gray-500">{log.channel ?? '—'}</span>
                    <span
                      className={
                        log.status === 'sent'
                          ? 'text-success font-medium'
                          : log.status === 'failed'
                            ? 'text-danger'
                            : 'text-gray-500'
                      }
                    >
                      {log.status === 'sent' ? '✅ sent' : log.status === 'failed' ? '❌ failed' : log.status ?? '—'}{' '}
                      {log.sent_at ? formatDateTime(log.sent_at) : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* [상태 변경] */}
          <div className="rounded-xl bg-gray-100 p-4">
            <h4 className="text-sm font-bold text-gray-700 mb-3">상태 변경</h4>
            <div className="flex gap-2">
              {STATUS_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => saveStatus(o.value)}
                  disabled={saving !== null}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${
                    status === o.value
                      ? 'bg-primary text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-primary hover:text-primary'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
            </>
          )}
        </div>
      </motion.div>
    </>
  );
}
