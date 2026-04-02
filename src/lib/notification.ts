import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const adminEmail = process.env.ADMIN_EMAIL ?? 'iori21y@gmail.com';

export interface ConsultationEmailData {
  name: string;
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

export async function sendConsultationNotification(
  data: ConsultationEmailData
): Promise<{ success: boolean; error?: string }> {
  const leadGrade = data.leadGrade || getLeadGrade(data.leadScore);
  const carDisplay = [data.carBrand, data.carModel, data.trim]
    .filter(Boolean)
    .join(' ') || '—';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    table { border-collapse: collapse; width: 100%; max-width: 600px; }
    th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
    th { background: #1B3A5C; color: white; width: 140px; }
    .grade { font-weight: bold; font-size: 1.1em; }
  </style>
</head>
<body>
  <h2>📋 새 상담 신청</h2>
  <table>
    <tr><th>고객명</th><td>${escapeHtml(data.name)}</td></tr>
    <tr><th>차종</th><td>${escapeHtml(carDisplay)}</td></tr>
    <tr><th>계약기간</th><td>${data.contractMonths ? `${data.contractMonths}개월` : '—'}</td></tr>
    <tr><th>연간 주행</th><td>${data.annualKm ? `${(data.annualKm / 10000).toLocaleString()}만km` : '—'}</td></tr>
    <tr><th>보증금</th><td>${formatMoney(data.deposit)}</td></tr>
    <tr><th>선납금</th><td>${data.prepaymentPct != null ? `${data.prepaymentPct}%` : '—'}</td></tr>
    <tr><th>월 예산</th><td>${formatMoney(data.monthlyBudget)}</td></tr>
    <tr><th>예상 견적</th><td>${formatMoney(data.estimatedMin)} ~ ${formatMoney(data.estimatedMax)}</td></tr>
    <tr><th>리드 등급</th><td class="grade">${leadGrade} (${data.leadScore}점)</td></tr>
  </table>
</body>
</html>
`;

  const { error } = await resend.emails.send({
    from: '카담 <onboarding@resend.dev>',
    to: adminEmail,
    subject: `[새 상담] ${data.name} - ${carDisplay} (리드: ${data.leadScore}점)`,
    html,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

// ─── 고객에게 진단 결과 리포트 발송 ───

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
  financeSummary: string | null; // "장기렌트 87%"
}

export async function sendCustomerReport(
  data: CustomerReportData
): Promise<{ success: boolean; error?: string }> {
  const carDisplay = [data.carBrand, data.carModel, data.trim]
    .filter(Boolean)
    .join(' ') || '미정';

  const financeDisplay = data.financeSummary || '미진단';

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #F5F5F7; margin: 0; padding: 20px; }
    .container { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #2563EB, #60A5FA); padding: 32px 24px; text-align: center; color: #fff; }
    .header h1 { margin: 0 0 8px; font-size: 20px; }
    .header p { margin: 0; font-size: 13px; opacity: 0.85; }
    .body { padding: 24px; }
    .section { margin-bottom: 20px; }
    .section-title { font-size: 13px; font-weight: 700; color: #86868B; margin-bottom: 10px; }
    .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #F0F0F0; }
    .row:last-child { border-bottom: none; }
    .label { font-size: 13px; color: #86868B; }
    .value { font-size: 14px; font-weight: 600; color: #1D1D1F; }
    .highlight { background: #2563EB; color: #fff; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 20px; }
    .highlight .amount { font-size: 28px; font-weight: 800; }
    .cta { display: block; text-align: center; background: #2563EB; color: #fff; padding: 14px; border-radius: 12px; text-decoration: none; font-weight: 700; font-size: 15px; margin-top: 16px; }
    .footer { padding: 16px 24px; text-align: center; font-size: 11px; color: #AEAEB2; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AI 진단 결과 리포트</h1>
      <p>${escapeHtml(data.name)}님의 맞춤 분석 결과입니다</p>
    </div>
    <div class="body">
      ${data.estimatedMin != null && data.estimatedMax != null ? `
      <div class="highlight">
        <div style="font-size:12px;opacity:0.85;margin-bottom:8px;">예상 월 납부금</div>
        <div class="amount">월 ${formatMoney(data.estimatedMin)} ~ ${formatMoney(data.estimatedMax)}</div>
      </div>
      ` : ''}

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
      </div>

      <p style="font-size:13px;color:#86868B;line-height:1.6;">
        전문 상담사가 위 조건을 바탕으로 최적의 견적을 준비하여 연락드리겠습니다.
        궁금한 점이 있으시면 언제든 문의해 주세요.
      </p>
    </div>
    <div class="footer">
      * 본 메일은 AI 진단 결과를 기반으로 자동 발송되었습니다.<br>
      예상 금액은 참고용이며, 실제 금액은 조건에 따라 달라질 수 있습니다.
    </div>
  </div>
</body>
</html>
`;

  const { error } = await resend.emails.send({
    from: '카담 AI <onboarding@resend.dev>',
    to: data.email,
    subject: `[진단 결과] ${data.name}님의 맞춤 분석 리포트 — ${carDisplay}`,
    html,
  });

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
