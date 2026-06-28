// info-data.ts — 정보 가이드(렌트 매거진) 구조 데이터 + 헬퍼
// 원본: _design_ref/info-data.jsx (window 전역 → 모듈, localStorage/CMS 의존 제거)
//
// 실제 기사 데이터는 /api/info-articles 에서 받아온다(InfoArticleShape).
// 이 모듈은 (1) 필터 탭 구조(INFO_CATS/INFO_FORMATS), (2) API 응답 정규화,
// (3) 표시용 헬퍼(태그/읽기시간/색상), (4) 계약 관리 허브 시드(CONTRACT_DIR_SEED)만 담당한다.

// ── 카테고리 / 포맷 필터 (프로토타입 충실 이식) ──────────────
export interface InfoCat {
  key: string;
  label: string;
}
export const INFO_CATS: InfoCat[] = [
  { key: 'all', label: '전체' },
  { key: 'basic', label: '장기렌트 기초' },
  { key: 'vs', label: '리스·할부' },
  { key: 'cost', label: '비용·세금' },
  { key: 'contract', label: '계약 관리' },
  { key: 'ev', label: '전기차' },
  { key: 'trend', label: '신차·트렌드' },
];

export const INFO_FORMATS: InfoCat[] = [
  { key: 'all', label: '전체' },
  { key: 'clip', label: '쇼츠' },
  { key: 'card', label: '카드뉴스' },
  { key: 'article', label: '아티클' },
];

const CAT_LABEL: Record<string, string> = INFO_CATS.reduce<Record<string, string>>((m, c) => {
  m[c.key] = c.label;
  return m;
}, {});

// ── 타입 ────────────────────────────────────────────────────
export interface InfoCard {
  t: string;
  d: string;
}
export interface InfoSection {
  h: string;
  p: string;
}

/** /api/info-articles 응답(InfoArticleShape) 원형 — 일부 필드는 선택적. */
export interface RawArticle {
  id: string;
  title: string;
  excerpt?: string | null;
  linkUrl?: string | null;
  thumbnailUrl?: string | null;
  sourceType?: string | null;
  publishedAt?: string | null;
  category?: string | null;
  vehicleSlug?: string | null;
  contentType?: string | null;
  access?: string | null;
  duration?: string | null;
  cards?: unknown;
}

/**
 * 정규화된 기사. 멀티포맷 렌더 분기는 contentType 기준.
 * lead/sections/tips/cards 는 API 가 주지 않을 수 있어 모두 선택적 —
 * 렌더 전 반드시 존재/배열 가드 후 사용한다.
 */
export interface Article {
  id: string;
  title: string;
  excerpt: string;
  linkUrl: string;
  thumbnailUrl: string | null;
  sourceType: string;
  publishedAt: string | null;
  category: string;
  vehicleSlug: string | null;
  contentType: string; // 'article' | 'clip' | 'card' (폴백: 'article')
  access: string; // 'free' | 'member' (폴백: 'free')
  duration: string | null;
  hue: number;
  cards: InfoCard[] | null;
  // 아래는 현재 API 미제공(추후/시드용) — 렌더 시 가드 필요
  lead?: string;
  sections?: InfoSection[];
  tips?: string[];
}

// ── 색상(hue) 결정적 파생 — image-slot 제거 대체 플레이스홀더용 ──
export function hueFor(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) {
    h = (h * 31 + seed.charCodeAt(i)) % 360;
  }
  return h;
}

function toCards(raw: unknown): InfoCard[] | null {
  if (!Array.isArray(raw)) return null;
  const cards = raw
    .filter((c): c is Record<string, unknown> => !!c && typeof c === 'object')
    .map((c) => ({ t: String(c.t ?? ''), d: String(c.d ?? '') }))
    .filter((c) => c.t || c.d);
  return cards.length ? cards : null;
}

/** API 원형 → 정규화 기사. 폴백: contentType='article', access='free'. */
export function normalizeArticle(raw: RawArticle): Article {
  const id = String(raw.id);
  return {
    id,
    title: raw.title ?? '',
    excerpt: raw.excerpt ?? '',
    linkUrl: raw.linkUrl ?? `/info/${id}`,
    thumbnailUrl: raw.thumbnailUrl ?? null,
    sourceType: raw.sourceType ?? 'blog',
    publishedAt: raw.publishedAt ?? null,
    category: raw.category ?? 'rental',
    vehicleSlug: raw.vehicleSlug ?? null,
    contentType: raw.contentType ?? 'article',
    access: raw.access ?? 'free',
    duration: raw.duration ?? null,
    hue: hueFor(id),
    cards: toCards(raw.cards),
  };
}

// ── 표시용 헬퍼 ──────────────────────────────────────────────
export function catLabel(category: string): string {
  return CAT_LABEL[category] ?? '렌트 가이드';
}

/** 썸네일 태그 라벨 — 포맷 우선, 없으면 카테고리. */
export function tagLabel(a: Article): string {
  if (a.contentType === 'clip') return '쇼츠';
  if (a.contentType === 'card') return '카드뉴스';
  return catLabel(a.category);
}

/** 메타 읽기 라벨 — clip=재생시간, card=장수, article=빈값(메타에서 생략). */
export function readLabel(a: Article): string {
  if (a.contentType === 'clip') return a.duration ?? '';
  if (a.contentType === 'card') return a.cards ? `${a.cards.length}장` : '';
  return a.duration ?? '';
}

/** 함께 보면 좋은 가이드 — 같은 카테고리 우선, 부족분은 그 외에서 채움. */
export function infoRelated(all: Article[], id: string, n = 3): Article[] {
  const cur = all.find((a) => a.id === id);
  if (!cur) return all.filter((a) => a.id !== id).slice(0, n);
  const same = all.filter((a) => a.id !== id && a.category === cur.category);
  const more = all.filter((a) => a.id !== id && a.category !== cur.category);
  return same.concat(more).slice(0, n);
}

// ── 계약 관리 허브 — 캐피탈/리스사 연락처 디렉토리 시드 ────────
export interface CapitalDir {
  id: string;
  name: string;
  cs: string;
  hours: string;
  accident: string;
  accidentName: string;
  issues: Record<string, string>;
}
export const CONTRACT_DIR_SEED: CapitalDir[] = [
  {
    id: 'woori',
    name: '우리금융캐피탈',
    cs: '1544-7300',
    hours: '평일 09:00–18:00',
    accident: '1588-2729',
    accidentName: '삼성화재 사고접수(24시간)',
    issues: {
      '부채(채무)증명서': '고객센터 ARS 2번 또는 홈페이지 > 증명서 발급',
      '상환·납입 스케줄표': '고객센터·앱 > 내 계약 > 납입내역 PDF',
      '사업자 고객 필요서류': '사업자등록증·대표자 신분증(법인은 등기부·인감 추가)',
    },
  },
  {
    id: 'hyundai',
    name: '현대캐피탈',
    cs: '1588-3450',
    hours: '평일 09:00–18:00',
    accident: '1588-5656',
    accidentName: '현대해상 사고접수(24시간)',
    issues: {
      '부채(채무)증명서': '현대캐피탈 앱 > 증명서 발급 또는 고객센터',
      '상환·납입 스케줄표': '앱 > 내 상품 > 납입스케줄 PDF',
      '사업자 고객 필요서류': '사업자등록증·대표자 신분증(법인 추가서류 안내)',
    },
  },
  {
    id: 'hana',
    name: '하나캐피탈',
    cs: '1800-1110',
    hours: '평일 09:00–18:00',
    accident: '1566-3000',
    accidentName: 'DB손해보험 사고접수(24시간)',
    issues: {
      '부채(채무)증명서': '고객센터·홈페이지 > 증명서 발급',
      '상환·납입 스케줄표': '고객센터 요청 시 카톡·이메일 발송',
      '사업자 고객 필요서류': '사업자등록증·대표자 신분증',
    },
  },
  {
    id: 'shinhan',
    name: '신한카드(리스)',
    cs: '1544-7000',
    hours: '평일 09:00–18:00',
    accident: '1588-5588',
    accidentName: 'KB손해보험 사고접수(24시간)',
    issues: {
      '부채(채무)증명서': '신한카드 앱 > 리스 > 증명서',
      '상환·납입 스케줄표': '앱 > 리스 계약 > 납입스케줄',
      '사업자 고객 필요서류': '사업자등록증·대표자 신분증(법인 추가서류)',
    },
  },
  {
    id: 'kb',
    name: 'KB캐피탈',
    cs: '1588-1990',
    hours: '평일 09:00–18:00',
    accident: '1544-0114',
    accidentName: '삼성화재 사고접수(24시간)',
    issues: {
      '부채(채무)증명서': 'KB캐피탈 홈페이지 > 증명서 발급 또는 고객센터',
      '상환·납입 스케줄표': '고객센터·앱 > 내 계약',
      '사업자 고객 필요서류': '사업자등록증·대표자 신분증',
    },
  },
];
