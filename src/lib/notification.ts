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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
