import { Resend } from 'resend';
import { BRAND } from '@/constants/brand';

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
  o_budget: '옵션 예산', o_safety: '안전 사양', o_comfort: '편의 옵션', o_sound: '사운드',
  // 이용방법 진단
  business: '사업자 여부', ownership: '소유 의향', cycle: '교체 주기', budget: '초기 자금',
  maintenance: '차량 관리', mileage: '연간 주행거리', contract_flexibility: '계약 유연성',
  price_range: '차량 가격대', credit: '신용 상태', depreciation: '감가상각',
  insurance: '보험 방식', tax: '세금 처리', cancel: '계약 변경',
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

  // 상담 접근 포인트 분석
  const talkingPoints: string[] = [];
  if (data.financeSummary) {
    const product = data.financeSummary.split(' ')[0];
    if (product === '장기렌트') talkingPoints.push('관리 편의성과 비용처리를 중시하는 고객입니다. 올인원 패키지를 강조하세요.');
    else if (product === '리스') talkingPoints.push('세제 혜택과 신차 교체를 중시합니다. 부가세 환급, 잔존가치 옵션을 안내하세요.');
    else if (product === '할부') talkingPoints.push('소유권 확보를 원합니다. 금리 조건과 장기 보유 혜택을 강조하세요.');
    else if (product === '현금구매') talkingPoints.push('자금 여유가 있으며 이자를 피하려 합니다. 프로모션 할인을 안내하세요.');
  }
  if (data.annualKm && data.annualKm >= 30000) talkingPoints.push('장거리 운전자입니다. 주행거리 초과 비용에 민감할 수 있습니다.');
  if (data.contractMonths === 60) talkingPoints.push('장기 계약을 선호합니다. 월 납입금 절감 효과를 강조하세요.');
  if (data.contractMonths === 36) talkingPoints.push('단기 계약을 원합니다. 차량 교체 용이성을 어필하세요.');
  if (data.leadScore >= 80) talkingPoints.push('⚡ 전환 가능성 높은 리드입니다. 빠른 연락이 중요합니다.');
  if (data.contactMethod === 'skip') talkingPoints.push('⚠️ 연락처를 남기지 않았습니다. 재방문 시 전환 유도가 필요합니다.');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, sans-serif; background: #F5F5F7; margin: 0; padding: 16px; }
    .card { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; border: 1px solid #E5E5EA; }
    .header { padding: 20px 24px; border-bottom: 1px solid #E5E5EA; }
    .header h2 { margin: 0 0 4px; font-size: 18px; color: #1D1D1F; }
    .header .grade { font-size: 14px; }
    .section { padding: 16px 24px; border-bottom: 1px solid #F0F0F0; }
    .section:last-child { border-bottom: none; }
    .section-title { font-size: 11px; font-weight: 700; color: #86868B; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; }
    .row { display: flex; justify-content: space-between; padding: 6px 0; }
    .label { font-size: 13px; color: #86868B; }
    .value { font-size: 13px; font-weight: 600; color: #1D1D1F; }
    .tip { background: #FFFBF0; border-left: 3px solid #F59E0B; padding: 10px 14px; margin: 6px 0; border-radius: 0 8px 8px 0; font-size: 12px; color: #92400E; line-height: 1.5; }
    .urgent { background: #FFF5F5; border-left: 3px solid #EF4444; }
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

    ${talkingPoints.length > 0 ? `
    <div class="section">
      <div class="section-title">💡 상담 접근 포인트</div>
      ${talkingPoints.map(tip => `<div class="tip${tip.startsWith('⚡') || tip.startsWith('⚠️') ? ' urgent' : ''}">${tip}</div>`).join('')}
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
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F5F5F7; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #2563EB, #60A5FA); padding: 36px 24px; text-align: center; color: #fff; }
    .header h1 { margin: 0 0 8px; font-size: 22px; font-weight: 800; }
    .header p { margin: 0; font-size: 14px; opacity: 0.9; }
    .badge { display: inline-block; background: rgba(255,255,255,0.2); padding: 4px 12px; border-radius: 20px; font-size: 12px; margin-top: 12px; }
    .body { padding: 28px 24px; }
    .estimate-card { background: linear-gradient(135deg, #1D1D1F, #2C2C2E); color: #fff; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px; }
    .estimate-card .label { font-size: 12px; opacity: 0.7; margin-bottom: 8px; }
    .estimate-card .amount { font-size: 32px; font-weight: 800; letter-spacing: -0.5px; }
    .result-card { border: 1px solid #E5E5EA; border-radius: 12px; padding: 20px; margin-bottom: 16px; }
    .result-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .result-icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; }
    .result-title { font-size: 11px; color: #86868B; }
    .result-value { font-size: 16px; font-weight: 700; color: #1D1D1F; }
    .result-pct { font-size: 12px; color: #2563EB; font-weight: 600; }
    .result-desc { font-size: 13px; color: #86868B; line-height: 1.5; margin-bottom: 12px; }
    .benefit-list { list-style: none; padding: 0; margin: 0; }
    .benefit-list li { font-size: 13px; color: #1D1D1F; padding: 4px 0; }
    .benefit-list li::before { content: '✓ '; color: #10B981; font-weight: 700; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 12px; font-weight: 700; color: #86868B; margin-bottom: 10px; }
    .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #F5F5F7; }
    .row:last-child { border-bottom: none; }
    .row .label { font-size: 13px; color: #86868B; }
    .row .value { font-size: 13px; font-weight: 600; color: #1D1D1F; }
    .next-step { background: #F0F7FF; border-radius: 12px; padding: 20px; margin-top: 24px; }
    .next-step h3 { font-size: 14px; font-weight: 700; color: #2563EB; margin: 0 0 8px; }
    .next-step p { font-size: 13px; color: #4B5563; line-height: 1.6; margin: 0; }
    .next-step ol { font-size: 13px; color: #4B5563; line-height: 1.8; padding-left: 20px; margin: 8px 0 0; }
    .footer { padding: 20px 24px; text-align: center; font-size: 11px; color: #AEAEB2; line-height: 1.6; border-top: 1px solid #F0F0F0; }
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
