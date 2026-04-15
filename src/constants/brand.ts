// ═══════════════════════════════════════════════════════
// 브랜드 상수 — Single Source of Truth
// 2026-04-13 리브랜딩: 카담(CADAM) → 렌테일러(RenTailor)
// ═══════════════════════════════════════════════════════

export const BRAND = {
  // —— 브랜드명 ——
  name: '렌테일러',
  nameEn: 'RenTailor',
  nameWithEn: '렌테일러(RenTailor)',

  // —— 메타데이터 ——
  title: '렌테일러(RenTailor) | 당신에게 맞춘 장기렌트',
  description: '양복 맞추듯 나에게 딱 맞는 장기렌터카를 찾아드립니다.',

  // —— 네비게이션 ——
  navLogo: '렌테일러',

  // —— 슬로건/카피 ——
  mainHeading: '당신에게 맞춘 렌트,\n렌테일러가 재단합니다',
  mainSub: '장기렌트·리스·할부, 15년 경력 전문가가 최적의 이용방법과 차종을 추천합니다',
  footerCopy: '© 렌테일러(RenTailor)',

  // —— 공유 ——
  sharePrefix: 'RenTailor',

  // —— Admin ——
  adminTitle: '렌테일러 Admin',
  adminLogin: '렌테일러 관리자 로그인',

  // —— AI 캐릭터 ——
  ai: {
    charName: '렌테일러 AI',
    charEmoji: 'IconCarSedan',
    charTitle: '렌테일러 AI 분석',
    charSubtitle: 'AI 전문가 진단',
    bgColor: '#0D1B2A',
    introComment: '고객님, 어떤 자동차 이용방법이 좋을지 고민되시나요? AI 진단으로 1분 만에 최적의 방법을 찾아드리겠습니다!',
  },

  // —— 개인정보 ——
  privacy: {
    title: '개인정보 처리방침 | 렌테일러(RenTailor)',
    description: '렌테일러 AI 자동차 전문가 서비스의 개인정보 수집 및 이용에 관한 안내입니다.',
  },

  // —— URL/기타 ——
  domain: 'rentailor.co.kr',
} as const;

export type BrandConfig = typeof BRAND;
