// 결제방식 비교 — 데이터/계산 모듈 (co-located)
// 원본: _design_ref/paycompare-app.jsx (총비용) + _design_ref/compare-app.jsx (조건·약관).
//   ※ 과제는 paycompare 만 명시했지만, 총비용+조건+약관 3탭은 compare-app.jsx 가 사실상의 세 번째 소스다.
//      (paycompare-app 헤더 주석: 조건·약관 탭은 AI진단 정리 때 제거됨 → compare-app 으로 분리)
// window 전역 없이 순수 모듈로 이식. catalog 미사용(이 비교는 차종 무관, 전부 자체 데이터).
// ※ 표기 수치/금리/약관은 데모 예시값 — 실연동 시 ERP 캐피탈사 관리(capital_partners × 상품)에서 운영.

export type PayKey = 'rent' | 'lease' | 'loan';

// ───────────────────────── 총비용 (paycompare) ─────────────────────────
export interface PcPrice { v: number; label: string }
export interface PcCust { v: string; ic: string; label: string }
export interface PcIns { v: string; label: string; annual: number }
export interface PcAge { v: string; label: string; f: number }

export const PC_PRICES: PcPrice[] = [
  { v: 3000, label: '3천만원대' },
  { v: 4000, label: '4천만원대' },
  { v: 5000, label: '5천만원대' },
  { v: 6500, label: '6천만원+' },
];
export const PC_CUST: PcCust[] = [
  { v: 'corp', ic: '🏢', label: '법인 사업자' },
  { v: 'biz', ic: '🧾', label: '개인 사업자' },
  { v: 'emp', ic: '🧑‍💼', label: '직장인' },
  { v: 'etc', ic: '👤', label: '기타' },
];
export const PC_INS: PcIns[] = [
  { v: 'none', label: '처음 (경력 없음)', annual: 180 },
  { v: 'u1', label: '1년 미만', annual: 140 },
  { v: '1_3', label: '1 ~ 3년', annual: 110 },
  { v: '3n', label: '3년+ 일반', annual: 85 },
  { v: '3g', label: '3년+ 우수', annual: 65 },
];
export const PC_AGE: PcAge[] = [
  { v: '20', label: '20대↓', f: 1.3 },
  { v: '30', label: '30대', f: 1.1 },
  { v: '40', label: '40대', f: 1.0 },
  { v: '50', label: '50대', f: 1.0 },
  { v: '60', label: '60대', f: 1.12 },
  { v: '70', label: '70대↑', f: 1.28 },
];

export interface PayMethod {
  key: PayKey;
  name: string;
  total: number;
  monthly: number;
  incl: { ins: boolean; tax: boolean; acq: boolean };
}
export interface PayCalc {
  insAnnual: number;
  ins3: number;
  tax3: number;
  acq: number;
  interest: number;
  corp: boolean;
  methods: PayMethod[];
}

export function calcPay(price: number, custKey: string, insV: string, ageV: string): PayCalc {
  const ins = PC_INS.find((x) => x.v === insV) ?? PC_INS[2];
  const age = PC_AGE.find((x) => x.v === ageV);
  const insAnnual = Math.round(ins.annual * (age ? age.f : 1));
  const ins3 = insAnnual * 3;
  const tax3 = Math.round(price * 0.006 * 3);
  const acq = Math.round(price * 0.07);
  const interest = Math.round(price * 0.105);
  const loan = price + acq + tax3 + ins3 + interest;
  const lease = Math.round(price * 0.93) + ins3;
  const rent = Math.round(price * 0.9);
  const corp = custKey === 'corp' || custKey === 'biz';
  const m = (x: number) => Math.round(x / 36);
  return {
    insAnnual,
    ins3,
    tax3,
    acq,
    interest,
    corp,
    methods: [
      { key: 'loan', name: '할부', total: loan, monthly: m(loan), incl: { ins: false, tax: false, acq: false } },
      { key: 'lease', name: '오토리스', total: lease, monthly: m(lease), incl: { ins: false, tax: true, acq: true } },
      { key: 'rent', name: '장기렌트', total: rent, monthly: m(rent), incl: { ins: true, tax: true, acq: true } },
    ],
  };
}

export const won = (manwon: number): string => {
  if (manwon >= 10000) return (manwon / 10000).toFixed(manwon % 10000 === 0 ? 0 : 1) + '억';
  return manwon.toLocaleString() + '만원';
};

export const PC_PRICE_SUB: Record<number, string> = {
  3000: '준중형·중형 세단',
  4000: '중형 SUV·수입 엔트리',
  5000: '준대형·프리미엄',
  6500: '대형·고급 수입',
};
export const PC_CUST_SUB: Record<string, string> = {
  corp: '법인 명의·비용처리',
  biz: '사업소득 비용처리',
  emp: '급여소득자',
  etc: '학생·주부 등',
};
export const PC_AGE_SUB: Record<string, string> = {
  '20': '보험 할증 높음',
  '30': '약간 할증',
  '40': '표준 보험료',
  '50': '표준 보험료',
  '60': '약간 할증',
  '70': '보험 할증 높음',
};

export interface PcStepOption { v: string | number; label: string; sub?: string }
export interface PcStep {
  key: 'price' | 'cust' | 'ins' | 'age';
  eyebrow: string;
  title: string;
  desc?: string;
  opts: PcStepOption[];
}
export const PC_STEPS: PcStep[] = [
  {
    key: 'price',
    eyebrow: 'STEP 1 · 차량 가격대',
    title: '관심 차량 가격대는?',
    desc: '가격대에 따라 취득세·보험·총비용이 달라져요.',
    opts: PC_PRICES.map((p) => ({ v: p.v, label: p.label, sub: PC_PRICE_SUB[p.v] })),
  },
  {
    key: 'cust',
    eyebrow: 'STEP 2 · 고객 유형',
    title: '어떤 고객이신가요?',
    desc: '사업자라면 비용처리 혜택까지 함께 비교해 드려요.',
    opts: PC_CUST.map((c) => ({ v: c.v, label: c.label, sub: PC_CUST_SUB[c.v] })),
  },
  {
    key: 'ins',
    eyebrow: 'STEP 3 · 보험 경력',
    title: '자동차 보험 경력은요?',
    desc: '경력에 따라 보험료를 추정해 총비용에 반영해요.',
    opts: PC_INS.map((i) => ({ v: i.v, label: i.label, sub: '보험료 추산 연 ' + i.annual + '만원' })),
  },
  {
    key: 'age',
    eyebrow: 'STEP 4 · 운전자 연령',
    title: '운전자 연령대는요?',
    desc: '연령별 보험료 통계를 반영해 더 정확히 추정해요.',
    opts: PC_AGE.map((a) => ({ v: a.v, label: a.label, sub: PC_AGE_SUB[a.v] })),
  },
];

export interface PcAnswers {
  price: number | null;
  cust: string | null;
  ins: string | null;
  age: string | null;
}

// ───────────────────────── 조건 비교 (compare-app cond) ─────────────────────────
export interface CmpProductTab { key: PayKey; name: string; tag: string; best?: boolean }
export const CMP_PRODUCTS: CmpProductTab[] = [
  { key: 'rent', name: '장기렌트', tag: '보험·세금·정비 올인원', best: true },
  { key: 'lease', name: '리스', tag: '월 납부 부담 완화' },
  { key: 'loan', name: '할부', tag: '내 차로 소유' },
];

export interface CmpRow { label: string; rent: string; lease: string; loan: string; best: PayKey[] }
export const CMP_ROWS: CmpRow[] = [
  { label: '차량 소유권', rent: '렌트사', lease: '리스사', loan: '본인 (완납 후)', best: ['loan'] },
  { label: '초기 비용', rent: '0원부터 가능', lease: '보증금 선택', loan: '차량가 10~30%', best: ['rent'] },
  { label: '월 납부 구성', rent: '렌트료 하나로', lease: '리스료 + 보험', loan: '원금 + 이자', best: ['rent'] },
  { label: '자동차 보험', rent: '렌트료에 포함', lease: '직접 가입', loan: '직접 가입', best: ['rent'] },
  { label: '자동차세', rent: '납부 불필요', lease: '납부 불필요', loan: '매년 납부', best: ['rent', 'lease'] },
  { label: '정비·관리', rent: '포함 선택 가능', lease: '일부 포함', loan: '본인 부담', best: ['rent'] },
  { label: '번호판', rent: '일반 선택 가능', lease: '일반 번호판', loan: '일반 번호판', best: [] },
  { label: '비용 처리', rent: '전액 처리 유리', lease: '처리 가능', loan: '감가상각', best: ['rent'] },
  { label: '신용·부채', rent: '부채 미반영 유리', lease: '부채 반영', loan: '부채 반영', best: ['rent'] },
  { label: '중도 해지', rent: '위약금 발생', lease: '위약금 발생', loan: '잔금 상환', best: [] },
  { label: '만기 후', rent: '반납·인수·교체', lease: '반납·인수', loan: '본인 소유', best: ['rent'] },
  { label: '추천 대상', rent: '초기비용↓·법인', lease: '월 부담↓', loan: '소유 선호', best: [] },
];

export interface CmpWhy { icon: 'shield' | 'price' | 'contract'; h: string; d: string }
export const CMP_WHY: CmpWhy[] = [
  { icon: 'shield', h: '보험·세금·정비 올인원', d: '매달 렌트료 하나로 끝. 따로 챙길 비용이 없어요.' },
  { icon: 'price', h: '초기 비용 0원부터', d: '목돈 없이 시작하고, 월 납부도 가장 낮은 수준이에요.' },
  { icon: 'contract', h: '법인은 경비처리까지', d: '전액 비용 처리가 가능해 법인·개인사업자에게 유리해요.' },
];

// ───────────────────────── 약관 비교 (compare-app terms) ─────────────────────────
export interface CmpFit { key: string; label: string }
export const CMP_FITS: CmpFit[] = [
  { key: 'biz', label: '법인·사업자' },
  { key: 'first', label: '사회초년·첫차' },
  { key: 'high', label: '고신용 우대' },
  { key: 'low', label: '중·저신용 수용' },
];
export const CMP_FIT_LABEL: Record<string, string> = CMP_FITS.reduce<Record<string, string>>((o, f) => {
  o[f.key] = f.label;
  return o;
}, {});

export const CMP_FIN_PRODUCTS: { key: PayKey; label: string }[] = [
  { key: 'rent', label: '장기렌트' },
  { key: 'lease', label: '리스' },
  { key: 'loan', label: '할부' },
];
export const CMP_FIN_LABEL: Record<PayKey, string> = { rent: '장기렌트', lease: '리스', loan: '할부' };

export type FinTerms = Record<string, string>;

// 상품 성격별 약관 베이스(상품마다 다름) — 회사별로 금리·심사 등 일부만 override
function finTerms(product: PayKey, over: FinTerms): FinTerms {
  const base: Record<PayKey, FinTerms> = {
    rent: {
      보증금: '무보증·선납 자유 선택',
      중도해지: '잔여 렌트료 30% 이내 위약금',
      만기: '반납 / 인수 / 재계약',
      주행거리: '연 2만km 약정 · 초과 km당 정산',
      포함: '보험·자동차세·정비 렌트료 포함',
    },
    lease: {
      보증금: '보증금·선납 선택',
      중도해지: '잔여 리스료 비례 위약금',
      만기: '반납 / 인수',
      주행거리: '연 2만km 약정 · 초과 정산',
      포함: '자동차세 포함 · 보험 별도 가입',
    },
    loan: {
      보증금: '선수금 0~30% 선택',
      중도해지: '잔금 상환 시 종료 (위약금 없음)',
      만기: '완납 후 본인 소유',
      주행거리: '제한 없음',
      포함: '보험·정비 본인 부담',
    },
  };
  return { 인도: '평균 2~3주 · 전국 탁송', ...base[product], ...over };
}

export interface FinProductTerms {
  rate: string;
  hidden: boolean;
  best: boolean;
  terms: FinTerms;
}
// 한 상품 데이터 빌더: rate(짧은 금리) + best(그 상품 최저금리 배지) + terms(8항목)
//   ※ 장기렌트는 금리 비공개 — 월 렌트료로만 안내(최저금리 랭킹·금리 수치 미노출)
function finProd(rate: string, opts: { product: PayKey; best?: boolean; over?: FinTerms }): FinProductTerms {
  const isRent = opts.product === 'rent';
  const over: FinTerms = { 금리: '연 ' + rate + ' 기준', ...opts.over };
  if (isRent) over.금리 = '비공개 · 월 렌트료로 안내';
  return {
    rate: isRent ? '비공개' : rate,
    hidden: isRent,
    best: isRent ? false : !!opts.best,
    terms: finTerms(opts.product, over),
  };
}

export interface CmpProvider {
  name: string;
  type: '캐피탈' | '카드사';
  fit: string[];
  company: {
    since: number;
    oneliner: string;
    stats: { k: string; v: string }[];
    strength: string;
  };
  products: Partial<Record<PayKey, FinProductTerms>>;
}

// 캐피탈·카드사별 비교 — 회사소개(공통) + 상품별(products) 금리·약관
export const CMP_PROVIDERS: CmpProvider[] = [
  {
    name: '현대캐피탈',
    type: '캐피탈',
    fit: ['biz', 'low'],
    company: {
      since: 1993,
      oneliner: '국내 1위 자동차 전문 캐피탈. 전 브랜드 신차를 가장 폭넓게 취급해요.',
      stats: [
        { k: '연 취급액', v: '업계 1위' },
        { k: '제휴 차종', v: '전 브랜드' },
        { k: '평균 심사', v: '1영업일' },
      ],
      strength: '신차 재고·심사 속도에서 강점이 크고, 무보증 옵션이 기본이라 첫 장기렌트에 무난해요.',
    },
    products: {
      rent: finProd('6.9%~', { best: true, product: 'rent', over: { 금리: '연 6.9%~ · 보증금·선납 시 우대', 심사: '신용 6등급까지 · 소득서류 간소화 · 법인 가능', 만기: '반납 / 인수(잔존가 매입) / 재계약' } }),
      lease: finProd('7.1%~', { product: 'lease', over: { 심사: '신용 6등급까지 · 법인 가능' } }),
      loan: finProd('7.6%~', { product: 'loan', over: { 심사: '신용 6등급까지 · 법인 가능' } }),
    },
  },
  {
    name: 'KB캐피탈',
    type: '캐피탈',
    fit: ['biz', 'high'],
    company: {
      since: 2004,
      oneliner: 'KB금융 계열. 법인·개인사업자 한도와 금리 우대가 강한 곳이에요.',
      stats: [
        { k: '모기업', v: 'KB금융' },
        { k: '특화', v: '법인 리스' },
        { k: '평균 심사', v: '1~2영업일' },
      ],
      strength: '법인 명의·다대수 계약에서 한도와 금리 우대 폭이 커, 사업자에게 특히 유리해요.',
    },
    products: {
      rent: finProd('7.2%~', { product: 'rent', over: { 심사: '법인·개인사업자 우대 · 재무제표 반영' } }),
      lease: finProd('6.8%~', { best: true, product: 'lease', over: { 금리: '연 6.8%~ · 법인 신용등급 우대', 심사: '법인·개인사업자 우대', 보증금: '보증금형 선택 시 금리 인하폭 큼' } }),
      loan: finProd('7.5%~', { product: 'loan', over: { 심사: '법인·개인사업자 우대' } }),
    },
  },
  {
    name: '신한카드',
    type: '카드사',
    fit: ['first', 'high'],
    company: {
      since: 2007,
      oneliner: '카드 이용실적을 심사·혜택에 연계. 기존 신한 고객에게 유리해요.',
      stats: [
        { k: '유형', v: '카드사' },
        { k: '혜택', v: '포인트 적립' },
        { k: '평균 심사', v: '2~3영업일' },
      ],
      strength: '카드 실적이 좋으면 심사·한도에 가점이 있고 리스료 일부가 포인트로 적립돼요.',
    },
    products: {
      lease: finProd('7.5%~', { product: 'lease', over: { 심사: '카드 이용실적·등급 반영 · 무서류 간편', 포함: '자동차세 포함 · 리스료 포인트 적립' } }),
      loan: finProd('7.3%~', { best: true, product: 'loan', over: { 금리: '연 7.3%~ · 카드 실적 우수 시 우대', 심사: '카드 이용실적 반영 · 무서류', 포함: '보험·정비 본인 부담 · 포인트 적립' } }),
    },
  },
  {
    name: '삼성카드',
    type: '카드사',
    fit: ['first', 'high'],
    company: {
      since: 2006,
      oneliner: '장기 무이자·제휴 프로모션이 잦은 카드사. 행사 타이밍이 핵심이에요.',
      stats: [
        { k: '유형', v: '카드사' },
        { k: '강점', v: '무이자 행사' },
        { k: '평균 심사', v: '2~3영업일' },
      ],
      strength: '시즌 무이자·제휴 행사 시 실부담이 크게 낮아져, 프로모션 시점 계약이 유리해요.',
    },
    products: {
      lease: finProd('7.4%~', { product: 'lease', over: { 심사: '카드 등급 연계 · 간편 심사', 보증금: '선납형 프로모션 위주' } }),
      loan: finProd('6.9%~', { best: true, product: 'loan', over: { 금리: '연 6.9%~ · 무이자 행사 시 실부담↓', 심사: '카드 등급 연계 · 간편 심사', 보증금: '무이자 행사 시 선수금 조건' } }),
    },
  },
  {
    name: '우리금융캐피탈',
    type: '캐피탈',
    fit: ['low', 'biz'],
    company: {
      since: 1996,
      oneliner: '우리금융 계열. 중도해지·단기 전환 등 약정 유연성이 강점이에요.',
      stats: [
        { k: '모기업', v: '우리금융' },
        { k: '강점', v: '유연 약정' },
        { k: '평균 심사', v: '1~2영업일' },
      ],
      strength: '중도해지 위약금 부담이 낮고 단기 전환이 쉬워, 보유 기간이 불확실할 때 좋아요.',
    },
    products: {
      rent: finProd('7.0%~', { best: true, product: 'rent', over: { 금리: '연 7.0%~ · 보증금 비중 따라 우대', 심사: '신용 7등급까지 가능 · 수용 폭 넓음', 중도해지: '위약금 부담 낮음 · 단기 전환 용이', 만기: '반납 / 인수 / 단기 전환' } }),
      lease: finProd('7.3%~', { product: 'lease', over: { 심사: '신용 7등급까지 가능', 중도해지: '잔여 비례 위약금 · 부담 낮음' } }),
    },
  },
  {
    name: '롯데캐피탈',
    type: '캐피탈',
    fit: ['low', 'first'],
    company: {
      since: 1995,
      oneliner: '중고 인수·단기 전환 옵션이 다양해 만기 선택지가 넓어요.',
      stats: [
        { k: '유형', v: '전업 캐피탈' },
        { k: '강점', v: '만기 옵션' },
        { k: '평균 심사', v: '2~3영업일' },
      ],
      strength: '만기 때 중고 인수·전환 선택지가 많아, 차를 오래 탈지 갈아탈지 유연하게 정할 수 있어요.',
    },
    products: {
      rent: finProd('7.3%~', { product: 'rent', over: { 심사: '표준 신용 심사 · 무서류 간편', 만기: '반납 / 인수 / 중고 전환' } }),
      lease: finProd('7.4%~', { product: 'lease', over: { 심사: '표준 신용 심사' } }),
      loan: finProd('7.7%~', { product: 'loan', over: { 심사: '표준 신용 심사' } }),
    },
  },
];

// 약관 전문(상세 시트·매트릭스)에 노출할 항목 순서
export const CMP_DETAIL_KEYS = ['금리', '심사', '보증금', '중도해지', '만기', '인도', '주행거리', '포함'];
export const CMP_TERM_LABELS: Record<string, string> = {
  금리: '금리',
  심사: '심사 기준',
  보증금: '보증금·선납',
  중도해지: '중도 해지',
  만기: '만기 옵션',
  인도: '차량 인도',
  주행거리: '주행거리',
  포함: '포함 항목',
};
export const CMP_RATE_ASOF = '2026년 6월';

// 회사가 취급하는 상품 키 목록 (정의된 순서대로)
export function provFinKeys(p: CmpProvider): PayKey[] {
  return CMP_FIN_PRODUCTS.map((f) => f.key).filter((k) => Boolean(p.products[k]));
}
