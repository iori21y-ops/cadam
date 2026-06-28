// clips-data.ts — 클립(쇼츠) 시드 데이터
// 원본: _design_ref/info-data.jsx 의 type:"clip" 항목 7종을 그대로 이식.
// ⚠️ 갭: 실 영상/숏폼 소스가 없어 프로토타입 시드를 유지한다.
//   - 라이브 /api/info-articles 의 clip 항목에는 tips/lead 필드가 없어 레이아웃(요약·팁 3줄)을
//     충실히 채우지 못하므로, 디자인·카피 패리티를 위해 프로토타입 시드를 그대로 쓴다.
//   - 실제 쇼츠 영상 파일은 부재 → 배경은 hue 그라데이션 플레이스홀더(원본 image-slot 대체).

export interface ClipCat {
  key: string;
  label: string;
}

// 카테고리 (클립이 실제 보유한 cat만 노출)
export const CLIP_CATS: ClipCat[] = [
  { key: 'all', label: '전체' },
  { key: 'basic', label: '기초' },
  { key: 'cost', label: '비용·세금' },
  { key: 'ev', label: '전기차' },
  { key: 'trend', label: '트렌드' },
];

export interface Clip {
  id: string;
  cat: string;
  dur: string;
  hue: number;
  title: string;
  lead: string;
  tips: string[];
}

export const CLIPS_SEED: Clip[] = [
  {
    id: 'clip-zero', cat: 'basic', dur: '0:32', hue: 268,
    title: '초기비용 0원, 진짜 가능해요?',
    lead: '목돈 없이 새 차 타는 법, 30초로 정리했어요.',
    tips: ['무보증=초기 0원', '보증금 넣으면 월납↓', '자금에 맞춰 설계'],
  },
  {
    id: 'clip-insurance', cat: 'cost', dur: '0:41', hue: 196,
    title: '렌트료에 보험이 포함된다고?',
    lead: '따로 챙길 필요 없는 올인원 구조, 영상으로 확인하세요.',
    tips: ['보험·세금·정비 포함', '매달 렌트료 하나로 끝', '관리 부담 최소'],
  },
  {
    id: 'clip-ev', cat: 'ev', dur: '0:38', hue: 160,
    title: '전기차, 렌트가 더 쌀 수 있어요',
    lead: '보조금·충전까지 따지면 답이 보여요.',
    tips: ['보조금이 렌트료에 반영', '충전 환경 있으면 유지비↓', '초급속 충전 차종 추천'],
  },
  {
    id: 'clip-corp', cat: 'cost', dur: '0:35', hue: 226,
    title: '법인이면 렌트가 답인 이유',
    lead: '렌트료 전액 비용처리, 절세가 보여요.',
    tips: ['렌트료 전액 비용처리', '감가상각 계산 불필요', '운행기록부로 한도 관리'],
  },
  {
    id: 'clip-deposit', cat: 'basic', dur: '0:29', hue: 210,
    title: '보증금 넣으면 월납 얼마 줄까?',
    lead: '선납·보증금 구조, 29초로 정리.',
    tips: ['선납 30%면 월납↓', '보증금은 만기 환급', '자금에 맞춰 설계'],
  },
  {
    id: 'clip-swap', cat: 'trend', dur: '0:44', hue: 14,
    title: '감가 오기 전에 갈아타세요',
    lead: '잔존가치 인정받고 신차로 가는 법.',
    tips: ['신차 감가는 초반이 가장 커요', '전환 시 잔존가치 인정', '지금이 가장 유리한 타이밍'],
  },
  {
    id: 'clip-pick', cat: 'trend', dur: '0:51', hue: 40,
    title: '2026 가성비 차종 TOP3',
    lead: '월 렌트료 대비 만족도 높은 차들.',
    tips: ['세단=아반떼 가성비 1위', '패밀리=쏘렌토 하이브리드', '전기차=아이오닉 5 보조금 반영'],
  },
];
