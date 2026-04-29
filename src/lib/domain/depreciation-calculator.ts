/**
 * 감가상각 계산기
 *
 * 데이터 출처 및 설계
 * ─────────────────────────────────────────────────────────────────────
 * • 시세: 엔카(encar.com) 2026-W17 수집분 (2021~2025년식, 주행거리 3구간 중간가)
 *   - low  = 0~3만km 중간가 (저주행 프리미엄, 최고가)
 *   - mid  = 3~6만km 중간가
 *   - high = 6~10만km 중간가 (고주행 할인, 최저가)
 * • 신차가(msrp): 제조사 공시 기준, 2025년 시점 수동 기록 (만원)
 * • 이상값은 null 처리 후 주석 표기
 * • Phase 4에서 CODEF 실거래가 API로 대체 예정
 */

// ── 공개 타입 ─────────────────────────────────────────────────────────

/**
 * 주행거리 구간
 * low  = 0~3만km (저주행, 최고가)
 * mid  = 3~6만km
 * high = 6~10만km (고주행, 최저가)
 */
export type MileageGroup = 'low' | 'mid' | 'high';

export type DepreciationCategory =
  | 'domestic_sedan'  // 국산 세단·경차 (아반떼, 쏘나타, 그랜저 등)
  | 'domestic_suv'    // 국산 SUV·MPV (투싼, 싼타페, 카니발 등)
  | 'genesis'         // 제네시스 전 모델
  | 'ev'              // 순수 전기차 (국산·수입 공통)
  | 'import_sedan'    // 수입 세단 (BMW 시리즈, 벤츠 클래스 등)
  | 'import_suv';     // 수입 SUV (X5, GLE 등)

export interface YearPrices {
  low:  number | null;  // 0~3만km 중간가 (만원)
  mid:  number | null;  // 3~6만km 중간가 (만원)
  high: number | null;  // 6~10만km 중간가 (만원)
}

export interface ModelEntry {
  msrp:     number | null;            // 신차 MSRP (만원); null = 미등록
  category: DepreciationCategory;
  brand:    string;
  prices:   Record<number, YearPrices>; // key = 연식 (2021~2025)
}

export interface YearlyRow {
  age:           number;        // 차령 (1~10)
  year:          number;        // 연식
  value:         number;        // 예상 시세 (만원)
  retentionRate: number | null; // 잔존가치율 (msrp 없으면 null)
}

export interface DepreciationResult {
  currentValue:     number;        // 현재 시세 (만원)
  msrp:             number | null; // 신차가 (만원)
  retentionRate:    number | null; // 잔존가치율 (1.0 초과 = 프리미엄)
  depreciationRate: number | null; // 감가율
  mileageGroup:     MileageGroup;  // 계산에 사용된 주행거리 구간
  yearlyTable:      YearlyRow[];   // 1~10년차 잔존가치 테이블 (동일 구간 기준)
  dataSource:       'market' | 'market_trim' | 'fallback';
}

// ── 내부 상수 ─────────────────────────────────────────────────────────

/** 시세 데이터 기준 연도 (새 수집분 반영 시 업데이트) */
const DATA_YEAR = 2026;

/**
 * 카테고리별 연식별 평균 잔존가치율 (엔카 2026-W17 실데이터에서 산출)
 * index 0 = 1년차, index 4 = 5년차
 * 1~2년차가 1.0 초과인 것은 신차 프리미엄(대기수요) 현상
 */
const CATEGORY_RETENTION: Record<DepreciationCategory, number[]> = {
  domestic_sedan: [1.26, 1.17, 1.09, 1.04, 0.92],
  domestic_suv:   [1.22, 1.11, 1.05, 0.95, 0.89],
  genesis:        [0.78, 0.79, 0.71, 0.68, 0.62],
  ev:             [0.92, 0.81, 0.75, 0.70, 0.69],
  import_sedan:   [0.84, 0.86, 0.69, 0.63, 0.58],
  import_suv:     [0.85, 0.85, 0.83, 0.75, 0.68],
};

/** 잔존가치 최저 보장율 (외삽 시 이 값 이하로 내려가지 않음) */
const MIN_RETENTION = 0.15;

/**
 * 주행거리 구간별 시세 보정 계수 (low 기준)
 * 엔카 2026-W17 실데이터 평균: mid/low≈0.91, high/low≈0.83
 * fallback 계산 시 저주행 기준 잔존율에 이 계수를 곱함
 */
const MILEAGE_FACTOR: Record<MileageGroup, number> = {
  low:  1.00,
  mid:  0.91,
  high: 0.83,
};

// ── 시세 테이블 ───────────────────────────────────────────────────────

export const MARKET_PRICE_TABLE: Record<string, ModelEntry> = {

  // ── 현대 ──────────────────────────────────────────────────────────
  '그랜저': {
    msrp: 3_820, category: 'domestic_sedan', brand: '현대',
    prices: {
      2025: { low: 3890, mid: 3820, high: 2620 },
      2024: { low: 3750, mid: 3580, high: 3190 },
      2023: { low: 3570, mid: 3280, high: 3150 },
      2022: { low: 2890, mid: 2740, high: 2520 },
      2021: { low: 2790, mid: 2650, high: 2460 },
    },
  },
  '싼타페': {
    msrp: 3_520, category: 'domestic_suv', brand: '현대',
    prices: {
      2025: { low: 3940, mid: 3570, high: null },
      2024: { low: 3699, mid: 3550, high: 3430 },
      2023: { low: 3790, mid: 3480, high: 2950 },
      2022: { low: 3080, mid: 2900, high: 2580 },
      2021: { low: 2950, mid: 2699, high: 2490 },
    },
  },
  '쏘나타': {
    msrp: 2_580, category: 'domestic_sedan', brand: '현대',
    prices: {
      2025: { low: 2990, mid: 2290, high: 2150 },
      2024: { low: 2950, mid: 2390, high: 2000 },
      2023: { low: 2940, mid: 2620, high: 2120 },
      2022: { low: 2350, mid: 2230, high: 1760 },
      2021: { low: 2190, mid: 2090, high: 1770 },
    },
  },
  '아반떼': {
    msrp: 1_880, category: 'domestic_sedan', brand: '현대',
    prices: {
      2025: { low: 2580, mid: 2590, high: null },
      2024: { low: 2450, mid: 2100, high: 1940 },
      2023: { low: 2290, mid: 2100, high: 1920 },
      2022: { low: 2250, mid: 1999, high: 1785 },
      2021: { low: 1980, mid: 1820, high: 1690 },
    },
  },
  '아이오닉5': {
    msrp: 5_197, category: 'ev', brand: '현대',
    prices: {
      2025: { low: 5850, mid: 4440, high: null },
      2024: { low: 3950, mid: 3770, high: 3190 },
      2023: { low: 3950, mid: 3718, high: 3100 },
      2022: { low: 3250, mid: 3400, high: 3090 },
      2021: { low: 3140, mid: 2999, high: 2899 },
    },
  },
  '아이오닉6': {
    msrp: 5_195, category: 'ev', brand: '현대',
    prices: {
      2025: { low: 4350, mid: null,  high: 3150 },
      2024: { low: 4290, mid: null,  high: 3090 },
      2023: { low: 3790, mid: 3590, high: 3370 },
      2022: { low: 3495, mid: 3450, high: 3100 },
      2021: { low: null,  mid: null,  high: null  },
    },
  },
  '캐스퍼': {
    msrp: 1_500, category: 'domestic_sedan', brand: '현대',
    prices: {
      2025: { low: 2399, mid: 1560, high: null },
      2024: { low: 1860, mid: 1680, high: 1550 },
      2023: { low: 1660, mid: 1580, high: 1390 },
      2022: { low: 1610, mid: 1560, high: 1430 },
      2021: { low: 1570, mid: 1520, high: 1400 },
    },
  },
  '코나': {
    msrp: 2_415, category: 'domestic_suv', brand: '현대',
    prices: {
      2025: { low: 2930, mid: 3099, high: null },
      2024: { low: 2790, mid: 2630, high: 2340 },
      2023: { low: 2730, mid: 2610, high: 2450 },
      2022: { low: 2320, mid: 2370, high: 1950 },
      2021: { low: 2100, mid: 2120, high: 1880 },
    },
  },
  '투싼': {
    msrp: 2_695, category: 'domestic_suv', brand: '현대',
    prices: {
      2025: { low: 3250, mid: 3599, high: null },
      2024: { low: 3200, mid: 2990, high: 2689 },
      2023: { low: 2850, mid: 2599, high: 2490 },
      2022: { low: 2690, mid: 2589, high: 2280 },
      2021: { low: 2570, mid: 2500, high: 2350 },
    },
  },
  '팰리세이드': {
    msrp: 4_380, category: 'domestic_suv', brand: '현대',
    prices: {
      2025: { low: 5890, mid: 5630, high: null },
      2024: { low: 3790, mid: 3820, high: 3750 },
      2023: { low: 4050, mid: 3950, high: 3770 },
      2022: { low: 3650, mid: 3350, high: 3099 },
      2021: { low: 3050, mid: 3050, high: 2880 },
    },
  },
  '스타리아': {
    msrp: 3_070, category: 'domestic_suv', brand: '현대',
    prices: {
      2025: { low: 3490, mid: 2900, high: 3920 },
      2024: { low: 3390, mid: 3199, high: 2800 },
      2023: { low: 3240, mid: 2750, high: 2599 },
      2022: { low: 2890, mid: 2950, high: 2660 },
      2021: { low: 2880, mid: 2990, high: 2750 },
    },
  },
  '넥쏘': {
    msrp: 6_890, category: 'ev', brand: '현대',
    prices: {
      2025: { low: 4390, mid: null,  high: null  },
      2024: { low: 2650, mid: null,  high: null  },
      2023: { low: 2480, mid: 2260, high: 2150 },
      2022: { low: 1950, mid: 2150, high: 1899 },
      2021: { low: null,  mid: 2150, high: 1850 },
    },
  },

  // ── 기아 ──────────────────────────────────────────────────────────
  'K3': {
    msrp: 1_836, category: 'domestic_sedan', brand: '기아',
    prices: {
      2025: { low: null,  mid: null,  high: null  },
      2024: { low: 2220, mid: 2150, high: 1510 },
      2023: { low: 2090, mid: 1990, high: 1750 },
      2022: { low: 2450, mid: 1835, high: 1630 },
      2021: { low: 1900, mid: 1790, high: 1550 },
    },
  },
  'K5': {
    msrp: 2_625, category: 'domestic_sedan', brand: '기아',
    prices: {
      2025: { low: 3190, mid: 3349, high: null },
      2024: { low: 3060, mid: 2920, high: 2250 },
      2023: { low: 2850, mid: 2580, high: 2450 },
      2022: { low: 2590, mid: 2480, high: 2150 },
      2021: { low: 2390, mid: 2200, high: 1990 },
    },
  },
  'K8': {
    msrp: 3_765, category: 'domestic_sedan', brand: '기아',
    prices: {
      2025: { low: 3950, mid: 3600, high: null },
      2024: { low: 3690, mid: 3110, high: 2550 },
      2023: { low: 3090, mid: 3000, high: 2719 },
      2022: { low: 3120, mid: 2750, high: 2499 },
      2021: { low: 2930, mid: 2570, high: 2490 },
    },
  },
  'K9': {
    msrp: 5_920, category: 'domestic_sedan', brand: '기아',
    prices: {
      2025: { low: 5680, mid: null,  high: null  },
      2024: { low: 5250, mid: 4750, high: 4489 },
      2023: { low: 4550, mid: 4380, high: 4090 },
      2022: { low: 4399, mid: 4190, high: 3799 },
      2021: { low: 4130, mid: 3450, high: 3550 },
    },
  },
  'EV3': {
    msrp: 3_996, category: 'ev', brand: '기아',
    prices: {
      2025: { low: 3690, mid: 3330, high: null },
      2024: { low: 3750, mid: 3790, high: 3320 },
      2023: { low: null,  mid: null,  high: null  },
      2022: { low: null,  mid: null,  high: null  },
      2021: { low: null,  mid: null,  high: null  },
    },
  },
  'EV6': {
    msrp: 5_019, category: 'ev', brand: '기아',
    prices: {
      2025: { low: 5450, mid: 3830, high: 3550 },
      2024: { low: 4120, mid: 4130, high: 3390 },
      2023: { low: 3899, mid: 3590, high: 3490 },
      2022: { low: 3660, mid: 3399, high: 3199 },
      2021: { low: 3550, mid: 3390, high: 3189 },
    },
  },
  'EV9': {
    msrp: 7_660, category: 'ev', brand: '기아',
    prices: {
      2025: { low: 5969, mid: null,  high: null  },
      2024: { low: 5490, mid: 5550, high: 5950 },
      2023: { low: 6350, mid: 5850, high: 5299 },
      2022: { low: null,  mid: null,  high: null  },
      2021: { low: null,  mid: null,  high: null  },
    },
  },
  '레이': {
    msrp: 1_580, category: 'domestic_sedan', brand: '기아',
    prices: {
      2025: { low: 1840, mid: 1750, high: null },
      2024: { low: 1730, mid: 1620, high: 1600 },
      2023: { low: 1630, mid: 1580, high: 1330 },
      2022: { low: 1450, mid: 1330, high: 1140 },
      2021: { low: 1383, mid: 1290, high:  910 },
    },
  },
  '모닝': {
    msrp: 1_346, category: 'domestic_sedan', brand: '기아',
    prices: {
      2025: { low: 1690, mid: null,  high: null  },
      2024: { low: 1630, mid: 1620, high: 1999 },
      2023: { low: 1540, mid: 1459, high: 1350 },
      2022: { low: 1390, mid: 1250, high: 1250 },
      2021: { low: 1090, mid: 1180, high: 1050 },
    },
  },
  '모하비': {
    msrp: 4_901, category: 'domestic_suv', brand: '기아',
    prices: {
      2025: { low: null,  mid: null,  high: null  },
      2024: { low: 4950, mid: 4590, high: 4620 },
      2023: { low: 4670, mid: 4320, high: 4040 },
      2022: { low: 4390, mid: 4020, high: 3600 },
      2021: { low: 4077, mid: 3650, high: 3430 },
    },
  },
  '셀토스': {
    msrp: 2_342, category: 'domestic_suv', brand: '기아',
    prices: {
      2025: { low: 2690, mid: 2350, high: null },
      2024: { low: 2740, mid: 2499, high: 2529 },
      2023: { low: 2600, mid: 2555, high: 2299 },
      2022: { low: 2390, mid: 2290, high: 2020 },
      2021: { low: 2150, mid: 2080, high: 1850 },
    },
  },
  '스팅어': {
    msrp: 4_350, category: 'domestic_sedan', brand: '기아',
    prices: {
      2025: { low: null,  mid: null,  high: null  },
      2024: { low: null,  mid: null,  high: null  },
      2023: { low: 3490, mid: 4199, high: 3550 },
      2022: { low: 3130, mid: 3420, high: 2970 },
      2021: { low: 3250, mid: 2990, high: 2840 },
    },
  },
  '스포티지': {
    msrp: 2_681, category: 'domestic_suv', brand: '기아',
    prices: {
      2025: { low: 3750, mid: 3440, high: null },
      2024: { low: 3250, mid: 2790, high: 2750 },
      2023: { low: 3030, mid: 2880, high: 2690 },
      2022: { low: 2850, mid: 2730, high: 2460 },
      2021: { low: 2790, mid: 2610, high: 2440 },
    },
  },
  '쏘렌토': {
    msrp: 3_587, category: 'domestic_suv', brand: '기아',
    prices: {
      2025: { low: 4130, mid: 4070, high: null },
      2024: { low: 4100, mid: 3990, high: 3690 },
      2023: { low: 3830, mid: 3550, high: 3269 },
      2022: { low: 3390, mid: 3210, high: 2900 },
      2021: { low: 3330, mid: 2999, high: 2790 },
    },
  },
  '카니발': {
    msrp: 3_618, category: 'domestic_suv', brand: '기아',
    prices: {
      2025: { low: 4380, mid: 4650, high: null },
      2024: { low: 4390, mid: 4240, high: 3950 },
      2023: { low: 3530, mid: 3380, high: 3040 },
      2022: { low: 3390, mid: 3250, high: 2890 },
      2021: { low: 3290, mid: 3099, high: 2750 },
    },
  },

  // ── 제네시스 ───────────────────────────────────────────────────────
  'G70': {
    msrp: 4_716, category: 'genesis', brand: '제네시스',
    prices: {
      2025: { low: 4590, mid: null,  high: null  },
      2024: { low: 3970, mid: 3800, high: null  },
      2023: { low: 3830, mid: 3510, high: 3050 },
      2022: { low: 3590, mid: 3299, high: 2799 },
      2021: { low: 3350, mid: 3250, high: 2950 },
    },
  },
  'G80': {
    msrp: 7_314, category: 'genesis', brand: '제네시스',
    prices: {
      2025: { low: 5950, mid: 5750, high: null },
      2024: { low: 5699, mid: 5200, high: 4890 },
      2023: { low: 4700, mid: 4450, high: 3960 },
      2022: { low: 4380, mid: 4199, high: 3690 },
      2021: { low: 4290, mid: 3940, high: 3490 },
    },
  },
  'G90': {
    msrp: 16_000, category: 'genesis', brand: '제네시스',
    prices: {
      2025: { low: 8300, mid: null,  high: 7350 },
      2024: { low: 7799, mid: 7599, high: 6790 },
      2023: { low: 8250, mid: 7117, high: 6320 },
      2022: { low: 7490, mid: 7190, high: 6590 },
      2021: { low: null,  mid: 4590, high: 4159 },  // 저주행 매물 없음
    },
  },
  'GV60': {
    msrp: 5_907, category: 'ev', brand: '제네시스',
    prices: {
      // 2025: 2매물, 0~3만km=8,232만원 → 신차가 초과로 이상값 처리
      2025: { low: null,  mid: null,  high: null  },
      2024: { low: 6020, mid: 5586, high: null  },
      2023: { low: 4990, mid: 5190, high: 4850 },
      2022: { low: 5260, mid: 4590, high: 4099 },
      2021: { low: 4329, mid: 4390, high: 3999 },
    },
  },
  'GV70': {
    msrp: 6_178, category: 'genesis', brand: '제네시스',
    prices: {
      2025: { low: 5350, mid: 5599, high: null },
      2024: { low: 5170, mid: 4590, high: 3590 },
      2023: { low: 4600, mid: 4350, high: 3940 },
      2022: { low: 4460, mid: 4190, high: 3850 },
      2021: { low: 4090, mid: 3899, high: 3600 },
    },
  },
  'GV80': {
    msrp: 9_184, category: 'genesis', brand: '제네시스',
    prices: {
      2025: { low: 6820, mid: 6740, high: null },
      2024: { low: 6790, mid: 6580, high: 5900 },
      2023: { low: 6250, mid: 5750, high: 5250 },
      2022: { low: 5690, mid: 5200, high: 4830 },
      2021: { low: 4890, mid: 4850, high: 4499 },
    },
  },

  // ── 테슬라 ────────────────────────────────────────────────────────
  '모델 Y': {
    msrp: 5_999, category: 'ev', brand: '테슬라',
    prices: {
      2025: { low: 5070, mid: 5125, high: null },
      2024: { low: 4490, mid: 3870, high: 3680 },
      2023: { low: 4050, mid: 3780, high: 3750 },
      2022: { low: 4740, mid: 4390, high: 3850 },
      2021: { low: 4800, mid: 3850, high: 3690 },
    },
  },
  '모델 3': {
    msrp: 5_299, category: 'ev', brand: '테슬라',
    prices: {
      2025: { low: 4550, mid: null,  high: null  },
      2024: { low: 4490, mid: 4700, high: null  },
      2023: { low: null,  mid: 3749, high: null  },
      2022: { low: 3730, mid: 3399, high: 3099 },
      2021: { low: null,  mid: 3390, high: 3150 },
    },
  },

  // ── BMW ───────────────────────────────────────────────────────────
  '3시리즈': {
    msrp: 5_380, category: 'import_sedan', brand: 'BMW',
    prices: {
      2025: { low: 4200, mid: 4790, high: null },
      2024: { low: 4390, mid: 4690, high: 5690 },  // t3 높음은 특정 트림 반영
      2023: { low: 4250, mid: 3999, high: 3490 },
      2022: { low: 3500, mid: 3390, high: 3200 },
      2021: { low: 3390, mid: 3250, high: 2990 },
    },
  },
  '5시리즈': {
    msrp: 7_490, category: 'import_sedan', brand: 'BMW',
    prices: {
      2025: { low: 6680, mid: 6250, high: null },
      2024: { low: 6400, mid: 5990, high: 5549 },
      2023: { low: 4725, mid: 4390, high: 3980 },
      2022: { low: 4390, mid: 4120, high: 3850 },
      2021: { low: 4030, mid: 3950, high: 3680 },
    },
  },
  'X5': {
    msrp: 9_960, category: 'import_suv', brand: 'BMW',
    prices: {
      2025: { low: 7500, mid: 6948, high: null },
      2024: { low: 7900, mid: 8700, high: null },  // t2>t1은 트림 구성 차이
      2023: { low: 8500, mid: 7990, high: 7190 },
      2022: { low: 7950, mid: 7300, high: 6690 },
      2021: { low: 7080, mid: 6860, high: 6130 },
    },
  },
  // MSRP 미등록 BMW — 절대 시세 조회용
  'X3': {
    msrp: null, category: 'import_suv', brand: 'BMW',
    prices: {
      2025: { low: 7750, mid: 7550, high: null },
      2024: { low: 6499, mid: 5250, high: null },
      2023: { low: 6250, mid: 5500, high: 4830 },
      2022: { low: 5650, mid: 4650, high: 4540 },
      2021: { low: 4899, mid: 4500, high: 3980 },
    },
  },
  'X6': {
    msrp: null, category: 'import_suv', brand: 'BMW',
    prices: {
      2025: { low: 7340, mid: null,  high: null  },
      2024: { low: null,  mid: 8600, high: 8500 },
      2023: { low: 8700, mid: 8008, high: 7950 },
      2022: { low: 8290, mid: 7550, high: 7190 },
      2021: { low: 7750, mid: 7100, high: 6300 },
    },
  },
  'X4': {
    msrp: null, category: 'import_suv', brand: 'BMW',
    prices: {
      2025: { low: 6950, mid: null,  high: null  },
      2024: { low: 5950, mid: 5790, high: null  },
      2023: { low: 5780, mid: 5490, high: 4720 },
      2022: { low: 5490, mid: 4850, high: 4700 },
      2021: { low: 4800, mid: 4380, high: 4000 },
    },
  },
  '1시리즈': {
    msrp: null, category: 'import_sedan', brand: 'BMW',
    prices: {
      2025: { low: 4000, mid: null,  high: null  },
      2024: { low: 3230, mid: 3180, high: null  },
      2023: { low: 2950, mid: 2770, high: 2640 },
      2022: { low: 2799, mid: 2699, high: 3050 },
      2021: { low: 2990, mid: 2640, high: 2390 },
    },
  },
  '4시리즈': {
    msrp: null, category: 'import_sedan', brand: 'BMW',
    prices: {
      2025: { low: 5400, mid: null,  high: null  },
      2024: { low: 5650, mid: 4390, high: null  },
      2023: { low: 4799, mid: 5080, high: 4250 },
      2022: { low: 4780, mid: 4390, high: 4057 },
      2021: { low: 5399, mid: 4150, high: 3999 },
    },
  },
  'i4': {
    msrp: null, category: 'ev', brand: 'BMW',
    prices: {
      2025: { low: 5890, mid: null,  high: null  },
      2024: { low: 5550, mid: 5400, high: 4750 },
      2023: { low: 5380, mid: 5150, high: 4400 },
      2022: { low: 5290, mid: 4750, high: 4400 },
      2021: { low: null,  mid: null,  high: null  },
    },
  },
  'i5': {
    msrp: null, category: 'ev', brand: 'BMW',
    prices: {
      2025: { low: 7390, mid: null,  high: null  },
      2024: { low: 8300, mid: 6700, high: 6300 },
      2023: { low: 6550, mid: 6700, high: null  },
      2022: { low: null,  mid: null,  high: null  },
      2021: { low: null,  mid: null,  high: null  },
    },
  },

  // ── 벤츠 ──────────────────────────────────────────────────────────
  'E-클래스': {
    msrp: 7_460, category: 'import_sedan', brand: '벤츠',
    prices: {
      2025: { low: 6400, mid: 5400, high: null },
      2024: { low: 6690, mid: 6499, high: 6450 },
      2023: { low: 4900, mid: 4750, high: 4290 },
      2022: { low: 4780, mid: 4390, high: 3990 },
      2021: { low: 4300, mid: 3999, high: 3690 },
    },
  },
  'S-클래스': {
    // 2025 0~3만km = 1,484만원 → 신차가(15,990) 대비 명백한 이상값, null 처리
    msrp: 15_990, category: 'import_sedan', brand: '벤츠',
    prices: {
      2025: { low: null,  mid: null,  high: null  },
      2024: { low: 6958, mid: 7984, high: 8850 },
      2023: { low: 6652, mid: 8849, high: 8550 },
      2022: { low: 8700, mid: 8500, high: 8250 },
      2021: { low: null,  mid: 8590, high: 8090 },
    },
  },
  'GLE-클래스': {
    msrp: 11_090, category: 'import_suv', brand: '벤츠',
    prices: {
      2025: { low: 7975, mid: 8500, high: null },
      2024: { low: 8500, mid: 8675, high: 8150 },
      2023: { low: 8540, mid: 8350, high: 7650 },
      2022: { low: 8100, mid: 7659, high: 6990 },
      2021: { low: 7650, mid: 6990, high: 6390 },
    },
  },
  'GLC-클래스': {
    msrp: 7_190, category: 'import_suv', brand: '벤츠',
    prices: {
      2025: { low: 7800, mid: 6700, high: null },
      2024: { low: 7050, mid: 6900, high: 6540 },
      2023: { low: 6150, mid: 5600, high: 5100 },
      2022: { low: 5150, mid: 4880, high: 4440 },
      2021: { low: 4650, mid: 4350, high: 4149 },
    },
  },
  // MSRP 미등록 벤츠
  'C-클래스': {
    msrp: null, category: 'import_sedan', brand: '벤츠',
    prices: {
      2025: { low: 4840, mid: null,  high: null  },
      2024: { low: 4650, mid: 4570, high: null  },
      2023: { low: 4650, mid: 4639, high: 4250 },
      2022: { low: 4450, mid: 4230, high: 3990 },
      2021: { low: 3700, mid: 3050, high: 2900 },
    },
  },
  'A-클래스': {
    msrp: null, category: 'import_sedan', brand: '벤츠',
    prices: {
      2025: { low: 3450, mid: null,  high: null  },
      2024: { low: 3340, mid: 3090, high: null  },
      2023: { low: 3699, mid: 2780, high: 3250 },
      2022: { low: 2970, mid: 2700, high: 2499 },
      2021: { low: 2530, mid: 2550, high: 2400 },
    },
  },
  'GLB-클래스': {
    msrp: null, category: 'import_suv', brand: '벤츠',
    prices: {
      2025: { low: 5690, mid: null,  high: null  },
      2024: { low: 4790, mid: 4620, high: null  },
      2023: { low: 4470, mid: 4199, high: 3680 },
      2022: { low: 4150, mid: 3950, high: 3700 },
      2021: { low: 3720, mid: 3450, high: 3250 },
    },
  },
  'GLA-클래스': {
    msrp: null, category: 'import_suv', brand: '벤츠',
    prices: {
      2025: { low: 4830, mid: null,  high: null  },
      2024: { low: 4290, mid: 4090, high: null  },
      2023: { low: 4390, mid: 3950, high: null  },
      2022: { low: 4000, mid: 3880, high: 3370 },
      2021: { low: 3590, mid: 3220, high: 2990 },
    },
  },
  'EQE': {
    msrp: null, category: 'ev', brand: '벤츠',
    prices: {
      2025: { low: 8700, mid: null,  high: null  },
      2024: { low: 7300, mid: null,  high: null  },
      2023: { low: 6999, mid: 5920, high: 5280 },
      2022: { low: 5450, mid: 5380, high: 4730 },
      2021: { low: null,  mid: null,  high: null  },
    },
  },
  'EQA': {
    msrp: null, category: 'ev', brand: '벤츠',
    prices: {
      2025: { low: 5090, mid: null,  high: null  },
      2024: { low: 4950, mid: 2200, high: null  },  // t2=2200 이상값 가능성 있으나 유지
      2023: { low: 4250, mid: 3835, high: 3280 },
      2022: { low: 3799, mid: 3580, high: 3320 },
      2021: { low: 3450, mid: 3600, high: 2960 },
    },
  },
};

// ── 내부 헬퍼 ─────────────────────────────────────────────────────────

/**
 * 지정 주행거리 구간의 시세를 반환한다.
 * 해당 구간이 null이면 인접 구간으로 fallback.
 * low  → mid → high
 * mid  → low → high
 * high → mid → low
 */
function getTierPrice(p: YearPrices | undefined, tier: MileageGroup): number | null {
  if (!p) return null;
  if (tier === 'low')  return p.low  ?? p.mid  ?? p.high ?? null;
  if (tier === 'mid')  return p.mid  ?? p.low  ?? p.high ?? null;
  return                      p.high ?? p.mid  ?? p.low  ?? null;
}

/**
 * 5년차 초과 구간을 선형 외삽한다.
 * 4년차→5년차 기울기를 유지하되, msrp의 MIN_RETENTION 이하로 떨어지지 않도록 보정.
 */
function extrapolatePrice(entry: ModelEntry, age: number, tier: MileageGroup): number {
  const price4 = getTierPrice(entry.prices[DATA_YEAR - 4], tier);
  const price5 = getTierPrice(entry.prices[DATA_YEAR - 5], tier);
  if (price4 === null || price5 === null) return 0;
  const slope = price5 - price4;
  const raw = price5 + slope * (age - 5);
  const floor = entry.msrp ? entry.msrp * MIN_RETENTION : price5 * 0.5;
  return Math.max(Math.round(raw), Math.round(floor));
}

/** 카테고리 fallback 잔존가치율을 반환한다 (6년차 이상은 4→5년차 기울기로 외삽) */
function getCategoryRetention(category: DepreciationCategory, age: number): number {
  const rates = CATEGORY_RETENTION[category];
  if (age <= 5) return rates[age - 1];
  const slope = rates[4] - rates[3];
  return Math.max(rates[4] + slope * (age - 5), MIN_RETENTION);
}

/** 모델 데이터로 1~10년차 잔존가치 테이블을 생성한다 */
function buildYearlyTable(entry: ModelEntry, tier: MileageGroup): YearlyRow[] {
  const rows: YearlyRow[] = [];
  for (let age = 1; age <= 10; age++) {
    const year = DATA_YEAR - age;
    let value: number;
    if (age <= 5) {
      const rep = getTierPrice(entry.prices[year], tier);
      if (rep !== null) {
        value = rep;
      } else {
        // 인접 연식으로 선형 보간
        const prev = getTierPrice(entry.prices[year + 1], tier);
        const next = getTierPrice(entry.prices[year - 1], tier);
        value = Math.round(((prev ?? 0) + (next ?? 0)) / (prev && next ? 2 : 1));
      }
    } else {
      value = extrapolatePrice(entry, age, tier);
    }
    const retentionRate = (entry.msrp && value)
      ? Math.round((value / entry.msrp) * 1000) / 1000
      : null;
    rows.push({ age, year, value, retentionRate });
  }
  return rows;
}

/** Fallback: 카테고리 평균 감가율로 결과를 계산한다 */
function calcFallback(
  category: DepreciationCategory,
  msrp: number | undefined,
  vehicleAge: number,
  tier: MileageGroup,
): DepreciationResult {
  const factor = MILEAGE_FACTOR[tier];
  const retention = getCategoryRetention(category, vehicleAge) * factor;
  const currentValue = msrp ? Math.round(msrp * retention) : 0;
  const retentionRate = msrp ? Math.round(retention * 1000) / 1000 : null;
  const depreciationRate = retentionRate !== null
    ? Math.round((1 - retentionRate) * 1000) / 1000
    : null;

  const yearlyTable: YearlyRow[] = Array.from({ length: 10 }, (_, i) => {
    const age = i + 1;
    const r = getCategoryRetention(category, age) * factor;
    const val = msrp ? Math.round(msrp * r) : 0;
    return {
      age,
      year: DATA_YEAR - age,
      value: val,
      retentionRate: msrp ? Math.round(r * 1000) / 1000 : null,
    };
  });

  return { currentValue, msrp: msrp ?? null, retentionRate, depreciationRate, mileageGroup: tier, yearlyTable, dataSource: 'fallback' };
}

// ── 공개 계산 함수 ────────────────────────────────────────────────────

/**
 * 모델명과 차령으로 감가상각을 계산한다.
 *
 * @param modelName         MARKET_PRICE_TABLE의 모델명
 * @param vehicleAge        차령 (년, 소수 가능 — 예: 2.5)
 * @param mileageGroup      주행거리 구간 (기본: 'low' = 0~3만km 기준)
 * @param fallbackCategory  테이블에 없을 때 사용할 카테고리 (기본: domestic_sedan)
 * @param fallbackMsrp      테이블에 없을 때 사용할 신차가 (만원)
 * @param customPrices      DB에서 조회한 연식별 시세 — 제공 시 MARKET_PRICE_TABLE 대신 사용
 */
export function calculateDepreciation(
  modelName: string,
  vehicleAge: number,
  mileageGroup: MileageGroup = 'low',
  fallbackCategory: DepreciationCategory = 'domestic_sedan',
  fallbackMsrp?: number,
  customPrices?: Record<number, YearPrices>,
): DepreciationResult {
  const tableEntry = MARKET_PRICE_TABLE[modelName];
  const entry: ModelEntry | undefined = customPrices
    ? {
        msrp:     tableEntry?.msrp ?? fallbackMsrp ?? null,
        category: tableEntry?.category ?? fallbackCategory,
        brand:    tableEntry?.brand ?? '',
        // 테이블 연식 기반으로 DB 데이터를 덮어씀 — DB에 없는 연식은 테이블 값 유지
        prices:   { ...tableEntry?.prices, ...customPrices },
      }
    : tableEntry;

  if (!entry) {
    return calcFallback(fallbackCategory, fallbackMsrp, vehicleAge, mileageGroup);
  }

  // ① 5년차 초과: 외삽
  if (vehicleAge > 5) {
    const currentValue = extrapolatePrice(entry, vehicleAge, mileageGroup);
    const retentionRate = (entry.msrp && currentValue)
      ? Math.round((currentValue / entry.msrp) * 1000) / 1000
      : null;
    const depreciationRate = retentionRate !== null
      ? Math.round((1 - retentionRate) * 1000) / 1000
      : null;
    return {
      currentValue,
      msrp: entry.msrp,
      retentionRate,
      depreciationRate,
      mileageGroup,
      yearlyTable: buildYearlyTable(entry, mileageGroup),
      dataSource: 'market',
    };
  }

  // ② 1~5년차: 선형 보간
  const exactYear = DATA_YEAR - vehicleAge;
  const lowerYear = Math.floor(exactYear);
  const upperYear = Math.ceil(exactYear);
  const fraction = exactYear - lowerYear;

  const loRep = getTierPrice(entry.prices[lowerYear], mileageGroup);
  const hiRep = getTierPrice(entry.prices[upperYear], mileageGroup);

  let currentValue: number;
  if (loRep !== null && hiRep !== null) {
    currentValue = Math.round(loRep + (hiRep - loRep) * fraction);
  } else if (hiRep !== null) {
    currentValue = hiRep;
  } else if (loRep !== null) {
    currentValue = loRep;
  } else {
    // 해당 연식·구간 데이터 없음 → fallback
    return calcFallback(
      entry.category,
      entry.msrp ?? fallbackMsrp,
      vehicleAge,
      mileageGroup,
    );
  }

  const retentionRate = (entry.msrp && currentValue)
    ? Math.round((currentValue / entry.msrp) * 1000) / 1000
    : null;
  const depreciationRate = retentionRate !== null
    ? Math.round((1 - retentionRate) * 1000) / 1000
    : null;

  return {
    currentValue,
    msrp: entry.msrp,
    retentionRate,
    depreciationRate,
    mileageGroup,
    yearlyTable: buildYearlyTable(entry, mileageGroup),
    dataSource: 'market',
  };
}

/**
 * 1~10년차 잔존가치 곡선을 반환한다.
 * 6~10년차는 4→5년차 기울기로 외삽. 차트/리포트 UI에서 사용.
 *
 * @param modelName         MARKET_PRICE_TABLE의 모델명
 * @param mileageGroup      주행거리 구간 (기본: 'low')
 * @param fallbackCategory  없을 때 카테고리
 * @param fallbackMsrp      없을 때 신차가
 * @param customPrices      DB에서 조회한 연식별 시세 — 제공 시 MARKET_PRICE_TABLE 대신 사용
 */
export function getDepreciationCurve(
  modelName: string,
  mileageGroup: MileageGroup = 'low',
  fallbackCategory: DepreciationCategory = 'domestic_sedan',
  fallbackMsrp?: number,
  customPrices?: Record<number, YearPrices>,
): YearlyRow[] {
  const tableEntry = MARKET_PRICE_TABLE[modelName];
  const entry: ModelEntry | undefined = customPrices
    ? {
        msrp:     tableEntry?.msrp ?? fallbackMsrp ?? null,
        category: tableEntry?.category ?? fallbackCategory,
        brand:    tableEntry?.brand ?? '',
        prices:   { ...tableEntry?.prices, ...customPrices },
      }
    : tableEntry;
  if (!entry) {
    return calcFallback(fallbackCategory, fallbackMsrp, 1, mileageGroup).yearlyTable;
  }
  return buildYearlyTable(entry, mileageGroup);
}

/**
 * /api/used-prices에서 DB 실측 시세를 조회한다 (브라우저 클라이언트 전용).
 * 데이터 없거나 오류 시 null 반환 — 호출부에서 MARKET_PRICE_TABLE으로 폴백.
 */
export async function fetchDbPrices(
  brand: string,
  model: string,
): Promise<Record<number, YearPrices> | null> {
  try {
    const params = new URLSearchParams({ brand, model });
    const res = await fetch(`/api/used-prices?${params.toString()}`);
    if (!res.ok) return null;
    const json = await res.json() as { status: string; prices: Record<number, YearPrices> | null };
    return json.status === 'ok' ? json.prices : null;
  } catch {
    return null;
  }
}

/**
 * CODEF 실거래가 API 연동 시세 보정 — Phase 4 구현 예정
 * 현재는 null 반환 (호출부에서 calculateDepreciation() 결과 사용)
 *
 * TODO: CODEF API 연동 후 실거래가 기반 보정값 반환
 */
export function adjustWithMarketPrice(
  _modelName: string,
  _vehicleAge: number,
): DepreciationResult | null {
  return null;
}

// ── Phase 1: vehicle_msrp DB 연동 ────────────────────────────────────

/** vehicle_msrp 테이블 단건 행 */
export interface TrimMsrpResult {
  trim_name:  string;
  msrp_price: number;
  fuel_type:  string;
  model_year: number;
}

/** getModelMsrpFromDB 반환 타입 */
export interface MsrpLookupResult {
  msrp:   number | null;
  source: 'db' | 'fallback';
}

/**
 * vehicle_msrp DB에서 특정 모델(+트림)의 신차가를 조회한다.
 * 클라이언트 사이드(브라우저)에서 호출한다.
 *
 * - 트림이 주어지면 해당 트림 신차가를 반환
 * - 트림 미지정 시 가장 저렴한 트림 기준
 * - DB 조회 실패 시 MARKET_PRICE_TABLE의 하드코딩 값으로 fallback
 *
 * @param brand  브랜드명 (예: '현대')
 * @param model  모델명  (예: '아반떼') — MARKET_PRICE_TABLE 키와 동일
 * @param trim   트림명  (예: '스마트') — 미지정 시 최저 트림
 */
export async function getModelMsrpFromDB(
  brand: string,
  model: string,
  trim?: string,
): Promise<MsrpLookupResult> {
  try {
    const params = new URLSearchParams({ brand, model });
    if (trim) params.set('trim', trim);

    // 브라우저는 서버의 Cache-Control: max-age=86400 헤더를 따름
    const res = await fetch(`/api/vehicle-msrp?${params.toString()}`);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json = await res.json();

    if (trim) {
      // 단건 응답: { trim_name, msrp_price, ... }
      const row = json as TrimMsrpResult;
      return { msrp: row.msrp_price ?? null, source: 'db' };
    }

    // 목록 응답: { trims: [...] } — 최저가 트림 사용
    const trims = (json.trims ?? []) as TrimMsrpResult[];
    if (trims.length === 0) throw new Error('트림 없음');
    const lowest = trims.reduce((a, b) => (a.msrp_price < b.msrp_price ? a : b));
    return { msrp: lowest.msrp_price, source: 'db' };
  } catch {
    // DB 조회 실패 → MARKET_PRICE_TABLE 하드코딩 fallback
    const fallback = MARKET_PRICE_TABLE[model]?.msrp ?? null;
    return { msrp: fallback, source: 'fallback' };
  }
}

/**
 * 트림별 정확한 신차가를 사용해 감가상각을 계산한다.
 * DB 조회는 호출부에서 먼저 수행하고, 이 함수에 결과를 전달한다.
 *
 * 기존 calculateDepreciation()과의 차이:
 *   - msrp를 MARKET_PRICE_TABLE 대표가 대신 trimMsrp로 교체
 *   - 시세(currentValue)는 동일한 Encar 실데이터 사용
 *   - dataSource가 'market_trim'으로 표시됨
 *
 * Phase 1 UI 흐름:
 *   브랜드 → 모델 → 트림 드롭다운 선택
 *   → getModelMsrpFromDB() 호출
 *   → trimMsrp를 이 함수에 전달
 *   → 결과 렌더링
 *
 * TODO(Phase 2): 차량번호 입력 → car365 API → 차종/트림 자동 매칭 → 동일 계산
 *
 * @param modelName         MARKET_PRICE_TABLE 키 (예: '아반떼')
 * @param trimMsrp          트림 신차가 (만원) — getModelMsrpFromDB() 결과
 * @param vehicleAge        차령 (년, 소수 가능 — 예: 2.5)
 * @param mileageGroup      주행거리 구간 (기본: 'low')
 * @param fallbackCategory  테이블 미등록 시 카테고리 (기본: domestic_sedan)
 * @param customPrices      DB에서 조회한 연식별 시세 — 제공 시 MARKET_PRICE_TABLE 대신 사용
 */
export function calculateDepreciationWithTrim(
  modelName: string,
  trimMsrp: number,
  vehicleAge: number,
  mileageGroup: MileageGroup = 'low',
  fallbackCategory: DepreciationCategory = 'domestic_sedan',
  customPrices?: Record<number, YearPrices>,
): DepreciationResult {
  // 시세 데이터는 기존 로직 그대로 사용 (DB 시세 있으면 우선 적용)
  const base = calculateDepreciation(
    modelName,
    vehicleAge,
    mileageGroup,
    fallbackCategory,
    trimMsrp,
    customPrices,
  );

  // trimMsrp 기준으로 잔존가치율·감가율·yearlyTable 재계산
  const retentionRate = base.currentValue
    ? Math.round((base.currentValue / trimMsrp) * 1000) / 1000
    : null;
  const depreciationRate = retentionRate !== null
    ? Math.round((1 - retentionRate) * 1000) / 1000
    : null;
  const yearlyTable = base.yearlyTable.map((row) => ({
    ...row,
    retentionRate: row.value
      ? Math.round((row.value / trimMsrp) * 1000) / 1000
      : null,
  }));

  return {
    ...base,
    msrp: trimMsrp,
    retentionRate,
    depreciationRate,
    yearlyTable,
    dataSource: 'market_trim',
  };
}
