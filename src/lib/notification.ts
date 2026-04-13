import { Resend } from 'resend';
import { BRAND } from '@/constants/brand';
import { type LeadDimensions, DIMENSION_LABELS, DIMENSION_MAX } from '@/lib/leadScore';

const resend = new Resend(process.env.RESEND_API_KEY);
const adminEmail = process.env.ADMIN_EMAIL ?? 'iori21y@gmail.com';

export interface ConsultationEmailData {
  name: string;
  phone: string;
  email: string;
  contactMethod: string;
  carBrand: string | null;
  carModel: string | null;
  trim: string | null;
  contractMonths: number | null;
  annualKm: number | null;
  deposit: number | null;
  prepaymentPct: number | null;
  monthlyBudget: number | null;
  estimatedMin: number | null;
  estimatedMax: number | null;
  leadScore: number;
  leadGrade: string;
  financeSummary: string | null;
  deviceType: string;
  utmSource: string;
  referrer: string;
  /** 차종 진단 답변: { questionId: { value, label } } */
  vehicleAnswers: Record<string, { value: string; label: string }> | null;
  /** 이용방법 진단 답변 */
  financeAnswers: Record<string, { value: string; label: string }> | null;
  /** 리드 점수 차원별 breakdown */
  leadDimensions?: LeadDimensions;
}

export interface CustomerReportData {
  email: string;
  name: string;
  carBrand: string | null;
  carModel: string | null;
  trim: string | null;
  contractMonths: number | null;
  annualKm: number | null;
  deposit: number | null;
  prepaymentPct: number | null;
  estimatedMin: number | null;
  estimatedMax: number | null;
  financeSummary: string | null;
}

function getLeadGrade(score: number): string {
  if (score >= 80) return '🔴 HOT';
  if (score >= 50) return '🟠 WARM';
  if (score >= 20) return '🟡 COOL';
  return '⚪ COLD';
}

function formatMoney(value: number | null): string {
  if (value === null) return '—';
  return `${(value / 10000).toLocaleString()}만원`;
}

const QUESTION_LABELS: Record<string, string> = {
  // 차종 진단
  v_purpose: '차량 용도', v_budget: '월 예산', v_people: '탑승 인원', v_priority: '우선순위',
  v_fuel: '선호 연료', v_parking: '주차 환경', v_brand: '브랜드 선호', v_drive: '주행 느낌',
  v_tech: '편의·기술 사양', v_resale: '중고 매각 가치',
  o_budget: '옵션 예산', o_safety: '안전 사양', o_comfort: '편의 옵션',
  // 이용방법 진단
  business: '사업자 여부', ownership: '소유 의향', cycle: '교체 주기', budget: '초기 자금',
  maintenance: '차량 관리', mileage: '연간 주행거리', contract_flexibility: '계약 유연성',
  price_range: '차량 가격대', credit: '신용 상태', depreciation: '감가상각',
  tax: '세금 처리',
};

function getQuestionLabel(qId: string): string {
  return QUESTION_LABELS[qId] || qId;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── 헬퍼: 진단 응답에서 value 추출 ───

function getAns(
  answers: Record<string, { value: string; label: string }> | null,
  questionId: string,
): string | null {
  return answers?.[questionId]?.value ?? null;
}

function getAnsLabel(
  answers: Record<string, { value: string; label: string }> | null,
  questionId: string,
): string | null {
  return answers?.[questionId]?.label ?? null;
}

// ════════════════════════════════════════════════════════════
// 상담 접근 포인트 생성 (카테고리별 프로필 ↔ 전략 매핑)
// ════════════════════════════════════════════════════════════

interface TalkingPointRow {
  category: string;
  profiles: string[];
  actions: string[];
  isProduct?: boolean;
}

interface TalkingPointSections {
  alerts: string[];
  rows: TalkingPointRow[];
}

function buildTalkingPoints(data: ConsultationEmailData): TalkingPointSections {
  const alerts: string[] = [];
  const rows: TalkingPointRow[] = [];
  const fa = data.financeAnswers;
  const va = data.vehicleAnswers;

  // ─── 긴급/경고 알림 ───
  if (data.leadScore >= 80) {
    alerts.push('전환 가능성 높은 HOT 리드입니다. 빠른 연락이 중요합니다.');
  }
  if (data.contactMethod === 'skip') {
    alerts.push('연락처를 남기지 않았습니다. 재방문 시 전환 유도가 필요합니다.');
  }
  if (data.estimatedMin != null && data.monthlyBudget != null && data.monthlyBudget > 0) {
    const gap = data.estimatedMin - data.monthlyBudget;
    if (gap > 0) {
      alerts.push(`예상 최소 월 납입금(${formatMoney(data.estimatedMin)})이 고객 희망 예산(${formatMoney(data.monthlyBudget)})보다 높습니다.`);
    }
  }

  // ─── 추천 상품 ───
  if (data.financeSummary) {
    const product = data.financeSummary.split(' ')[0];
    const pct = data.financeSummary.match(/(\d+)%/)?.[1];
    const pctNote = pct ? ` (적합도 ${pct}%)` : '';
    let action = '';
    if (product === '장기렌트') action = `장기렌트${pctNote} — 올인원 패키지를 강조하세요`;
    else if (product === '리스') action = `리스${pctNote} — 부가세 환급, 잔존가치 옵션을 안내하세요`;
    else if (product === '할부') action = `할부${pctNote} — 금리 조건과 장기 보유 혜택을 강조하세요`;
    else if (product === '현금구매') action = `현금구매${pctNote} — 프로모션 할인을 안내하세요`;
    if (action) rows.push({ category: '추천 상품', profiles: [], actions: [action], isProduct: true });
  }

  // ─── 사업자·세금 ───
  {
    const business = getAns(fa, 'business');
    const tax = getAns(fa, 'tax');
    const p: string[] = [];
    const a: string[] = [];
    if (business === 'corp') {
      p.push('법인사업자');
      if (tax === 'priority') p.push('절세 최우선');
      a.push('법인 리스/렌트 비용처리 절세 효과 강조');
      if (tax === 'priority') a.push('부가세 환급 + 감가상각 시뮬레이션 제시');
    } else if (business === 'sole') {
      p.push('개인사업자');
      if (tax === 'priority' || tax === 'some') p.push('비용처리 관심');
      a.push('사업용 차량 비용처리 혜택 안내');
      if (tax === 'priority' || tax === 'some') a.push('리스/렌트 세금 혜택을 구체적 금액으로 제시');
    }
    if (p.length || a.length) rows.push({ category: '사업자·세금', profiles: p, actions: a });
  }

  // ─── 예산·자금 ───
  {
    const budget = getAns(fa, 'budget');
    const priceRange = getAns(fa, 'price_range');
    const p: string[] = [];
    const a: string[] = [];
    if (budget === 'rich') {
      const priceLabel = getAnsLabel(fa, 'price_range');
      p.push(`자금 여유 충분${priceLabel ? ` · ${priceLabel}` : ''}`);
      a.push('프리미엄 옵션/트림 업그레이드 제안 가능');
    } else if (budget === 'tight') {
      p.push('초기 자금 부담');
      a.push('보증금 최소화, 월 납입 분산 방안 먼저 안내');
      if (priceRange === 'high' || priceRange === 'premium') {
        alerts.push('자금 부담 vs 고가 차량 희망 — 예산 격차 존재');
        a.push('현실적 대안(트림 조정, 선납금 활용) 함께 제시');
      }
    } else if (budget === 'moderate') {
      p.push('자금 있지만 분납 희망');
      a.push('보증금/선납금 조합으로 월 납입 절감 효과 제시');
    }
    if (p.length || a.length) rows.push({ category: '예산·자금', profiles: p, actions: a });
  }

  // ─── 신용 ───
  {
    const credit = getAns(fa, 'credit');
    const p: string[] = [];
    const a: string[] = [];
    if (credit === 'excellent') {
      p.push('신용 1~3등급 우수');
      a.push('우대 금리 협상 여지 — 금융 승인 빠름');
    } else if (credit === 'low') {
      p.push('신용등급 관리 필요');
      a.push('장기렌트(신용 영향 최소) 우선 안내');
      alerts.push('신용등급 낮음 — 금융 승인에 제약이 있을 수 있습니다.');
    } else if (credit === 'unknown') {
      p.push('신용등급 미파악');
      a.push('무료 신용조회 안내 + 등급별 가능 상품 설명');
    }
    if (p.length || a.length) rows.push({ category: '신용', profiles: p, actions: a });
  }

  // ─── 소유·교체 ───
  {
    const ownership = getAns(fa, 'ownership');
    const cycle = getAns(fa, 'cycle');
    const p: string[] = [];
    const a: string[] = [];
    if (ownership === 'must_own') { p.push('소유권 강하게 원함'); a.push('할부/현금 적합 — 리스 인수 조건도 안내'); }
    else if (ownership === 'use_only') { p.push('편한 사용 선호'); a.push('렌트 올인원 관리, 리스 반납 편의성 어필'); }
    if (cycle === 'short') { p.push('2~3년 단기 교체'); a.push('잔존가치 높은 차종 + 만기 교체 프로그램 안내'); }
    else if (cycle === 'long') { p.push('6년 이상 장기 보유'); a.push('할부/현금 소유 후 장기 유지비 절감 강조'); }
    if (p.length || a.length) rows.push({ category: '소유·교체', profiles: p, actions: a });
  }

  // ─── 관리·보험 ───
  {
    const maintenance = getAns(fa, 'maintenance');
    const p: string[] = [];
    const a: string[] = [];
    if (maintenance === 'full') {
      p.push('올인원 관리 희망');
      a.push('렌트 올인원 패키지 적극 추천');
    } else if (maintenance === 'self') {
      p.push('직접 관리 선호');
      a.push('할부/현금으로 보험·정비처 자유 선택 장점 안내');
    }
    if (p.length || a.length) rows.push({ category: '관리·보험', profiles: p, actions: a });
  }

  // ─── 감가상각 ───
  {
    const depreciation = getAns(fa, 'depreciation');
    if (depreciation === 'concern') {
      rows.push({ category: '감가상각', profiles: ['감가 리스크에 민감'], actions: ['리스/렌트로 감가 리스크 회피 가능 강조'] });
    }
  }

  // ─── 유연성·해지 ───
  {
    const flexibility = getAns(fa, 'contract_flexibility');
    if (flexibility === 'flexible') {
      rows.push({ category: '유연성·해지', profiles: ['중도 해지 가능성 있음'], actions: ['중도해지 수수료 낮은 상품 우선 추천'] });
    }
  }

  // ─── 주행거리 ───
  {
    const p: string[] = [];
    const a: string[] = [];
    if (data.annualKm && data.annualKm >= 30000) {
      p.push(`장거리 운전자 (연 ${(data.annualKm / 10000)}만km)`);
      a.push('초과 비용 민감 — 충분한 거리 확보 또는 할부 제안');
    } else if (data.annualKm && data.annualKm <= 10000) {
      p.push('근거리·주말 운전자');
      a.push('기본 거리로 충분 — 거리 절감 옵션 안내');
    }
    if (p.length || a.length) rows.push({ category: '주행거리', profiles: p, actions: a });
  }

  // ─── 계약기간 ───
  {
    const a: string[] = [];
    if (data.contractMonths === 60) a.push('월 납입 절감 강조 + 중도해지 조건 안내');
    else if (data.contractMonths === 36) a.push('교체 용이성 어필 + 만기 후 재계약/인수 옵션 설명');
    if (a.length) rows.push({ category: '계약기간', profiles: [data.contractMonths ? `${data.contractMonths}개월` : ''], actions: a });
  }

  // ─── 차종·용도 ───
  {
    const vPurpose = getAns(va, 'v_purpose');
    const p: string[] = [];
    const a: string[] = [];
    if (vPurpose === 'business') { p.push('영업·업무용'); a.push('비용처리 + 품격(세단) 동시 만족 견적 준비'); }
    else if (vPurpose === 'family') { p.push('가족 여행·레저'); a.push('안전 사양 + 넓은 공간 SUV/미니밴 중심 안내'); }
    else if (vPurpose === 'commute') { p.push('출퇴근·도심 이동'); }
    else if (vPurpose === 'hobby') { p.push('주말 드라이브·취미'); }
    else if (vPurpose === 'first_car') { p.push('첫 차 구매'); a.push('유지비 적고 운전 쉬운 차종 위주로 안내 — 보험·관리 방법도 함께 설명'); }
    if (p.length || a.length) rows.push({ category: '차량 용도', profiles: p, actions: a });
  }

  // ─── 차종·예산 ───
  {
    const vBudget = getAns(va, 'v_budget');
    const p: string[] = [];
    const a: string[] = [];
    if (vBudget === 'premium') { p.push('월 80만원 이상'); a.push('고급 트림 + 풀옵션 적극 제안'); }
    else if (vBudget === 'low') { p.push('월 30만원 이하'); a.push('경차/소형차 실속 견적 준비'); }
    if (p.length || a.length) rows.push({ category: '월 예산', profiles: p, actions: a });
  }

  // ─── 주차 ───
  {
    const vParking = getAns(va, 'v_parking');
    if (vParking === 'narrow') {
      rows.push({ category: '주차 환경', profiles: ['좁은 골목/기계식'], actions: ['소형 차량 추천 — 대형 희망 시 주차 문제 사전 안내'] });
    }
  }

  // ─── 연료 ───
  {
    const vFuel = getAns(va, 'v_fuel');
    if (vFuel === 'ev') {
      rows.push({ category: '선호 연료', profiles: ['전기차 관심'], actions: ['보조금 + 충전 인프라 + 전기차 특약 안내'] });
    } else if (vFuel === 'hybrid') {
      rows.push({ category: '선호 연료', profiles: ['하이브리드 선호'], actions: ['연비 절감 + 세금 혜택을 숫자로 제시'] });
    }
  }

  // ─── 연락 방식 ───
  {
    const p: string[] = [];
    const a: string[] = [];
    if (data.contactMethod === 'kakao') { p.push('카카오톡 선호'); a.push('카카오 채널로 가벼운 인사 메시지 먼저'); }
    if (data.leadScore >= 50 && data.leadScore < 80) { a.push('WARM 리드 — 견적 비교 자료 준비 후 후속 연락'); }
    if (p.length || a.length) rows.push({ category: '연락', profiles: p, actions: a });
  }

  return { alerts, rows };
}

// ════════════════════════════════════════════════════════════
// 다차원 리드 분석 HTML 생성 (이메일용)
// ════════════════════════════════════════════════════════════

function buildDimensionHtml(dimensions: LeadDimensions): string {
  const dimKeys: (keyof LeadDimensions)[] = ['engagement', 'intent', 'specificity', 'contact', 'inflow'];

  function getBarColor(pct: number): string {
    if (pct >= 80) return '#EF4444'; // red
    if (pct >= 60) return '#F59E0B'; // amber
    if (pct >= 40) return '#3B82F6'; // blue
    return '#9CA3AF';               // gray
  }

  function getLevel(pct: number): string {
    if (pct >= 80) return '높음';
    if (pct >= 60) return '중상';
    if (pct >= 40) return '보통';
    if (pct >= 20) return '낮음';
    return '미참여';
  }

  const rows = dimKeys.map((key) => {
    const val = dimensions[key];
    const max = DIMENSION_MAX[key];
    const pct = Math.round((val / max) * 100);
    const label = DIMENSION_LABELS[key];
    const color = getBarColor(pct);
    const level = getLevel(pct);
    // 10칸 바 생성 (이메일 호환: 테이블 셀)
    const filledCount = Math.round(pct / 10);
    const filled = Array(filledCount).fill(`<td style="width:14px;height:12px;background:${color};border-radius:2px;"></td>`).join('');
    const empty = Array(10 - filledCount).fill('<td style="width:14px;height:12px;background:#E5E7EB;border-radius:2px;"></td>').join('');

    return `
      <tr>
        <td style="font-size:12px;color:#6B7280;padding:4px 8px 4px 0;white-space:nowrap;width:80px;">${label}</td>
        <td style="padding:4px 0;">
          <table cellpadding="0" cellspacing="1" style="border-collapse:separate;border-spacing:1px;">
            <tr>${filled}${empty}</tr>
          </table>
        </td>
        <td style="font-size:11px;color:#374151;padding:4px 0 4px 8px;white-space:nowrap;font-weight:600;">${val}/${max}</td>
        <td style="font-size:10px;color:${color};padding:4px 0 4px 6px;white-space:nowrap;font-weight:700;">${level}</td>
      </tr>`;
  }).join('');

  return `
    <div style="background:#F9FAFB;border-radius:8px;padding:12px 14px;">
      <div style="font-size:11px;font-weight:700;color:#4A5568;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">📊 리드 점수 분석</div>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        ${rows}
      </table>
    </div>`;
}

// ════════════════════════════════════════════
// 1. 상담사용 알림 이메일
// ════════════════════════════════════════════

export async function sendConsultationNotification(
  data: ConsultationEmailData
): Promise<{ success: boolean; error?: string }> {
  const leadGrade = data.leadGrade || getLeadGrade(data.leadScore);
  const carDisplay = [data.carBrand, data.carModel, data.trim].filter(Boolean).join(' ') || '미정';
  const financeDisplay = data.financeSummary || '미진단';

  const contactDisplay = {
    phone: `📞 ${data.phone}`,
    email: `📧 ${data.email}`,
    kakao: '💬 카카오톡 채널',
    skip: '⏭️ 연락처 미입력',
  }[data.contactMethod] || data.contactMethod;

  // 상담 접근 포인트 (진단 결과 / 상담 전략 분리)
  const { alerts, rows } = buildTalkingPoints(data);

  // 다차원 리드 분석 HTML
  const dimensionHtml = data.leadDimensions
    ? buildDimensionHtml(data.leadDimensions)
    : '';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, sans-serif; background: #F5F0E8; margin: 0; padding: 16px; }
    .card { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #E5E7EB; }
    .header { padding: 20px 24px; border-bottom: 1px solid #E5E7EB; }
    .header h2 { margin: 0 0 4px; font-size: 18px; color: #0D1B2A; }
    .header .grade { font-size: 14px; }
    .section { padding: 16px 24px; border-bottom: 1px solid #F0F0F0; }
    .section:last-child { border-bottom: none; }
    .section-title { font-size: 11px; font-weight: 700; color: #4A5568; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; }
    .label { font-size: 13px; color: #4A5568; }
    .value { font-size: 13px; font-weight: 600; color: #0D1B2A; }
    .tip { background: #FFFBF0; border-left: 3px solid #F59E0B; padding: 10px 14px; margin: 6px 0; border-radius: 0 8px 8px 0; font-size: 12px; color: #92400E; line-height: 1.5; }
    .urgent { background: #FFF5F5; border-left: 3px solid #EF4444; }
    .info { background: #F0F7FF; border-left: 3px solid #3B82F6; color: #1E40AF; }
    .estimate { background: #2563EB; color: #fff; padding: 16px; border-radius: 8px; text-align: center; margin: 12px 0; }
    .estimate .amount { font-size: 22px; font-weight: 800; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>📋 새 상담 신청 — ${escapeHtml(data.name)}</h2>
      <span class="grade">${leadGrade} (${data.leadScore}점)</span>
    </div>

    ${dimensionHtml ? `
    <div class="section">
      ${dimensionHtml}
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">고객 연락처</div>
      <div class="row"><span class="label">이름</span><span class="value">${escapeHtml(data.name)}</span></div>
      <div class="row"><span class="label">연락 방식</span><span class="value">${contactDisplay}</span></div>
      ${data.phone ? `<div class="row"><span class="label">전화번호</span><span class="value">${escapeHtml(data.phone)}</span></div>` : ''}
      ${data.email ? `<div class="row"><span class="label">이메일</span><span class="value">${escapeHtml(data.email)}</span></div>` : ''}
    </div>

    <div class="section">
      <div class="section-title">AI 진단 결과</div>
      <div class="row"><span class="label">추천 차종</span><span class="value">${escapeHtml(carDisplay)}</span></div>
      <div class="row"><span class="label">추천 이용방법</span><span class="value">${escapeHtml(financeDisplay)}</span></div>
    </div>

    <div class="section">
      <div class="section-title">상담 조건</div>
      <div class="row"><span class="label">계약 기간</span><span class="value">${data.contractMonths ? `${data.contractMonths}개월` : '—'}</span></div>
      <div class="row"><span class="label">연간 주행거리</span><span class="value">${data.annualKm ? `연 ${(data.annualKm / 10000)}만km` : '—'}</span></div>
      ${data.deposit != null ? `<div class="row"><span class="label">보증금</span><span class="value">${formatMoney(data.deposit)}</span></div>` : ''}
      ${data.prepaymentPct != null ? `<div class="row"><span class="label">선납금</span><span class="value">${data.prepaymentPct}%</span></div>` : ''}
      ${data.estimatedMin != null && data.estimatedMax != null ? `
      <div class="estimate">
        <div style="font-size:11px;opacity:0.85;">예상 월 납부금</div>
        <div class="amount">${formatMoney(data.estimatedMin)} ~ ${formatMoney(data.estimatedMax)}</div>
      </div>
      ` : ''}
    </div>

    ${alerts.length > 0 ? `
    <div class="section">
      <div class="section-title">🚨 알림</div>
      ${alerts.map(a => `<div class="tip urgent">${a}</div>`).join('')}
    </div>
    ` : ''}

    ${rows.length > 0 ? `
    <div class="section">
      <div class="section-title">👤 고객 분석 & 상담 전략</div>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;border-radius:8px;">
        <tr style="background:#F3F4F6;">
          <th style="font-size:11px;font-weight:700;color:#4A5568;padding:8px 12px;text-align:left;border-bottom:2px solid #E5E7EB;width:20%;">항목</th>
          <th style="font-size:11px;font-weight:700;color:#4A5568;padding:8px 12px;text-align:left;border-bottom:2px solid #E5E7EB;border-left:1px solid #E5E7EB;width:35%;">파악된 특성</th>
          <th style="font-size:11px;font-weight:700;color:#4A5568;padding:8px 12px;text-align:left;border-bottom:2px solid #E5E7EB;border-left:1px solid #E5E7EB;width:45%;">상담 전략</th>
        </tr>
        ${rows.map((row, i) => {
          const isLast = i === rows.length - 1;
          const borderBot = isLast ? '' : 'border-bottom:1px solid #F0F0F0;';
          const profileHtml = row.profiles.length > 0
            ? row.profiles.map(p => `<span style="display:inline-block;background:#F3F4F6;color:#374151;font-size:11px;font-weight:600;padding:2px 8px;border-radius:12px;margin:1px 2px;">${p}</span>`).join('')
            : '<span style="color:#D1D5DB;font-size:11px;">—</span>';
          const actionBg = row.isProduct ? '#F0F7FF' : '#FFFBF0';
          const actionBorder = row.isProduct ? '#3B82F6' : '#F59E0B';
          const actionColor = row.isProduct ? '#1E40AF' : '#92400E';
          const actionHtml = row.actions.length > 0
            ? row.actions.map(a => `<div style="background:${actionBg};border-left:3px solid ${actionBorder};padding:5px 10px;border-radius:0 6px 6px 0;font-size:11px;color:${actionColor};line-height:1.4;margin:2px 0;">${a}</div>`).join('')
            : '<span style="color:#D1D5DB;font-size:11px;">—</span>';
          return `
        <tr>
          <td style="padding:8px 12px;${borderBot}vertical-align:top;font-size:12px;font-weight:700;color:#0D1B2A;white-space:nowrap;">${row.category}</td>
          <td style="padding:8px 10px;${borderBot}vertical-align:top;border-left:1px solid #E5E7EB;">${profileHtml}</td>
          <td style="padding:8px 10px;${borderBot}vertical-align:top;border-left:1px solid #E5E7EB;">${actionHtml}</td>
        </tr>`;
        }).join('')}
      </table>
    </div>
    ` : ''}

    <div class="section">
      <div class="section-title">유입 정보</div>
      <div class="row"><span class="label">디바이스</span><span class="value">${escapeHtml(data.deviceType)}</span></div>
      <div class="row"><span class="label">유입 경로</span><span class="value">${escapeHtml(data.utmSource || '직접 방문')}</span></div>
      ${data.referrer ? `<div class="row"><span class="label">리퍼러</span><span class="value">${escapeHtml(data.referrer)}</span></div>` : ''}
    </div>

    ${data.vehicleAnswers && Object.keys(data.vehicleAnswers).length > 0 ? `
    <div class="section">
      <div class="section-title">🚗 차종 진단 — 전체 응답</div>
      ${Object.entries(data.vehicleAnswers).map(([qId, ans]) => `<div class="row"><span class="label">${escapeHtml(getQuestionLabel(qId))}</span><span class="value">${escapeHtml(ans.label)}</span></div>`).join('')}
    </div>
    ` : ''}

    ${data.financeAnswers && Object.keys(data.financeAnswers).length > 0 ? `
    <div class="section">
      <div class="section-title">🎯 이용방법 진단 — 전체 응답</div>
      ${Object.entries(data.financeAnswers).map(([qId, ans]) => `<div class="row"><span class="label">${escapeHtml(getQuestionLabel(qId))}</span><span class="value">${escapeHtml(ans.label)}</span></div>`).join('')}
    </div>
    ` : ''}
  </div>
</body>
</html>
`;

  const { error } = await resend.emails.send({
    from: `${BRAND.name} <onboarding@resend.dev>`,
    to: adminEmail,
    subject: `[상담 리포트] ${leadGrade} ${data.name} — ${carDisplay} / ${financeDisplay}`,
    html,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

// ════════════════════════════════════════════
// 2. 고객용 진단 결과 리포트
// ════════════════════════════════════════════

export async function sendCustomerReport(
  data: CustomerReportData
): Promise<{ success: boolean; error?: string }> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${BRAND.domain}`;
  const carDisplay = [data.carBrand, data.carModel, data.trim].filter(Boolean).join(' ') || '미정';
  const financeProduct = data.financeSummary?.split(' ')[0] || '';
  const financePct = data.financeSummary?.match(/(\d+)%/)?.[1] || '';

  // 상품별 설명
  const productInfo: Record<string, { emoji: string; desc: string; benefits: string[] }> = {
    '장기렌트': {
      emoji: '🚙',
      desc: '보험·정비·세금이 모두 포함된 올인원 서비스입니다.',
      benefits: ['보험·정비·세금 올인원', '비용처리 가능 (사업자)', '신용 영향 최소화', '관리 부담 없음'],
    },
    '리스': {
      emoji: '📝',
      desc: '사업자 세제 혜택과 함께 신차를 합리적으로 이용할 수 있습니다.',
      benefits: ['부가세 환급 가능', '초기 비용 절감', '만기 시 인수/반납 선택', '신차 교체 용이'],
    },
    '할부': {
      emoji: '📋',
      desc: '차량 소유권을 확보하면서 월 납입으로 부담을 분산합니다.',
      benefits: ['소유권 즉시 확보', '주행거리 제한 없음', '자유로운 튜닝·개조', '장기 보유 시 경제적'],
    },
    '현금구매': {
      emoji: '💰',
      desc: '이자 부담 없이 한 번에 구매하여 완전 소유합니다.',
      benefits: ['이자 0원', '즉시 완전 소유', '제한 없음', '총 비용 최저'],
    },
  };

  const info = productInfo[financeProduct];

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F5F0E8; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #2563EB, #60A5FA); padding: 36px 24px; text-align: center; color: #fff; }
    .header h1 { margin: 0 0 8px; font-size: 22px; font-weight: 800; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 12px; }
    .body { padding: 28px 24px; }
    .estimate-card { background: linear-gradient(135deg, #0D1B2A, #2C2C2E); color: #fff; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px; }
    .estimate-card .label { font-size: 12px; opacity: 0.7; margin-bottom: 8px; }
    .estimate-card .amount { font-size: 32px; font-weight: 800; letter-spacing: -0.5px; }
    .result-card { border: 1px solid #E5E7EB; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
    .result-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .result-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .result-title { font-size: 11px; color: #4A5568; }
    .result-value { font-size: 16px; font-weight: 700; color: #0D1B2A; }
    .result-pct { font-size: 12px; color: #2563EB; font-weight: 600; }
    .result-desc { font-size: 13px; color: #4A5568; line-height: 1.5; margin-bottom: 12px; }
    .benefit-list { list-style: none; padding: 0; margin: 0; }
    .benefit-list li { font-size: 13px; color: #0D1B2A; padding: 4px 0; }
    .benefit-list li::before { content: '✓ '; color: #10B981; font-weight: 700; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 12px; font-weight: 700; color: #4A5568; margin-bottom: 10px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F5F0E8; }
    .row:last-child { border-bottom: none; }
    .row .label { font-size: 13px; color: #4A5568; }
    .row .value { font-size: 13px; font-weight: 600; color: #0D1B2A; }
    .next-step { background: #F0F7FF; border-radius: 12px; padding: 20px; margin-top: 24px; }
    .next-step h3 { font-size: 14px; font-weight: 700; color: #2563EB; margin: 0 0 8px; }
    .next-step p { font-size: 13px; color: #4B5563; line-height: 1.6; margin: 0; }
    .next-step ol { font-size: 13px; color: #4B5563; line-height: 1.8; padding-left: 20px; margin: 8px 0 0; }
    .footer { padding: 20px 24px; text-align: center; font-size: 11px; color: #9CA3AF; line-height: 1.6; border-top: 1px solid #F0F0F0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${escapeHtml(data.name)}님의 맞춤 분석 리포트</h1>
      <p>AI 진단을 기반으로 최적의 자동차 이용방법을 찾았습니다</p>
      <span class="badge">🤖 ${BRAND.ai.charName} 분석 완료</span>
    </div>

    <div class="body">
      ${data.estimatedMin != null && data.estimatedMax != null ? `
      <div class="estimate-card">
        <div class="label">예상 월 납부금</div>
        <div class="amount">월 ${formatMoney(data.estimatedMin)} ~ ${formatMoney(data.estimatedMax)}</div>
      </div>
      ` : ''}

      <!-- 추천 차종 -->
      <div class="result-card">
        <div class="result-header">
          <div class="result-icon" style="background:linear-gradient(135deg,#7C3AED,#A78BFA);color:#fff;">🚗</div>
          <div>
            <div class="result-title">추천 차종</div>
            <div class="result-value">${escapeHtml(carDisplay)}</div>
          </div>
        </div>
        <p class="result-desc">고객님의 용도, 예산, 탑승 인원을 종합 분석하여 가장 적합한 차종입니다.</p>
      </div>

      <!-- 추천 이용방법 -->
      ${info ? `
      <div class="result-card">
        <div class="result-header">
          <div class="result-icon" style="background:linear-gradient(135deg,#2563EB,#60A5FA);color:#fff;">${info.emoji}</div>
          <div>
            <div class="result-title">추천 이용방법</div>
            <div class="result-value">${escapeHtml(financeProduct)} ${financePct ? `<span class="result-pct">적합도 ${financePct}%</span>` : ''}</div>
          </div>
        </div>
        <p class="result-desc">${info.desc}</p>
        <ul class="benefit-list">
          ${info.benefits.map(b => `<li>${b}</li>`).join('')}
        </ul>
      </div>
      ` : data.financeSummary ? `
      <div class="result-card">
        <div class="result-header">
          <div class="result-icon" style="background:linear-gradient(135deg,#2563EB,#60A5FA);color:#fff;">🎯</div>
          <div>
            <div class="result-title">추천 이용방법</div>
            <div class="result-value">${escapeHtml(data.financeSummary)}</div>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- 상담 조건 -->
      <div class="section">
        <div class="section-title">상담 조건</div>
        <div class="row"><span class="label">계약 기간</span><span class="value">${data.contractMonths ? `${data.contractMonths}개월` : '—'}</span></div>
        <div class="row"><span class="label">연간 주행거리</span><span class="value">${data.annualKm ? `연 ${(data.annualKm / 10000)}만km` : '—'}</span></div>
        ${data.deposit != null ? `<div class="row"><span class="label">보증금</span><span class="value">${formatMoney(data.deposit)}</span></div>` : ''}
        ${data.prepaymentPct != null ? `<div class="row"><span class="label">선납금</span><span class="value">${data.prepaymentPct}%</span></div>` : ''}
      </div>

      <!-- 다음 단계 안내 -->
      <div class="next-step">
        <h3>📌 다음 단계</h3>
        <p>위 결과를 바탕으로 전문 상담사가 최적의 견적을 준비합니다.</p>
        <ol>
          <li>전문 상담사가 조건을 검토합니다</li>
          <li>금융사별 최저가 견적을 비교합니다</li>
          <li>고객님께 맞춤 견적서를 전달드립니다</li>
        </ol>
      </div>

      <!-- 결과 페이지 링크 -->
      <div style="text-align:center;margin-top:20px;">
        <a href="${siteUrl}" style="display:inline-block;background:#2563EB;color:#fff;padding:14px 28px;border-radius:12px;text-decoration:none;font-weight:700;font-size:15px;">
          내 진단 결과 다시 보기 →
        </a>
        <p style="font-size:11px;color:#9CA3AF;margin-top:10px;">위 링크에서 시뮬레이션을 조절하며 다양한 조건을 비교할 수 있습니다</p>
      </div>
    </div>

    <div class="footer">
      본 리포트는 AI 진단 결과를 기반으로 자동 생성되었습니다.<br>
      예상 금액은 참고용이며, 실제 금액은 신용등급·금융사·프로모션에 따라 달라질 수 있습니다.<br><br>
      © ${BRAND.nameWithEn}
    </div>
  </div>
</body>
</html>
`;

  // 도메인 미인증: 관리자 이메일로 발송 → 관리자가 고객에게 전달
  // 도메인 인증 후: data.email로 직접 발송하도록 변경
  const { error } = await resend.emails.send({
    from: `${BRAND.name} AI <onboarding@resend.dev>`,
    to: adminEmail,
    subject: `[고객 리포트] ${data.name}님 — ${carDisplay} / ${financeProduct || '미진단'} (→ ${data.email})`,
    html,
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? '';

export async function sendTelegramNotification(
  data: ConsultationEmailData
): Promise<{ success: boolean; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { success: false, error: 'TELEGRAM_BOT_TOKEN not configured' };
  }
  const car = [data.carBrand, data.carModel, data.trim].filter(Boolean).join(' ') || '미선택';
  const contact =
    data.contactMethod === 'phone' ? '📞 ' + data.phone :
    data.contactMethod === 'email' ? '📧 ' + data.email :
    data.contactMethod === 'kakao' ? '💬 카카오톡' : '⏭️ 건너뜀';
  const lines = [
    '🚗 새 견적 요청!',
    '',
    '이름: ' + data.name,
    '연락: ' + contact,
    '차종: ' + car,
    '기간: ' + (data.contractMonths ? data.contractMonths + '개월' : '미선택'),
    '주행: ' + (data.annualKm ? '연 ' + (data.annualKm / 10000).toFixed(0) + '만km' : '미선택'),
    '이용: ' + (data.financeSummary ?? '미선택'),
    '',
    '점수: ' + data.leadScore + '점 ' + data.leadGrade,
    '기기: ' + data.deviceType,
    '유입: ' + (data.utmSource || data.referrer || 'direct'),
  ];
  if (data.estimatedMin && data.estimatedMax) {
    lines.push('예상: 월 ' + Math.round(data.estimatedMin / 10000) + '~' + Math.round(data.estimatedMax / 10000) + '만원');
  }
  try {
    const res = await fetch(
      'https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/sendMessage',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text: lines.join('\n') }),
      }
    );
    if (!res.ok) {
      const err = await res.text();
      return { success: false, error: 'Telegram API ' + res.status + ': ' + err };
    }
    return { success: true };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
