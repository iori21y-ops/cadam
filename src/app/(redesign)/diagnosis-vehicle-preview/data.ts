// diagnosis-vehicle-preview/data.ts — 차종 추천 진단 데이터·로직 (co-located)
// 원본: _design_ref/diagnosis-app.jsx 의 window 전역 상수/함수(DQ·diagnose) + _design_ref/dep-data.jsx 의
//   rtDepAnalysis 체인을 모듈로 이식. catalog 의 RT_CATALOG·FUEL·Car 타입을 재사용한다.
// ※ 설문(diagnosis_config)·결과 저장(diagnosis_reports) 실연동 대신 프리뷰는 로컬 로직 유지(주석으로만 표기).
import { RT_CATALOG, FUEL, type Car } from '@/lib/rentailor/catalog';

// ── 설문 질문 정의 ───────────────────────────────────────────
export type AnswerKey = 'purpose' | 'people' | 'mileage' | 'fuel' | 'budget';

export interface DqOption {
  v: string;
  label: string;
  sub: string;
}
export interface DqQuestion {
  key: AnswerKey;
  eyebrow: string;
  title: string;
  desc: string;
  opts: DqOption[];
}

export const DQ: DqQuestion[] = [
  {
    key: 'purpose',
    eyebrow: 'STEP 1 · 사용 목적',
    title: '주로 어떻게 타시나요?',
    desc: '가장 가까운 목적을 골라주세요. 차급과 연료를 맞춰드려요.',
    opts: [
      { v: 'commute', label: '출퇴근·데일리', sub: '연비 좋고 부담 없는 차' },
      { v: 'family', label: '가족·아이와 함께', sub: '넓고 안전한 패밀리카' },
      { v: 'leisure', label: '레저·아웃도어', sub: '짐 많고 어디든 가는 SUV' },
      { v: 'business', label: '업무·법인·의전', sub: '품격 있는 준대형 이상' },
    ],
  },
  {
    key: 'people',
    eyebrow: 'STEP 2 · 탑승 인원',
    title: '보통 몇 명이 타나요?',
    desc: '자주 타는 인원에 맞춰 좌석을 추천해요.',
    opts: [
      { v: 'p2', label: '1~2명', sub: '혼자 또는 둘이' },
      { v: 'p4', label: '3~4명', sub: '소가족·커플' },
      { v: 'p7', label: '5명 이상', sub: '대가족·다인승 필요' },
    ],
  },
  {
    key: 'mileage',
    eyebrow: 'STEP 3 · 주행 거리',
    title: '한 달에 얼마나 달리세요?',
    desc: '주행 거리에 따라 연료 타입을 맞춰드려요.',
    opts: [
      { v: 'low', label: '1,000km 이하', sub: '가까운 거리 위주' },
      { v: 'mid', label: '1,000~2,000km', sub: '일반적인 주행' },
      { v: 'high', label: '2,000km 이상', sub: '장거리·출장 잦음' },
    ],
  },
  {
    key: 'fuel',
    eyebrow: 'STEP 4 · 선호 연료',
    title: '선호하는 연료가 있나요?',
    desc: '특별히 없으면 AI 추천에 맡기셔도 좋아요.',
    opts: [
      { v: 'any', label: '상관없어요', sub: 'AI 추천에 맡길게요' },
      { v: 'ev', label: '전기차', sub: '충전·친환경 선호' },
      { v: 'hybrid', label: '하이브리드', sub: '연비·정숙성 중시' },
      { v: 'gasoline', label: '가솔린', sub: '충전 걱정 없이' },
    ],
  },
  {
    key: 'budget',
    eyebrow: 'STEP 5 · 월 예산',
    title: '월 예산은 어느 정도세요?',
    desc: '예산 범위에 맞는 차량을 우선 추천해요.',
    opts: [
      { v: 'u60', label: '60만원 이하', sub: '부담 없이 시작' },
      { v: '60_90', label: '60~90만원', sub: '가장 인기 있는 구간' },
      { v: '90_120', label: '90~120만원', sub: '넓은 공간·고급 옵션' },
      { v: 'o120', label: '120만원 이상', sub: '프리미엄·전기차' },
    ],
  },
];

export type DgStep = 'intro' | AnswerKey | 'analyzing' | 'result';
export const DG_ORDER: DgStep[] = [
  'intro',
  'purpose',
  'people',
  'mileage',
  'fuel',
  'budget',
  'analyzing',
  'result',
];

export type Answers = Partial<Record<AnswerKey, string>>;

const BUDGET_RANGE: Record<string, [number, number]> = {
  u60: [0, 60],
  '60_90': [60, 90],
  '90_120': [90, 120],
  o120: [120, 999],
};

// ── 진단 스코어링 ────────────────────────────────────────────
export interface ScoredCar {
  car: Car;
  score: number;
  reasons: string[];
  match: number;
}

export function diagnose(a: Answers): ScoredCar[] {
  const [blo, bhi] = (a.budget && BUDGET_RANGE[a.budget]) || [0, 999];
  const scored: ScoredCar[] = RT_CATALOG.map((c) => {
    let s = 50;
    const r: string[] = [];
    const seats = c.spec.seats ?? 0;
    // 사용 목적
    if (a.purpose === 'commute') {
      if (c.seg === 'sedan') s += 12;
      if (c.fuel === 'hybrid' || c.fuel === 'ev') s += 8;
      if (c.from <= 70) s += 6;
      if (c.seg === 'sedan' && c.from <= 70) r.push('출퇴근에 딱 맞는 효율과 가격');
    } else if (a.purpose === 'family') {
      if (c.seg === 'suv') s += 12;
      if (seats >= 7) {
        s += 12;
        r.push('가족 여행에 넉넉한 ' + seats + '인승');
      } else if (c.seg === 'suv') r.push('패밀리카로 인기 있는 SUV');
    } else if (a.purpose === 'leisure') {
      if (c.seg === 'suv') {
        s += 14;
        r.push('레저·아웃도어에 강한 SUV');
      }
      if (seats >= 7) s += 4;
    } else if (a.purpose === 'business') {
      if (c.seg === 'premium') {
        s += 16;
        r.push('의전·법인에 어울리는 품격');
      }
      if (c.from >= 85) s += 4;
    }
    // 탑승 인원
    if (a.people === 'p2' && seats >= 7) s -= 6;
    if (a.people === 'p7') {
      if (seats >= 7) {
        s += 14;
        if (!r.some((x) => x.includes('인승'))) r.push('5명 이상도 여유로운 ' + seats + '인승');
      } else s -= 18;
    }
    // 주행 거리
    if (a.mileage === 'high') {
      if (c.fuel === 'ev') s -= 10;
      if (c.fuel === 'hybrid') {
        s += 12;
        r.push('장거리에 유리한 하이브리드 연비');
      }
      if (c.fuel === 'gasoline') s += 4;
    } else if (a.mileage === 'low' && c.fuel === 'ev') {
      s += 8;
      r.push('짧은 주행에 경제적인 전기차');
    }
    // 선호 연료
    if (a.fuel && a.fuel !== 'any') {
      if (c.fuel === a.fuel) {
        s += 16;
        r.push(FUEL[c.fuel].label + ' 선호를 반영했어요');
      } else s -= 14;
    }
    // 예산
    if (c.from > bhi) s -= c.from - bhi;
    else if (c.from >= blo) {
      s += 10;
      r.push('예산 범위에 맞는 월 ' + c.from + '만원');
    } else s += 4;

    return { car: c, score: s, reasons: r, match: 0 };
  });
  scored.sort((x, y) => y.score - x.score);
  // 이유 보강 + 적합도 산출
  scored.forEach((it) => {
    if (it.reasons.length < 2) it.reasons.push('보험·세금 포함 합리적인 월 렌트료');
    it.reasons = it.reasons.slice(0, 3);
    it.match = Math.max(82, Math.min(99, 72 + Math.round((it.score - 50) * 0.5)));
  });
  return scored;
}

// ── 감가(잔존가치) 등급 추정 — _design_ref/dep-data.jsx 의 rtDepAnalysis 체인 이식 ──
//   catalog 에 감가 필드가 없어 연료·차급·인기도·브랜드로 3년 잔존가치율을 추정한 값.
//   ※ 추정값 — 실연동 시 used-prices/엔카·KB 시세 통계로 교체.
//   (RT_DEP_MODEL·rtResidualAt 은 차량 가치분석 전용이라 이식 제외)
function rtDepRetention(c: Car): number {
  if (!c) return 0.56;
  let r = 0.58; // 기준
  if (c.fuel === 'hybrid') r += 0.06;
  else if (c.fuel === 'diesel') r += 0.02;
  else if (c.fuel === 'ev') r -= 0.075;
  if (c.seg === 'suv') r += 0.035;
  else if (c.seg === 'premium') r -= 0.02;
  if (c.best) r += 0.03;
  if ((c.badges || []).includes('인기')) r += 0.012;
  if (c.brand === '제네시스') r += 0.012;
  if (c.origin === 'imported') r -= 0.022;
  if (c.id === 'carnival') r += 0.045;
  if (c.id === 'torres' || c.brand === '르노' || c.brand === 'KGM') r -= 0.015;
  return Math.max(0.44, Math.min(0.68, r));
}

interface DepGrade {
  min: number;
  grade: string;
  label: string;
  color: string;
  desc: string;
}
const RT_DEP_GRADES: DepGrade[] = [
  { min: 0.635, grade: 'A+', label: '감가 방어 최상위', color: '#1F8A5B', desc: '중고 수요가 강해 가치가 잘 유지돼요.' },
  { min: 0.6, grade: 'A', label: '감가 우수', color: '#10B981', desc: '동급에서 가치 유지력이 좋은 편이에요.' },
  { min: 0.565, grade: 'B', label: '감가 양호', color: '#C9A84C', desc: '평균 수준으로 무난하게 유지돼요.' },
  { min: 0.525, grade: 'C', label: '감가 평이', color: '#E0913C', desc: '시간이 지나며 감가가 다소 빠른 편이에요.' },
  { min: 0, grade: 'D', label: '감가 빠름', color: '#C0563B', desc: '신차 대비 가치 하락 폭이 큰 편이에요.' },
];
function rtDepGradeOf(retention: number): DepGrade {
  return RT_DEP_GRADES.find((g) => retention >= g.min) ?? RT_DEP_GRADES[RT_DEP_GRADES.length - 1];
}
function rtDepSegAvg(seg: string): number {
  const list = RT_CATALOG.filter((c) => c.seg === seg);
  if (!list.length) return 0.56;
  return list.reduce((acc, c) => acc + rtDepRetention(c), 0) / list.length;
}

export interface DepAnalysis {
  retention: number;
  retentionPct: number;
  depPct: number;
  grade: string;
  label: string;
  color: string;
  desc: string;
  segAvgPct: number;
  deltaPts: number;
  betterThanAvg: boolean;
}
export function rtDepAnalysis(c: Car): DepAnalysis {
  const retention = rtDepRetention(c);
  const g = rtDepGradeOf(retention);
  const segAvg = rtDepSegAvg(c.seg);
  const deltaPts = Math.round((retention - segAvg) * 100); // %p
  return {
    retention,
    retentionPct: Math.round(retention * 100),
    depPct: Math.round((1 - retention) * 100),
    grade: g.grade,
    label: g.label,
    color: g.color,
    desc: g.desc,
    segAvgPct: Math.round(segAvg * 100),
    deltaPts,
    betterThanAvg: deltaPts >= 0,
  };
}
