// ═══════════════════════════════════════════
// 브랜드 상수 — Single Source of Truth
// 브랜드명 확정 시 이 파일만 수정하면 전체 반영
// ═══════════════════════════════════════════

export const BRAND = {
  // ─── 브랜드명 (미확정 — placeholder) ───
  name: '카담',
  nameEn: 'CADAM',
  nameWithEn: '카담(CADAM)',

  // ─── 메타데이터 ───
  title: '카담(CADAM) | AI 자동차 전문가',
  description: 'AI 진단으로 나에게 딱 맞는 자동차 이용방법과 차종을 찾아드립니다.',

  // ─── 네비게이션 ───
  navLogo: '🚗 카담',

  // ─── 슬로건/카피 ───
  mainHeading: '나에게 맞는 차,\nAI가 찾아드립니다',
  mainSub: 'AI 자동차 전문가가 진단을 통해 최적의 이용방법과 차종을 추천합니다',
  footerCopy: '© 카담(CADAM)',

  // ─── 공유 ───
  sharePrefix: 'CADAM',

  // ─── Admin ───
  adminTitle: '카담 Admin',
  adminLogin: '카담 관리자 로그인',

  // ─── AI 캐릭터 ───
  ai: {
    charName: '카담 AI',
    charEmoji: '🤖',
    charTitle: '카담 AI 분석',
    charSubtitle: 'AI 전문가 진단',
    bgColor: '#2563EB',
    introComment: '고객님, 어떤 자동차 이용방법이 좋을지 고민되시나요? AI 진단으로 1분 만에 최적의 방법을 찾아드리겠습니다! 🚗',
  },

  // ─── 개인정보 ───
  privacy: {
    title: `개인정보 처리방침 | 카담(CADAM)`,
    description: '카담 AI 자동차 전문가 서비스의 개인정보 수집 및 이용에 관한 안내입니다.',
  },

  // ─── URL/기타 ───
  domain: 'cadam.co.kr',
} as const;

export type BrandConfig = typeof BRAND;
