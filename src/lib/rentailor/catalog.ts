// catalog.ts — Rentailor 전체 차종 카탈로그 (목록/상세/견적/진단 공통 데이터 모델)
// 원본 프로토타입: _design_ref/catalog.jsx (window 전역 → 모듈 export 로 이식)

export type FuelKey = 'gasoline' | 'diesel' | 'hybrid' | 'ev';
export type ProductKey = 'rent' | 'lease' | 'install';

export interface CarSpec {
  eff?: string;
  power?: string;
  seats?: number;
  seatLabel?: string;
  effLabel?: string;
}
export interface CarTrim {
  name: string;
  base: number;
  note: string;
}
export interface Car {
  id: string;
  brand: string;
  model: string;
  segLabel: string;
  seg: string;
  fuel: FuelKey;
  from: number;
  origin: string;
  best: boolean;
  isNew: boolean;
  badges: string[];
  hue: number;
  spec: CarSpec;
  trims: CarTrim[];
}
interface CarInput {
  id: string;
  brand: string;
  model: string;
  segLabel: string;
  seg: string;
  from: number;
  fuel?: FuelKey;
  origin?: string;
  best?: boolean;
  isNew?: boolean;
  badges?: string[];
  hue?: number;
  spec?: CarSpec;
  trims?: CarTrim[];
  trimNames?: string[];
}

// 카테고리 탭
export const RT_TABS = [
  { key: 'all', label: '전체' },
  { key: 'best', label: 'BEST' },
  { key: 'domestic', label: '국산차' },
  { key: 'imported', label: '수입차' },
  { key: 'ev', label: '전기차' },
  { key: 'hybrid', label: '하이브리드' },
];

// 세그먼트 필터 칩
export const RT_SEGS = [
  { key: 'all', label: '전체 차급' },
  { key: 'sedan', label: '세단' },
  { key: 'suv', label: 'SUV' },
  { key: 'premium', label: '프리미엄·대형' },
];

// 정렬
export const RT_SORTS = [
  { key: 'reco', label: '추천순' },
  { key: 'low', label: '월 렌트료 낮은순' },
  { key: 'high', label: '월 렌트료 높은순' },
  { key: 'newest', label: '신규 등록순' },
];

// 연료 라벨 / 강조색
export const FUEL: Record<FuelKey, { label: string; tone: string }> = {
  gasoline: { label: '가솔린', tone: '#4A5568' },
  diesel: { label: '디젤', tone: '#4A5568' },
  hybrid: { label: '하이브리드', tone: '#10B981' },
  ev: { label: '전기', tone: '#2A7DE1' },
};

// 트림 자동 생성 (연료별 기본 라벨)
const TRIM_NAMES: Record<FuelKey, string[]> = {
  ev: ['스탠다드', '롱레인지', '롱레인지 AWD'],
  hybrid: ['하이브리드 모던', '하이브리드 프리미엄', '하이브리드 시그니처'],
  gasoline: ['가솔린 모던', '가솔린 프리미엄', '가솔린 시그니처'],
  diesel: ['디젤 베이직', '디젤 럭셔리', '디젤 시그니처'],
};
const TRIM_NOTES = ['합리적인 기본 구성', '가장 인기 있는 구성', '풀옵션 상위 트림'];

function car(o: CarInput): Car {
  const from = o.from;
  const fuel: FuelKey = o.fuel ?? 'gasoline';
  const names = o.trimNames ?? TRIM_NAMES[fuel] ?? TRIM_NAMES.gasoline;
  const trims =
    o.trims ??
    names.map((n, i) => ({
      name: n,
      base: i === 0 ? from : from + Math.round(from * (i === 1 ? 0.13 : 0.28)),
      note: TRIM_NOTES[i] ?? '',
    }));
  return {
    id: o.id,
    brand: o.brand,
    model: o.model,
    segLabel: o.segLabel,
    seg: o.seg,
    from,
    fuel,
    origin: o.origin ?? 'domestic',
    best: o.best ?? false,
    isNew: o.isNew ?? false,
    badges: o.badges ?? [],
    hue: o.hue ?? 0,
    spec: o.spec ?? {},
    trims,
  };
}

// ── 차량 카탈로그 (월 from = 사이트 표시 최저가, 만원) ──────
export const RT_CATALOG: Car[] = [
  car({ id: 'avante', brand: '현대', model: '아반떼 (CN7)', segLabel: '준중형 세단', seg: 'sedan', fuel: 'gasoline', from: 45, best: true, badges: ['인기'], hue: 218, spec: { eff: '15.4km/L', power: '123마력', seats: 5 } }),
  car({ id: 'k5', brand: '기아', model: 'K5', segLabel: '중형 세단', seg: 'sedan', fuel: 'gasoline', from: 61, hue: 222, spec: { eff: '13.6km/L', power: '160마력', seats: 5 } }),
  car({ id: 'tucson', brand: '현대', model: '투싼 (NX4)', segLabel: '준중형 SUV', seg: 'suv', fuel: 'hybrid', from: 63, badges: [], hue: 150, spec: { eff: '16.2km/L', power: '230마력', seats: 5 } }),
  car({ id: 'sportage', brand: '기아', model: '스포티지 (NQ5)', segLabel: '준중형 SUV', seg: 'suv', fuel: 'gasoline', from: 64, hue: 14, spec: { eff: '12.4km/L', power: '160마력', seats: 5 } }),
  car({ id: 'sorento', brand: '기아', model: '쏘렌토 (MQ4)', segLabel: '중형 SUV', seg: 'suv', fuel: 'hybrid', from: 80, best: true, badges: ['인기'], hue: 200, spec: { eff: '15.3km/L', power: '230마력', seats: 7, seatLabel: '7인승' } }),
  car({ id: 'santafe', brand: '현대', model: '싼타페 (MX5)', segLabel: '중형 SUV', seg: 'suv', fuel: 'hybrid', from: 80, hue: 40, spec: { eff: '15.5km/L', power: '235마력', seats: 7, seatLabel: '7인승' } }),
  car({ id: 'grandeur', brand: '현대', model: '그랜저 (GN7)', segLabel: '준대형 세단', seg: 'premium', fuel: 'gasoline', from: 85, best: true, hue: 226, spec: { eff: '11.7km/L', power: '198마력', seats: 5 } }),
  car({ id: 'carnival', brand: '기아', model: '카니발 (KA4)', segLabel: '미니밴', seg: 'suv', fuel: 'diesel', from: 80, hue: 206, trimNames: ['디젤 9인승 프레스티지', '디젤 7인승 노블레스', '디젤 7인승 시그니처'], spec: { eff: '13.1km/L', power: '202마력', seats: 9, seatLabel: '9인승' } }),
  car({ id: 'k8', brand: '기아', model: 'K8', segLabel: '준대형 세단', seg: 'premium', fuel: 'gasoline', from: 82, hue: 230, spec: { eff: '12.0km/L', power: '198마력', seats: 5 } }),
  car({ id: 'palisade', brand: '현대', model: '팰리세이드 (LX2)', segLabel: '대형 SUV', seg: 'suv', fuel: 'gasoline', from: 96, best: true, hue: 212, spec: { eff: '9.6km/L', power: '295마력', seats: 7, seatLabel: '7인승' } }),
  car({ id: 'ioniq5', brand: '현대', model: '아이오닉 5 (NE1)', segLabel: '준중형 전기 SUV', seg: 'suv', fuel: 'ev', from: 110, best: true, isNew: true, badges: ['전기차'], hue: 196, trimNames: ['롱레인지 2WD 익스클루시브', '롱레인지 2WD 프레스티지', '롱레인지 AWD 프레스티지'], spec: { eff: '458km', power: '217마력', seats: 5, effLabel: '1회 충전 주행' } }),
  car({ id: 'ev6', brand: '기아', model: 'EV6', segLabel: '준중형 전기 SUV', seg: 'suv', fuel: 'ev', from: 101, isNew: true, badges: ['전기차'], hue: 340, trimNames: ['롱레인지 2WD 에어', '롱레인지 2WD 어스', '롱레인지 AWD GT-라인'], spec: { eff: '475km', power: '229마력', seats: 5, effLabel: '1회 충전 주행' } }),
  car({ id: 'ioniq6', brand: '현대', model: '아이오닉 6 (CE1)', segLabel: '중형 전기 세단', seg: 'sedan', fuel: 'ev', from: 112, isNew: true, badges: ['전기차'], hue: 208, trimNames: ['롱레인지 2WD 익스클루시브', '롱레인지 2WD 프레스티지', '롱레인지 AWD 프레스티지'], spec: { eff: '524km', power: '229마력', seats: 5, effLabel: '1회 충전 주행' } }),
  car({ id: 'ev9', brand: '기아', model: 'EV9', segLabel: '대형 전기 SUV', seg: 'suv', fuel: 'ev', from: 143, best: true, isNew: true, badges: ['전기차'], hue: 184, trimNames: ['롱레인지 2WD 에어', '롱레인지 AWD 어스', '롱레인지 AWD GT-라인'], spec: { eff: '501km', power: '384마력', seats: 7, seatLabel: '7인승', effLabel: '1회 충전 주행' } }),
  car({ id: 'torres', brand: 'KGM', model: '토레스', segLabel: '중형 SUV', seg: 'suv', fuel: 'gasoline', from: 64, hue: 30, spec: { eff: '11.2km/L', power: '170마력', seats: 5 } }),
  car({ id: 'g80', brand: '제네시스', model: 'G80', segLabel: '대형 세단', seg: 'premium', fuel: 'gasoline', from: 119, hue: 230, spec: { eff: '10.8km/L', power: '304마력', seats: 5 } }),
  car({ id: 'gv70', brand: '제네시스', model: 'GV70', segLabel: '프리미엄 SUV', seg: 'premium', fuel: 'gasoline', from: 122, best: true, hue: 184, spec: { eff: '10.0km/L', power: '304마력', seats: 5 } }),
  car({ id: 'model3', brand: '테슬라', model: '모델 3', segLabel: '중형 전기 세단', seg: 'sedan', origin: 'imported', fuel: 'ev', from: 99, isNew: true, badges: ['전기차'], hue: 0, trimNames: ['RWD', '롱레인지 AWD', '퍼포먼스 AWD'], spec: { eff: '403km', power: '283마력', seats: 5, effLabel: '1회 충전 주행' } }),
  car({ id: 'modely', brand: '테슬라', model: '모델 Y', segLabel: '준중형 전기 SUV', seg: 'suv', origin: 'imported', fuel: 'ev', from: 109, best: true, isNew: true, badges: ['전기차'], hue: 350, trimNames: ['RWD', '롱레인지 AWD', '퍼포먼스 AWD'], spec: { eff: '450km', power: '299마력', seats: 5, effLabel: '1회 충전 주행' } }),
  car({ id: 'arkana', brand: '르노', model: '아르카나', segLabel: '소형 SUV', seg: 'suv', fuel: 'hybrid', from: 55, hue: 46, spec: { eff: '17.5km/L', power: '145마력', seats: 5 } }),
];

// 카테고리 매칭
export function rtCarInTab(c: Car, tab: string): boolean {
  if (tab === 'all') return true;
  if (tab === 'best') return !!c.best;
  if (tab === 'domestic') return c.origin === 'domestic';
  if (tab === 'imported') return c.origin === 'imported';
  if (tab === 'ev') return c.fuel === 'ev';
  if (tab === 'hybrid') return c.fuel === 'hybrid';
  return true;
}
export function rtCarInSeg(c: Car, seg: string): boolean {
  return seg === 'all' || c.seg === seg;
}
export function rtTabCount(tab: string): number {
  return RT_CATALOG.filter((c) => rtCarInTab(c, tab)).length;
}
export function rtFindCar(id: string): Car | null {
  return RT_CATALOG.find((c) => c.id === id) ?? null;
}

// 유사 차종 (같은 세그먼트 우선, 부족하면 같은 연료)
export function rtSimilar(c: Car | null, n = 4): Car[] {
  if (!c) return [];
  const same = RT_CATALOG.filter((x) => x.id !== c.id && x.seg === c.seg);
  const more = RT_CATALOG.filter((x) => x.id !== c.id && x.seg !== c.seg && x.fuel === c.fuel);
  return same.concat(more).slice(0, n);
}

// ── 견적 계산 (상세 페이지) ─────────────────────────────────
export const RT_DETAIL_TERMS = [
  { months: 36, label: '36개월', f: 1.0, note: '표준' },
  { months: 48, label: '48개월', f: 0.93, note: '인기' },
  { months: 60, label: '60개월', f: 0.88, note: '최저 월납' },
];
export const RT_DETAIL_MILEAGE = [
  { km: 10000, label: '1만 km', f: 0.96, note: '여유' },
  { km: 20000, label: '2만 km', f: 1.0, note: '표준' },
  { km: 30000, label: '3만 km', f: 1.09, note: '장거리' },
];
export const RT_DETAIL_DEPOSIT = [
  { key: 'none', label: '무보증', f: 1.0, note: '초기 0원' },
  { key: 'd30', label: '보증금 30%', f: 0.9, note: '월납 ↓' },
  { key: 'p30', label: '선납 30%', f: 0.93, note: '월납 ↓' },
];
export function rtDetailEstimate(base: number, months: number, km: number, dep: string): number {
  const t = RT_DETAIL_TERMS.find((x) => x.months === months) ?? RT_DETAIL_TERMS[0];
  const m = RT_DETAIL_MILEAGE.find((x) => x.km === km) ?? RT_DETAIL_MILEAGE[1];
  const d = RT_DETAIL_DEPOSIT.find((x) => x.key === dep) ?? RT_DETAIL_DEPOSIT[0];
  return Math.round(base * t.f * m.f * d.f);
}

// 상품(렌트/리스/할부) + 캐피탈별 최저가
export const RT_DETAIL_PRODUCTS = [
  { key: 'rent', label: '장기렌트', f: 1.0, note: '보험·세금 포함 · 회사 소유' },
  { key: 'lease', label: '오토리스', f: 0.94, note: '비용처리 유리 · 회사 소유' },
  { key: 'install', label: '할부구매', f: 1.08, note: '내 차 소유 · 금리 계산' },
];
export interface Capital {
  id: string;
  name: string;
  m: number;
  instRate: number;
  no?: ProductKey[];
}
export const RT_CAPITALS: Capital[] = [
  { id: 'hyundai', name: '현대캐피탈', m: 0.985, instRate: 5.3 },
  { id: 'woori', name: '우리캐피탈', m: 1.0, instRate: 5.4 },
  { id: 'shinhan', name: '신한캐피탈', m: 1.006, instRate: 5.7 },
  { id: 'kb', name: 'KB캐피탈', m: 1.012, instRate: 5.5 },
  { id: 'samsung', name: '삼성카드', m: 1.02, instRate: 5.9, no: ['lease'] },
];
// 차량가 역산(ERP와 동일 기준: 36개월·2만km 렌트 월요금 ÷ rentRatio) → 할부 PMT용
const RT_RENT_RATIO = 0.022;
function rtCarPrice(base: number): number {
  return Math.round((base * 10000) / RT_RENT_RATIO); // 원
}
function rtPmt(P: number, annualRate: number, months: number): number {
  const r = annualRate / 100 / 12;
  if (r === 0) return Math.round(P / months);
  return Math.round((P * r) / (1 - Math.pow(1 + r, -months)));
}
// 할부는 주행거리·보증금 무관 — 차량가 기반 PMT(만원). 렌트=수집근사, 리스=렌트×0.94
export function rtProductEstimate(
  base: number,
  product: ProductKey,
  months: number,
  km: number,
  dep: string,
  annualRate?: number,
): number {
  if (product === 'install') {
    const rate = annualRate != null ? annualRate : 5.5;
    return Math.round(rtPmt(rtCarPrice(base), rate, months) / 10000);
  }
  const rent = rtDetailEstimate(base, months, km, dep);
  return product === 'lease' ? Math.round(rent * 0.94) : rent;
}
// 표준 월요금 + 최저가 캐피탈 + 취급 캐피탈 수
export function rtLowestCapital(
  base: number,
  product: ProductKey,
  months: number,
  km: number,
  dep: string,
): { monthly: number; lowest: { cap: Capital; v: number } | null; count: number } {
  const caps = RT_CAPITALS.filter((c) => !(c.no && c.no.includes(product)));
  const P = product === 'install' ? rtCarPrice(base) : 0;
  const std = product === 'install' ? 0 : rtProductEstimate(base, product, months, km, dep);
  let bestCap: Capital | null = null;
  let bestV = Infinity;
  for (const c of caps) {
    const v = product === 'install' ? Math.round(rtPmt(P, c.instRate, months) / 10000) : Math.round(std * c.m);
    if (v < bestV) {
      bestV = v;
      bestCap = c;
    }
  }
  return {
    monthly: bestCap ? bestV : 0,
    lowest: bestCap ? { cap: bestCap, v: bestV } : null,
    count: caps.length,
  };
}

// 이용 절차
export const RT_STEPS = [
  { n: '01', title: '견적 신청', desc: '원하는 차종과 조건을 남기면 무료로 견적을 준비해요.', icon: 'consult' },
  { n: '02', title: '1:1 맞춤 상담', desc: '전담 매니저가 제휴 캐피탈 9곳을 비교해 최저가를 찾아드려요.', icon: 'compare' },
  { n: '03', title: '계약 확정', desc: '비대면으로 약관까지 꼼꼼히 확인하고 전자 계약을 진행해요.', icon: 'contract' },
  { n: '04', title: '탁송·출고', desc: '원하는 장소로 신차를 무료 탁송해 드려요. 보험·정비 포함.', icon: 'car' },
];

// 자주 묻는 질문 (상세)
export const RT_DETAIL_FAQS = [
  { q: '표시된 월 렌트료에 보험이 포함되나요?', a: '네. 자동차 보험과 자동차세, 정기 점검까지 모두 월 렌트료에 포함됩니다. 트림과 견적 조건에 따라 금액이 달라지며, 정확한 금액은 상담 시 안내해 드립니다.' },
  { q: '계약 기간과 주행거리는 나중에 바꿀 수 있나요?', a: '계약 전이라면 자유롭게 조정해 견적을 다시 받아보실 수 있습니다. 주행거리는 약정 기준이며, 초과 시 정산 방식도 상담에서 미리 안내해 드립니다.' },
  { q: '보증금이나 선납금은 꼭 내야 하나요?', a: '아니요. 무보증으로 초기 비용 없이 시작할 수 있습니다. 보증금이나 선납을 설정하면 월 납부액을 더 낮출 수 있어, 상황에 맞게 선택하시면 됩니다.' },
  { q: '만기 후에는 차량을 어떻게 하나요?', a: '만기 시 반납하고 신차로 교체하거나, 잔존가치로 인수하실 수 있습니다. 운행 습관과 차량 상태에 따라 유리한 방식을 함께 비교해 드립니다.' },
];

// 해당 차량 관련 콘텐츠 — info_articles 에서 연료·차급으로 매핑
// (원본은 window.INFO_ARTICLES 의존 → infoArticles 파라미터로 주입)
export interface InfoArticleLike {
  id: string;
  tag?: string;
  title?: string;
  read?: string;
  hue?: number;
  [key: string]: unknown;
}
const RT_CONTENT_BY_FUEL: Record<FuelKey, string[]> = {
  ev: ['ev-charge', 'ev-hybrid', 'included', 'corp-tax', 'trend-2026'],
  hybrid: ['ev-hybrid', 'included', 'lease-vs', 'deposit', 'trend-2026'],
  diesel: ['included', 'corp-tax', 'lease-vs', 'term', 'trend-2026'],
  gasoline: ['lease-vs', 'included', 'deposit', 'corp-tax', 'trend-2026'],
};
const RT_CONTENT_PREMIUM = ['corp-tax', 'lease-vs', 'included', 'term', 'trend-2026'];
export function rtRelatedContent(
  c: Car | null,
  infoArticles: InfoArticleLike[] = [],
): Array<{ id: string; tag?: string; title?: string; read?: string; hue?: number }> {
  if (!c) return [];
  const arts = infoArticles;
  const ids =
    c.fuel === 'ev'
      ? RT_CONTENT_BY_FUEL.ev
      : c.seg === 'premium'
        ? RT_CONTENT_PREMIUM
        : RT_CONTENT_BY_FUEL[c.fuel] ?? RT_CONTENT_BY_FUEL.gasoline;
  const picked: InfoArticleLike[] = ids
    .map((id) => arts.find((a) => a.id === id))
    .filter((a): a is InfoArticleLike => Boolean(a));
  // 부족분은 다른 아티클로 채움 (중복 제외)
  for (const a of arts) {
    if (picked.length >= 5) break;
    if (!picked.includes(a)) picked.push(a);
  }
  return picked.slice(0, 5).map((a) => ({ id: a.id, tag: a.tag, title: a.title, read: a.read, hue: a.hue }));
}
