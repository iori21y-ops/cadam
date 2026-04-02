/**
 * 개선된 상담 리포트 이메일 테스트 발송 스크립트
 * 실행: npx tsx scripts/test-resend-report.ts
 */

import { readFileSync } from 'fs';

// .env.local 먼저 로드 (모듈 import 전에 환경변수 세팅)
const envContent = readFileSync('.env.local', 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
  if (!process.env[key]) process.env[key] = val;
}

async function main() {
  // 환경변수 세팅 후 동적 import
  const { calculateLeadScore } = await import('../src/lib/leadScore');
  const { sendConsultationNotification } = await import('../src/lib/notification');
  type ConsultationEmailData = import('../src/lib/notification').ConsultationEmailData;

  // 풍부한 샘플 진단 응답 데이터
  const vehicleAnswers: Record<string, { value: string; label: string }> = {
    v_purpose: { value: 'family', label: '가족 여행·레저' },
    v_budget: { value: 'high', label: '50~80만원' },
    v_people: { value: 'medium', label: '3~4명 (소가족)' },
    v_priority: { value: 'safety', label: '안전·편의 장비' },
    v_fuel: { value: 'hybrid', label: '하이브리드' },
    o_budget: { value: 'mid', label: '적당히 (100~500만원)' },
    o_safety: { value: 'full', label: '최신 ADAS 풀옵션 원함' },
    v_parking: { value: 'apt', label: '아파트 지하주차장' },
    v_brand: { value: 'domestic', label: '현대·기아가 좋아요' },
  };

  const financeAnswers: Record<string, { value: string; label: string }> = {
    business: { value: 'sole', label: '개인사업자' },
    ownership: { value: 'use_only', label: '편하게 사용하는 게 좋다' },
    cycle: { value: 'short', label: '2~3년마다 새 차로' },
    budget: { value: 'moderate', label: '있지만 나눠 내고 싶다' },
    maintenance: { value: 'full', label: '전부 포함되면 좋겠다' },
    mileage: { value: '20000', label: '연 2만km (출퇴근 기본)' },
    contract_flexibility: { value: 'stable', label: '변화 없이 안정적' },
    price_range: { value: 'high', label: '6,000만원~1억원' },
    credit: { value: 'excellent', label: '우수 (1~3등급)' },
    depreciation: { value: 'concern', label: '매우 신경 쓰인다' },
    insurance: { value: 'included', label: '월 비용에 포함' },
    tax: { value: 'priority', label: '절세가 가장 중요' },
    cancel: { value: 'keep', label: '끝까지 유지' },
  };

  // 리드 점수 계산 (새 다차원 엔진)
  const { total, dimensions } = calculateLeadScore({
    stepCompleted: 6,
    carModel: '투싼',
    contractMonths: 48,
    deposit: 3000000,
    annualKm: 20000,
    contactMethod: 'phone',
    financeSummary: '장기렌트 85%',
    vehicleAnswers,
    financeAnswers,
    inflowPage: '/cars/hyundai-tucson',
    utmSource: 'naver_blog',
  });

  console.log(`리드 점수: ${total}점`);
  console.log('차원별 분석:');
  console.log(`  참여도:     ${dimensions.engagement}/20`);
  console.log(`  구매 의향:  ${dimensions.intent}/25`);
  console.log(`  견적 구체성: ${dimensions.specificity}/20`);
  console.log(`  연락 수단:  ${dimensions.contact}/25`);
  console.log(`  유입 품질:  ${dimensions.inflow}/10`);

  const emailData: ConsultationEmailData = {
    name: '테스트고객',
    phone: '01012345678',
    email: 'test@example.com',
    contactMethod: 'phone',
    carBrand: '현대',
    carModel: '투싼',
    trim: 'Premium',
    contractMonths: 48,
    annualKm: 20000,
    deposit: 3000000,
    prepaymentPct: 10,
    monthlyBudget: 500000,
    estimatedMin: 450000,
    estimatedMax: 620000,
    leadScore: total,
    leadGrade: total >= 80 ? '🔴 HOT' : total >= 50 ? '🟠 WARM' : '🟡 COOL',
    financeSummary: '장기렌트 85%',
    deviceType: 'Desktop',
    utmSource: 'naver_blog',
    referrer: 'https://blog.naver.com/cadam',
    vehicleAnswers,
    financeAnswers,
    leadDimensions: dimensions,
  };

  console.log('\n이메일 발송 중...');
  const result = await sendConsultationNotification(emailData);

  if (result.success) {
    console.log('✅ 상담 리포트 발송 완료 (관리자 이메일로 발송됨)');
  } else {
    console.error('❌ 발송 실패:', result.error);
  }
}

main().catch(console.error);
