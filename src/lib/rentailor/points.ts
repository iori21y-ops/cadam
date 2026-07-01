// points.ts — 회원 포인트 원장(적립/사용/소멸) + 비용지원(카카오페이 캐시백) 헬퍼
// 원본 프로토타입: _design_ref/points.jsx (window 전역 → @/lib import 로 이식)
// 저장: localStorage["rt_points"] {txns}. 비용지원 맥락은 sessionStorage["rt_pt_ctx"].
// 현황: point_transactions/point_rules/point_redeem_policy 테이블+RLS 생성 완료, /points는 회원 시
//   /api/points 실원장 바인딩. 아래 시드/localStorage는 비회원(OTP 미활성) 폴백·UI 시연용.
//   ★ 남은 갭: redeem 영속화(POST) + 카카오페이 지급 API 미연동.

export const PT_KRW = 1; // 1P = 1원

export type PtTxnType = 'earn' | 'redeem' | 'expire';

export interface PtTxn {
  type: PtTxnType;
  label: string;
  amt: number;
  date: string;
  expires?: string;
  method?: string;
  cost?: string;
  status?: string;
}
export interface PtState {
  txns: PtTxn[];
}

export type PtCostKey = 'deductible' | 'earlyterm' | 'excess' | 'buyout';
export interface PtRedeemPolicyItem {
  key: PtCostKey;
  label: string;
  maxPct: number;
  sub: string;
}
export interface PtCtx {
  type: PtCostKey;
  amount: number;
  label: string;
}

// 사용(지원) 정책 — 비용 항목별 포인트 사용 한도(%). 실연동: ERP point_redeem_policy.
export const PT_REDEEM_POLICY: Record<PtCostKey, PtRedeemPolicyItem> = {
  deductible: { key: 'deductible', label: '사고 면책금(자기부담금)', maxPct: 50, sub: '사고 수리 자기부담금' },
  earlyterm: { key: 'earlyterm', label: '중도해지 수수료', maxPct: 50, sub: '중도상환 위약금' },
  excess: { key: 'excess', label: '초과운행금', maxPct: 100, sub: '약정 초과 주행 정산' },
  buyout: { key: 'buyout', label: '만기 인수가', maxPct: 30, sub: '만기 인수 시 차감' },
};
export const PT_PAYOUT = {
  method: '카카오페이',
  note: '캐피탈사 직접 정산이 어려운 비용도, 승인 후 등록된 카카오페이로 지원금을 캐시백해 드려요.',
};

// 시드 원장 (적립/사용/소멸 예시 포함). 적립 포인트는 적립일로부터 1년 후 소멸(expires).
export const PT_SEED: PtState = {
  txns: [
    { type: 'earn', label: '가입 첫 적립', amt: 2000, date: '2025.07.10', expires: '2026.07.10' },
    { type: 'earn', label: '가입 축하 포인트', amt: 3500, date: '2026.03.12', expires: '2027.03.12' },
    { type: 'earn', label: '소렌토 계약 적립(2배)', amt: 30000, date: '2026.04.01', expires: '2027.04.01', cost: 'contract' },
    { type: 'earn', label: '후기 작성 적립', amt: 3000, date: '2026.04.05', expires: '2027.04.05' },
    { type: 'earn', label: '프리미엄 등급 보너스', amt: 5000, date: '2026.06.01', expires: '2027.06.01' },
    { type: 'earn', label: '무사고 유지 보너스', amt: 3000, date: '2026.06.10', expires: '2027.06.10' },
    { type: 'earn', label: '그랜저 견적 요청 적립', amt: 1000, date: '2026.06.18', expires: '2027.06.18' },
    { type: 'redeem', label: '초과운행금 지원(카카오페이)', amt: -3000, date: '2026.06.20', method: '카카오페이', cost: 'excess', status: '지급 완료' },
    { type: 'expire', label: '이벤트 적립 소멸(유효기간 경과)', amt: -500, date: '2026.05.31' },
  ],
};

const isBrowser = (): boolean => typeof window !== 'undefined';

export function ptLoad(): PtState {
  if (isBrowser()) {
    try {
      const raw = localStorage.getItem('rt_points');
      if (raw) {
        const s = JSON.parse(raw) as PtState;
        if (s && Array.isArray(s.txns)) return s;
      }
    } catch {
      /* ignore */
    }
  }
  return JSON.parse(JSON.stringify(PT_SEED)) as PtState;
}
export function ptSave(s: PtState): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem('rt_points', JSON.stringify(s));
  } catch {
    /* ignore */
  }
}
export function ptBalance(): number {
  return ptLoad().txns.reduce((a, t) => a + (t.amt || 0), 0);
}
export function ptComma(n: number): string {
  return (Math.round(n) || 0).toLocaleString('ko-KR');
}

// 유효기간·소멸 — 적립 1년 후 소멸. PT_TODAY 기준 N일 내 소멸예정 합계·최근 소멸일
export const PT_TODAY = '2026.06.24';
function ptParseDate(s: string | undefined): Date | null {
  if (!s || s.indexOf('.') < 0) return null;
  const p = s.split('.').map((x) => parseInt(x, 10));
  return new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
}
export function ptExpiring(days?: number): number {
  const now = ptParseDate(PT_TODAY);
  if (!now) return 0;
  const lim = new Date(now);
  lim.setDate(lim.getDate() + (days || 90));
  return ptLoad().txns.filter((t) => t.type === 'earn' && t.expires).reduce((a, t) => {
    const e = ptParseDate(t.expires);
    return e && e > now && e <= lim ? a + (t.amt || 0) : a;
  }, 0);
}
export function ptExpireNext(): { date: string; amt: number } | null {
  const now = ptParseDate(PT_TODAY);
  if (!now) return null;
  const up = ptLoad()
    .txns.filter((t) => t.type === 'earn' && t.expires && (ptParseDate(t.expires) as Date) > now)
    .sort((a, b) => (ptParseDate(a.expires) as Date).getTime() - (ptParseDate(b.expires) as Date).getTime())[0];
  return up && up.expires ? { date: up.expires, amt: up.amt } : null;
}
export function ptExpiredTotal(): number {
  return -ptLoad().txns.filter((t) => t.type === 'expire').reduce((a, t) => a + (t.amt || 0), 0);
}

// 계산기 → 지원 신청 화면으로 넘길 맥락(비용 종류·금액 원)
export function ptSetCtx(ctx: PtCtx): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.setItem('rt_pt_ctx', JSON.stringify(ctx));
  } catch {
    /* ignore */
  }
}
export function ptGetCtx(): PtCtx | null {
  if (!isBrowser()) return null;
  try {
    return JSON.parse(sessionStorage.getItem('rt_pt_ctx') || 'null') as PtCtx | null;
  } catch {
    return null;
  }
}
export function ptClearCtx(): void {
  if (!isBrowser()) return;
  try {
    sessionStorage.removeItem('rt_pt_ctx');
  } catch {
    /* ignore */
  }
}
// 서버 영속화: cost(지원비용)를 보내면 서버가 정책·잔액으로 사용액을 계산해 pending 원장 기록.
//   사용액 계산은 서버가 소스오브트루스(클라 계산 불신). 비회원(401)은 localStorage 폴백(시연 유지).
export async function ptAddRedeem(
  costKey: PtCostKey,
  costWon: number,
  label?: string,
): Promise<{ ok: boolean; redeemed?: number; error?: string }> {
  try {
    const res = await fetch('/api/points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: costKey, cost: Math.round(costWon) }),
    });
    const j = (await res.json().catch(() => null)) as { ok?: boolean; redeemed?: number; error?: string } | null;
    if (res.ok && j?.ok) return { ok: true, redeemed: j.redeemed };
    if (res.status === 401) {
      // 비회원 시연: 클라 정책(maxPct)·localStorage 잔액으로 부분사용 계산 후 폴백 기록
      const cap = Math.floor((Math.round(costWon) * PT_REDEEM_POLICY[costKey].maxPct) / 100);
      const use = Math.max(0, Math.min(ptBalance(), cap));
      if (use > 0) {
        const s = ptLoad();
        s.txns.unshift({
          type: 'redeem',
          label: (label || PT_REDEEM_POLICY[costKey].label) + ' 지원 신청',
          amt: -use,
          date: '방금 전',
          method: '카카오페이',
          cost: costKey,
          status: '승인 대기',
        });
        ptSave(s);
      }
      return { ok: true, redeemed: use };
    }
    return { ok: false, error: j?.error || '지원 신청에 실패했습니다.' };
  } catch {
    return { ok: false, error: '네트워크 오류로 신청하지 못했습니다.' };
  }
}
