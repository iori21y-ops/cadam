export type Category = '세단' | 'SUV' | 'EV' | '다목적' | '트럭';
export type Brand = '현대' | '기아' | '제네시스' | '르노코리아' | 'KGM' | '테슬라' | 'BMW' | '벤츠' | '포르쉐' | '미니' | '랜드로버';

export interface Vehicle {
  id: string;
  brand: Brand;
  model: string;
  slug: string;
  category: Category;
  segment: string;
  fuel: string;
  imageKey: string; // public/cars/{imageKey}.webp
  has360Spin?: boolean; // public/cars/360/{slug}/001~NNN.webp
  spinStartFrame?: number; // 360° 기본 시작 프레임 (0-indexed, 기본값 0)
  frameCount?: number;    // 360° 총 프레임 수 (기본값 61, 기아는 72)
  trims: string[];
  seoTitle: string;
  seoDescription: string;
}

export const VEHICLE_LIST: Vehicle[] = [
  // ═══════════════════════════════════
  // 현대 (21종)
  // ═══════════════════════════════════
  { id: 'h01', brand: '현대', model: '캐스퍼', slug: 'casper', category: '세단', segment: '경차', fuel: '가솔린', imageKey: 'hyundai-casper', trims: ['스마트', '인스퍼레이션'], seoTitle: '캐스퍼 장기렌트 | 월 납부금 비교', seoDescription: '현대 캐스퍼 장기렌터카 최저가 견적. 경차 장기렌트 월 납부금을 비교해 보세요.' },
  { id: 'h02', brand: '현대', model: '아반떼 (CN7)', slug: 'avante', category: '세단', segment: '준중형', fuel: '가솔린', imageKey: 'hyundai-avante', has360Spin: true, spinStartFrame: 8, frameCount: 61, trims: ['스마트', '프리미엄', '인스퍼레이션'], seoTitle: '아반떼 장기렌트 | 월 납부금 비교', seoDescription: '현대 아반떼 장기렌터카 최저가 견적. 36~60개월 조건별 월 납부금을 비교해 보세요.' },
  { id: 'h03', brand: '현대', model: '아반떼 하이브리드', slug: 'avante-hybrid', category: '세단', segment: '준중형', fuel: '하이브리드', imageKey: 'hyundai-avante-hybrid', has360Spin: true, spinStartFrame: 8, frameCount: 61, trims: ['스마트', '프리미엄', '인스퍼레이션'], seoTitle: '아반떼 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '현대 아반떼 하이브리드 장기렌터카. 연비 좋은 하이브리드 장기렌트 견적을 받아보세요.' },
  { id: 'h04', brand: '현대', model: '쏘나타 (DN8)', slug: 'sonata', category: '세단', segment: '중형', fuel: '가솔린', imageKey: 'hyundai-sonata', has360Spin: true, spinStartFrame: 8, frameCount: 61, trims: ['프리미엄', '인스퍼레이션', '캘리그래피'], seoTitle: '쏘나타 장기렌트 | 월 납부금 비교', seoDescription: '현대 쏘나타 장기렌터카 최저가 견적. 중형 세단 장기렌트 조건을 비교해 보세요.' },
  { id: 'h05', brand: '현대', model: '쏘나타 하이브리드', slug: 'sonata-hybrid', category: '세단', segment: '중형', fuel: '하이브리드', imageKey: 'hyundai-sonata-hybrid', has360Spin: true, spinStartFrame: 8, frameCount: 61, trims: ['프리미엄', '인스퍼레이션', '캘리그래피'], seoTitle: '쏘나타 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '현대 쏘나타 하이브리드 장기렌터카. 연비와 성능을 모두 갖춘 장기렌트 견적.' },
  { id: 'h06', brand: '현대', model: '그랜저 (GN7)', slug: 'grandeur', category: '세단', segment: '준대형', fuel: '가솔린', imageKey: 'hyundai-grandeur', has360Spin: true, spinStartFrame: 8, frameCount: 61, trims: ['프리미엄', '캘리그래피', '르블랑'], seoTitle: '그랜저 장기렌트 | 월 납부금 비교', seoDescription: '현대 그랜저 장기렌터카 최저가 견적. 준대형 세단 장기렌트 월 납부금을 비교해 보세요.' },
  { id: 'h07', brand: '현대', model: '그랜저 하이브리드', slug: 'grandeur-hybrid', category: '세단', segment: '준대형', fuel: '하이브리드', imageKey: 'hyundai-grandeur-hybrid', has360Spin: true, spinStartFrame: 8, frameCount: 61, trims: ['프리미엄', '캘리그래피', '르블랑'], seoTitle: '그랜저 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '현대 그랜저 하이브리드 장기렌터카. 프리미엄 하이브리드 장기렌트 견적.' },
  { id: 'h08', brand: '현대', model: '코나 (SX2)', slug: 'kona', category: 'SUV', segment: '소형 SUV', fuel: '가솔린', imageKey: 'hyundai-kona', has360Spin: true, spinStartFrame: 8, frameCount: 61, trims: ['스마트', '프리미엄', '인스퍼레이션'], seoTitle: '코나 장기렌트 | 월 납부금 비교', seoDescription: '현대 코나 장기렌터카. 소형 SUV 장기렌트 견적을 비교해 보세요.' },
  { id: 'h09', brand: '현대', model: '코나 하이브리드', slug: 'kona-hybrid', category: 'SUV', segment: '소형 SUV', fuel: '하이브리드', imageKey: 'hyundai-kona-hybrid', has360Spin: true, spinStartFrame: 8, frameCount: 61, trims: ['스마트', '프리미엄', '인스퍼레이션'], seoTitle: '코나 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '현대 코나 하이브리드 장기렌터카. 연비 좋은 소형 SUV 장기렌트.' },
  { id: 'h10', brand: '현대', model: '투싼 (NX4)', slug: 'tucson', category: 'SUV', segment: '준중형 SUV', fuel: '가솔린', imageKey: 'hyundai-tucson', has360Spin: true, spinStartFrame: 8, frameCount: 61, trims: ['모던', '프리미엄', '인스퍼레이션', '캘리그래피'], seoTitle: '투싼 장기렌트 | 월 납부금 비교', seoDescription: '현대 투싼 장기렌터카 최저가 견적. 인기 SUV 장기렌트 조건을 비교해 보세요.' },
  { id: 'h11', brand: '현대', model: '투싼 하이브리드', slug: 'tucson-hybrid', category: 'SUV', segment: '준중형 SUV', fuel: '하이브리드', imageKey: 'hyundai-tucson-hybrid', has360Spin: true, spinStartFrame: 8, frameCount: 61, trims: ['모던', '프리미엄', '인스퍼레이션'], seoTitle: '투싼 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '현대 투싼 하이브리드 장기렌터카. 연비 좋은 SUV 장기렌트 견적.' },
  { id: 'h12', brand: '현대', model: '싼타페 (MX5)', slug: 'santafe', category: 'SUV', segment: '중형 SUV', fuel: '가솔린', imageKey: 'hyundai-santafe', has360Spin: true, spinStartFrame: 8, frameCount: 61, trims: ['프리미엄', '캘리그래피', '캘리그래피 7인승'], seoTitle: '싼타페 장기렌트 | 월 납부금 비교', seoDescription: '현대 싼타페 장기렌터카. 중형 SUV 장기렌트 견적을 비교해 보세요.' },
  { id: 'h13', brand: '현대', model: '싼타페 하이브리드', slug: 'santafe-hybrid', category: 'SUV', segment: '중형 SUV', fuel: '하이브리드', imageKey: 'hyundai-santafe-hybrid', has360Spin: true, spinStartFrame: 8, frameCount: 61, trims: ['프리미엄', '캘리그래피', '캘리그래피 7인승'], seoTitle: '싼타페 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '현대 싼타페 하이브리드 장기렌터카. 패밀리 SUV 하이브리드 장기렌트.' },
  { id: 'h14', brand: '현대', model: '팰리세이드 (LX2)', slug: 'palisade', category: 'SUV', segment: '대형 SUV', fuel: '디젤', imageKey: 'hyundai-palisade', has360Spin: true, spinStartFrame: 8, frameCount: 61, trims: ['르블랑', '캘리그래피', '캘리그래피 7인승'], seoTitle: '팰리세이드 장기렌트 | 월 납부금 비교', seoDescription: '현대 팰리세이드 장기렌터카. 대형 SUV 장기렌트 최저가 견적.' },
  { id: 'h15', brand: '현대', model: '코나 일렉트릭', slug: 'kona-ev', category: 'EV', segment: '소형 SUV (EV)', fuel: '전기', imageKey: 'hyundai-kona-ev', has360Spin: true, spinStartFrame: 8, frameCount: 61, trims: ['스탠다드', '롱레인지', '롱레인지 프리미엄'], seoTitle: '코나 일렉트릭 장기렌트 | 월 납부금 비교', seoDescription: '현대 코나 전기차 장기렌터카. 전기차 장기렌트 혜택과 견적을 확인하세요.' },
  { id: 'h16', brand: '현대', model: '아이오닉 5 (NE1)', slug: 'ioniq5', category: 'EV', segment: '중형 SUV (EV)', fuel: '전기', imageKey: 'hyundai-ioniq5', has360Spin: true, spinStartFrame: 8, frameCount: 61, trims: ['스탠다드', '롱레인지', '롱레인지 프리미엄', '롱레인지 익스클루시브'], seoTitle: '아이오닉5 장기렌트 | 월 납부금 비교', seoDescription: '현대 아이오닉5 장기렌터카. 전기차 장기렌트 조건과 월 납부금을 비교해 보세요.' },
  { id: 'h17', brand: '현대', model: '아이오닉 6 (CE1)', slug: 'ioniq6', category: 'EV', segment: '중형 세단 (EV)', fuel: '전기', imageKey: 'hyundai-ioniq6', has360Spin: true, spinStartFrame: 8, frameCount: 61, trims: ['스탠다드', '롱레인지', '롱레인지 프리미엄', '롱레인지 익스클루시브'], seoTitle: '아이오닉6 장기렌트 | 월 납부금 비교', seoDescription: '현대 아이오닉6 장기렌터카. 전기 세단 장기렌트 최저가 견적.' },
  { id: 'h18', brand: '현대', model: '스타리아', slug: 'staria', category: '다목적', segment: '다목적', fuel: '디젤', imageKey: 'hyundai-staria', has360Spin: true, spinStartFrame: 8, frameCount: 61, trims: ['투어러 9인승', '라운지 7인승', '라운지 9인승'], seoTitle: '스타리아 장기렌트 | 월 납부금 비교', seoDescription: '현대 스타리아 장기렌터카. 다목적 차량 장기렌트 견적.' },
  { id: 'h19', brand: '현대', model: '포터 II', slug: 'porter2', category: '트럭', segment: '1톤 트럭', fuel: '디젤', imageKey: 'hyundai-porter2', trims: ['슈퍼캡', '더블캡'], seoTitle: '포터2 장기렌트 | 월 납부금 비교', seoDescription: '현대 포터2 장기렌터카. 1톤 트럭 장기렌트 사업자 전용 견적.' },
  { id: 'h20', brand: '현대', model: '캐스퍼 일렉트릭', slug: 'casper-ev', category: 'EV', segment: '경차 (EV)', fuel: '전기', imageKey: 'hyundai-casper-ev', has360Spin: true, spinStartFrame: 8, frameCount: 61, trims: ['스마트', '프리미엄', '인스퍼레이션'], seoTitle: '캐스퍼 일렉트릭 장기렌트 | 월 납부금 비교', seoDescription: '현대 캐스퍼 일렉트릭 장기렌터카. 경차 전기차 장기렌트 최저가 견적을 확인하세요.' },
  { id: 'h22', brand: '현대', model: '베뉴', slug: 'venue', category: 'SUV', segment: '소형 SUV', fuel: '가솔린', imageKey: 'hyundai-venue', trims: ['스마트', '프리미엄', '인스퍼레이션'], seoTitle: '베뉴 장기렌트 | 월 납부금 비교', seoDescription: '현대 베뉴 장기렌터카. 소형 SUV 장기렌트 최저가 견적을 확인하세요.' },
  { id: 'h21', brand: '현대', model: '아이오닉9', slug: 'ioniq9', category: 'EV', segment: '대형 SUV (EV)', fuel: '전기', imageKey: 'hyundai-ioniq9', has360Spin: true, spinStartFrame: 8, frameCount: 61, trims: ['스탠다드', '롱레인지', '롱레인지 프리미엄'], seoTitle: '아이오닉9 장기렌트 | 월 납부금 비교', seoDescription: '현대 아이오닉9 장기렌터카. 플래그십 대형 전기 SUV 장기렌트 최저가 견적.' },

  // ═══════════════════════════════════
  // 기아 (30종)
  // ═══════════════════════════════════
  { id: 'k01', brand: '기아', model: '모닝', slug: 'morning', category: '세단', segment: '경차', fuel: '가솔린', imageKey: 'kia-morning', has360Spin: true, frameCount: 72, spinStartFrame: 8, trims: ['트렌디', '프레스티지', '시그니처'], seoTitle: '모닝 장기렌트 | 월 납부금 비교', seoDescription: '기아 모닝 장기렌터카. 경차 장기렌트 최저가 견적을 확인하세요.' },
  { id: 'k02', brand: '기아', model: '레이', slug: 'ray', category: '세단', segment: '경차', fuel: '가솔린', imageKey: 'kia-ray', trims: ['트렌디', '프레스티지', '시그니처'], seoTitle: '레이 장기렌트 | 월 납부금 비교', seoDescription: '기아 레이 장기렌터카. 넓은 경차 장기렌트 견적.' },
  { id: 'k03', brand: '기아', model: 'K3', slug: 'k3', category: '세단', segment: '준중형', fuel: '가솔린', imageKey: 'kia-k3', trims: ['트렌디', '프레스티지', '시그니처'], seoTitle: 'K3 장기렌트 | 월 납부금 비교', seoDescription: '기아 K3 장기렌터카. 준중형 세단 장기렌트 견적을 비교해 보세요.' },
  { id: 'k04', brand: '기아', model: 'K5', slug: 'k5', category: '세단', segment: '중형', fuel: '가솔린', imageKey: 'kia-k5', has360Spin: true, frameCount: 72, spinStartFrame: 8, trims: ['트렌디', '프레스티지', '시그니처', '그래비티'], seoTitle: 'K5 장기렌트 | 월 납부금 비교', seoDescription: '기아 K5 장기렌터카 최저가 견적. 중형 세단 장기렌트 조건을 비교하세요.' },
  { id: 'k05', brand: '기아', model: 'K5 하이브리드', slug: 'k5-hybrid', category: '세단', segment: '중형', fuel: '하이브리드', imageKey: 'kia-k5-hybrid', trims: ['트렌디', '프레스티지', '시그니처', '그래비티'], seoTitle: 'K5 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '기아 K5 하이브리드 장기렌터카. 연비 좋은 중형 세단 장기렌트.' },
  { id: 'k06', brand: '기아', model: 'K8', slug: 'k8', category: '세단', segment: '준대형', fuel: '가솔린', imageKey: 'kia-k8', has360Spin: true, frameCount: 72, spinStartFrame: 8, trims: ['프레스티지', '시그니처', '시그니처 AWD'], seoTitle: 'K8 장기렌트 | 월 납부금 비교', seoDescription: '기아 K8 장기렌터카. 준대형 세단 장기렌트 견적을 확인하세요.' },
  { id: 'k07', brand: '기아', model: 'K8 하이브리드', slug: 'k8-hybrid', category: '세단', segment: '준대형', fuel: '하이브리드', imageKey: 'kia-k8-hybrid', trims: ['프레스티지', '시그니처'], seoTitle: 'K8 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '기아 K8 하이브리드 장기렌터카. 프리미엄 하이브리드 장기렌트.' },
  { id: 'k08', brand: '기아', model: 'K9', slug: 'k9', category: '세단', segment: '대형', fuel: '가솔린', imageKey: 'kia-k9', has360Spin: true, frameCount: 72, spinStartFrame: 8, trims: ['마스터즈', '마스터즈 AWD'], seoTitle: 'K9 장기렌트 | 월 납부금 비교', seoDescription: '기아 K9 장기렌터카. 대형 세단 장기렌트 최저가 견적.' },
  { id: 'k09', brand: '기아', model: '셀토스', slug: 'seltos', category: 'SUV', segment: '소형 SUV', fuel: '가솔린', imageKey: 'kia-seltos', trims: ['트렌디', '프레스티지', '시그니처', '그래비티'], seoTitle: '셀토스 장기렌트 | 월 납부금 비교', seoDescription: '기아 셀토스 장기렌터카. 소형 SUV 장기렌트 견적을 비교하세요.' },
  { id: 'k10', brand: '기아', model: '스포티지 (NQ5)', slug: 'sportage', category: 'SUV', segment: '준중형 SUV', fuel: '가솔린', imageKey: 'kia-sportage', trims: ['트렌디', '프레스티지', '시그니처', '그래비티'], seoTitle: '스포티지 장기렌트 | 월 납부금 비교', seoDescription: '기아 스포티지 장기렌터카 최저가 견적. 인기 SUV 장기렌트 조건 비교.' },
  { id: 'k11', brand: '기아', model: '스포티지 하이브리드', slug: 'sportage-hybrid', category: 'SUV', segment: '준중형 SUV', fuel: '하이브리드', imageKey: 'kia-sportage-hybrid', trims: ['트렌디', '프레스티지', '시그니처', '그래비티'], seoTitle: '스포티지 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '기아 스포티지 하이브리드 장기렌터카. 연비 좋은 SUV 장기렌트.' },
  { id: 'k12', brand: '기아', model: '쏘렌토 (MQ4)', slug: 'sorento', category: 'SUV', segment: '중형 SUV', fuel: '가솔린', imageKey: 'kia-sorento', has360Spin: true, frameCount: 72, spinStartFrame: 8, trims: ['프레스티지', '시그니처', '그래비티', '그래비티 7인승'], seoTitle: '쏘렌토 장기렌트 | 월 납부금 비교', seoDescription: '기아 쏘렌토 장기렌터카. 중형 SUV 장기렌트 견적을 확인하세요.' },
  { id: 'k13', brand: '기아', model: '쏘렌토 하이브리드', slug: 'sorento-hybrid', category: 'SUV', segment: '중형 SUV', fuel: '하이브리드', imageKey: 'kia-sorento-hybrid', trims: ['프레스티지', '시그니처', '그래비티'], seoTitle: '쏘렌토 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '기아 쏘렌토 하이브리드 장기렌터카. 패밀리 SUV 하이브리드 장기렌트.' },
  { id: 'k14', brand: '기아', model: 'EV4', slug: 'ev4', category: 'EV', segment: '소형 SUV (EV)', fuel: '전기', imageKey: 'kia-ev4', has360Spin: true, frameCount: 72, spinStartFrame: 8, trims: ['에어 스탠다드', '에어 롱레인지', '어스 스탠다드', 'GT-Line 스탠다드', '어스 롱레인지', 'GT-Line 롱레인지'], seoTitle: 'EV4 장기렌트 | 월 납부금 비교', seoDescription: '기아 EV4 장기렌터카. 전기차 소형 SUV 장기렌트 견적을 확인하세요.' },
  { id: 'k15', brand: '기아', model: 'EV3', slug: 'ev3', category: 'EV', segment: '소형 SUV (EV)', fuel: '전기', imageKey: 'kia-ev3', trims: ['에어', '어스', '어스 롱레인지'], seoTitle: 'EV3 장기렌트 | 월 납부금 비교', seoDescription: '기아 EV3 장기렌터카. 전기차 소형 SUV 장기렌트 견적.' },
  { id: 'k16', brand: '기아', model: 'EV6', slug: 'ev6', category: 'EV', segment: '중형 CUV (EV)', fuel: '전기', imageKey: 'kia-ev6', has360Spin: true, frameCount: 72, spinStartFrame: 8, trims: ['스탠다드', '롱레인지', '롱레인지 프레스티지', 'GT-Line'], seoTitle: 'EV6 장기렌트 | 월 납부금 비교', seoDescription: '기아 EV6 장기렌터카. 전기차 장기렌트 혜택과 견적을 확인하세요.' },
  { id: 'k17', brand: '기아', model: 'EV9', slug: 'ev9', category: 'EV', segment: '대형 SUV (EV)', fuel: '전기', imageKey: 'kia-ev9', has360Spin: true, frameCount: 72, spinStartFrame: 8, trims: ['에어', '어스', '어스 7인승'], seoTitle: 'EV9 장기렌트 | 월 납부금 비교', seoDescription: '기아 EV9 장기렌터카. 대형 전기 SUV 장기렌트 최저가 견적.' },
  { id: 'k18', brand: '기아', model: '카니발 (KA4)', slug: 'carnival', category: '다목적', segment: '다목적', fuel: '디젤', imageKey: 'kia-carnival', has360Spin: true, frameCount: 72, spinStartFrame: 8, trims: ['프레스티지 7인승', '시그니처 7인승', '시그니처 9인승', '노블레스'], seoTitle: '카니발 장기렌트 | 월 납부금 비교', seoDescription: '기아 카니발 장기렌터카. 다목적 차량 장기렌트 견적을 확인하세요.' },
  { id: 'k19', brand: '기아', model: '봉고 III', slug: 'bongo3', category: '트럭', segment: '1톤 트럭', fuel: '디젤', imageKey: 'kia-bongo3', trims: ['킹캡', '더블캡', '1톤'], seoTitle: '봉고3 장기렌트 | 월 납부금 비교', seoDescription: '기아 봉고3 장기렌터카. 1톤 트럭 사업자 장기렌트 견적.' },
  { id: 'k20', brand: '기아', model: '니로 하이브리드', slug: 'niro', category: 'SUV', segment: '소형 SUV', fuel: '하이브리드', imageKey: 'kia-niro', trims: ['트렌디', '프레스티지', '시그니처'], seoTitle: '니로 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '기아 니로 하이브리드 장기렌터카. 연비 좋은 소형 SUV 하이브리드 장기렌트 견적.' },
  { id: 'k21', brand: '기아', model: '니로 플러그인 하이브리드', slug: 'niro-phev', category: 'SUV', segment: '소형 SUV', fuel: '플러그인 하이브리드', imageKey: 'kia-niro-plus', trims: ['트렌디', '프레스티지', '시그니처'], seoTitle: '니로 플러그인 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '기아 니로 플러그인 하이브리드 장기렌터카. 전기+하이브리드 소형 SUV 장기렌트 견적.' },
  { id: 'k22', brand: '기아', model: '니로 EV', slug: 'niro-ev', category: 'EV', segment: '소형 SUV (EV)', fuel: '전기', imageKey: 'kia-niro-ev', trims: ['에어', '어스', '어스 롱레인지'], seoTitle: '니로 EV 장기렌트 | 월 납부금 비교', seoDescription: '기아 니로 EV 장기렌터카. 소형 전기 SUV 장기렌트 최저가 견적을 확인하세요.' },
  { id: 'k23', brand: '기아', model: '레이 EV', slug: 'ray-ev', category: 'EV', segment: '경차 (EV)', fuel: '전기', imageKey: 'kia-ray-ev', has360Spin: true, frameCount: 72, spinStartFrame: 8, trims: ['라이트', '에어'], seoTitle: '레이 EV 장기렌트 | 월 납부금 비교', seoDescription: '기아 레이 EV 장기렌터카. 전기 경차 장기렌트 최저가 견적을 확인하세요.' },
  { id: 'k24', brand: '기아', model: 'EV5', slug: 'ev5', category: 'EV', segment: '중형 SUV (EV)', fuel: '전기', imageKey: 'kia-ev5', trims: ['에어 스탠다드', '어스 스탠다드', '에어 롱레인지', 'GT-Line 스탠다드', '어스 롱레인지', 'GT-Line 롱레인지'], seoTitle: 'EV5 장기렌트 | 월 납부금 비교', seoDescription: '기아 EV5 장기렌터카. 전기차 중형 SUV 장기렌트 견적을 확인하세요.' },
  { id: 'k25', brand: '기아', model: '타스만', slug: 'tasman', category: '트럭', segment: '픽업트럭', fuel: '가솔린', imageKey: 'kia-tasman', has360Spin: true, frameCount: 72, spinStartFrame: 8, trims: ['다이내믹', '어드벤처', '익스트림', 'X-Pro'], seoTitle: '타스만 장기렌트 | 월 납부금 비교', seoDescription: '기아 타스만 장기렌터카. 픽업트럭 장기렌트 사업자 전용 견적.' },
  { id: 'k26', brand: '기아', model: 'EV3 GT', slug: 'ev3-gt', category: 'EV', segment: '소형 SUV (EV)', fuel: '전기', imageKey: 'kia-ev3-gt', trims: ['GT'], seoTitle: 'EV3 GT 장기렌트 | 월 납부금 비교', seoDescription: '기아 EV3 GT 장기렌터카. 고성능 전기 소형 SUV 장기렌트 견적을 확인하세요.' },
  { id: 'k27', brand: '기아', model: 'EV4 GT', slug: 'ev4-gt', category: 'EV', segment: '소형 SUV (EV)', fuel: '전기', imageKey: 'kia-ev4-gt', trims: ['GT'], seoTitle: 'EV4 GT 장기렌트 | 월 납부금 비교', seoDescription: '기아 EV4 GT 장기렌터카. 고성능 전기 소형 SUV 장기렌트 견적을 확인하세요.' },
  { id: 'k28', brand: '기아', model: 'EV5 GT', slug: 'ev5-gt', category: 'EV', segment: '중형 SUV (EV)', fuel: '전기', imageKey: 'kia-ev5-gt', trims: ['GT'], seoTitle: 'EV5 GT 장기렌트 | 월 납부금 비교', seoDescription: '기아 EV5 GT 장기렌터카. 고성능 전기 중형 SUV 장기렌트 견적을 확인하세요.' },
  { id: 'k29', brand: '기아', model: 'EV6 GT', slug: 'ev6-gt', category: 'EV', segment: '중형 CUV (EV)', fuel: '전기', imageKey: 'kia-ev6-gt', has360Spin: true, frameCount: 72, spinStartFrame: 8, trims: ['GT', 'GT AWD'], seoTitle: 'EV6 GT 장기렌트 | 월 납부금 비교', seoDescription: '기아 EV6 GT 장기렌터카. 고성능 전기 CUV 장기렌트 견적을 확인하세요.' },
  { id: 'k30', brand: '기아', model: 'EV9 GT', slug: 'ev9-gt', category: 'EV', segment: '대형 SUV (EV)', fuel: '전기', imageKey: 'kia-ev9-gt', has360Spin: true, frameCount: 72, spinStartFrame: 30, trims: ['GT', 'GT AWD'], seoTitle: 'EV9 GT 장기렌트 | 월 납부금 비교', seoDescription: '기아 EV9 GT 장기렌터카. 고성능 전기 대형 SUV 장기렌트 견적을 확인하세요.' },

  // ═══════════════════════════════════
  // 제네시스 (8종)
  // ═══════════════════════════════════
  { id: 'g01', brand: '제네시스', model: 'G70', slug: 'g70', category: '세단', segment: '스포츠 세단', fuel: '가솔린', imageKey: 'genesis-g70', trims: ['2.0T', '2.0T 스포츠', '3.3T 스포츠'], seoTitle: 'G70 장기렌트 | 월 납부금 비교', seoDescription: '제네시스 G70 장기렌터카. 스포츠 세단 장기렌트 견적을 확인하세요.' },
  { id: 'g02', brand: '제네시스', model: 'G80', slug: 'g80', category: '세단', segment: '대형 세단', fuel: '가솔린', imageKey: 'genesis-g80', trims: ['2.5T', '2.5T AWD', '3.5T', '전동화(EV)'], seoTitle: 'G80 장기렌트 | 월 납부금 비교', seoDescription: '제네시스 G80 장기렌터카. 프리미엄 세단 장기렌트 최저가 견적.' },
  { id: 'g03', brand: '제네시스', model: 'G90', slug: 'g90', category: '세단', segment: '플래그십', fuel: '가솔린', imageKey: 'genesis-g90', trims: ['3.5T', '3.5T AWD', '롱휠베이스'], seoTitle: 'G90 장기렌트 | 월 납부금 비교', seoDescription: '제네시스 G90 장기렌터카. 플래그십 세단 장기렌트 견적.' },
  { id: 'g04', brand: '제네시스', model: 'GV60', slug: 'gv60', category: 'EV', segment: '소형 SUV (EV)', fuel: '전기', imageKey: 'genesis-gv60', trims: ['스탠다드', '퍼포먼스'], seoTitle: 'GV60 장기렌트 | 월 납부금 비교', seoDescription: '제네시스 GV60 장기렌터카. 프리미엄 전기차 SUV 장기렌트.' },
  { id: 'g05', brand: '제네시스', model: 'GV70', slug: 'gv70', category: 'SUV', segment: '중형 SUV', fuel: '가솔린', imageKey: 'genesis-gv70', trims: ['2.5T', '2.5T AWD', '2.2D', '전동화(EV)'], seoTitle: 'GV70 장기렌트 | 월 납부금 비교', seoDescription: '제네시스 GV70 장기렌터카. 프리미엄 SUV 장기렌트 견적을 비교하세요.' },
  { id: 'g06', brand: '제네시스', model: 'GV80', slug: 'gv80', category: 'SUV', segment: '대형 SUV', fuel: '가솔린', imageKey: 'genesis-gv80', trims: ['2.5T', '2.5T AWD', '3.5T', '3.5T AWD'], seoTitle: 'GV80 장기렌트 | 월 납부금 비교', seoDescription: '제네시스 GV80 장기렌터카. 대형 SUV 장기렌트 최저가 견적.' },
  { id: 'g07', brand: '제네시스', model: 'GV80 쿠페', slug: 'gv80-coupe', category: 'SUV', segment: '대형 SUV 쿠페', fuel: '가솔린', imageKey: 'genesis-gv80-coupe', trims: ['2.5T', '3.5T', '3.5T AWD'], seoTitle: 'GV80 쿠페 장기렌트 | 월 납부금 비교', seoDescription: '제네시스 GV80 쿠페 장기렌터카. 프리미엄 SUV 쿠페 장기렌트 견적.' },
  { id: 'g08', brand: '제네시스', model: 'GV90', slug: 'gv90', category: 'EV', segment: '플래그십 SUV (EV)', fuel: '전기', imageKey: 'genesis-gv90', trims: ['프리미엄', '프리미엄 AWD'], seoTitle: 'GV90 장기렌트 | 월 납부금 비교', seoDescription: '제네시스 GV90 장기렌터카. 플래그십 전기 SUV 장기렌트 최저가 견적.' },

  // ═══════════════════════════════════
  // 르노코리아 (10종)
  // ═══════════════════════════════════
  { id: 'rk01', brand: '르노코리아', model: 'QM6', slug: 'qm6', category: 'SUV', segment: '중형 SUV', fuel: '가솔린/LPG', imageKey: 'renault-qm6', trims: ['LE', 'RE', 'RE 시그니처'], seoTitle: 'QM6 장기렌트 | 월 납부금 비교', seoDescription: '르노코리아 QM6 장기렌터카. 중형 SUV 가솔린·LPG 장기렌트 견적을 확인하세요.' },
  { id: 'rk02', brand: '르노코리아', model: 'XM3', slug: 'xm3', category: 'SUV', segment: '소형 SUV', fuel: '가솔린', imageKey: 'renault-xm3', trims: ['LE', 'RE', 'RE 오라'], seoTitle: 'XM3 장기렌트 | 월 납부금 비교', seoDescription: '르노코리아 XM3 장기렌터카. 감각적인 소형 SUV 장기렌트 견적.' },
  { id: 'rk03', brand: '르노코리아', model: 'XM3 하이브리드', slug: 'xm3-hybrid', category: 'SUV', segment: '소형 SUV', fuel: '하이브리드', imageKey: 'renault-xm3-hybrid', trims: ['RE 하이브리드', 'RE 오라 하이브리드'], seoTitle: 'XM3 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '르노코리아 XM3 하이브리드 장기렌터카. 연비 좋은 소형 SUV 하이브리드 장기렌트.' },
  { id: 'rk04', brand: '르노코리아', model: '아르카나 하이브리드', slug: 'arkana', category: 'SUV', segment: '소형 SUV 쿠페', fuel: '하이브리드', imageKey: 'renault-arkana', trims: ['아이코닉'], seoTitle: '아르카나 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '르노코리아 아르카나 E-Tech 하이브리드 장기렌터카. 스타일리시한 쿠페형 SUV 장기렌트 견적.' },
  { id: 'rk05', brand: '르노코리아', model: '마스터', slug: 'master', category: '다목적', segment: '대형 밴', fuel: '디젤', imageKey: 'renault-master', trims: ['3인승', '9인승', '12인승'], seoTitle: '마스터 장기렌트 | 월 납부금 비교', seoDescription: '르노코리아 마스터 장기렌터카. 대형 밴 다목적 장기렌트 사업자 전용 견적.' },
  { id: 'rk06', brand: '르노코리아', model: '아르카나 가솔린', slug: 'arkana-gasoline', category: 'SUV', segment: '소형 SUV 쿠페', fuel: '가솔린', imageKey: 'renault-arkana-gasoline', trims: ['아이코닉'], seoTitle: '아르카나 가솔린 장기렌트 | 월 납부금 비교', seoDescription: '르노코리아 아르카나 1.6 GTe 가솔린 장기렌터카. 쿠페형 소형 SUV 장기렌트 최저가 견적.' },
  { id: 'rk07', brand: '르노코리아', model: '그랑 콜레오스', slug: 'grand-koleos', category: 'SUV', segment: '중형 SUV', fuel: '가솔린', imageKey: 'renault-grand-koleos', trims: ['테크노', '아이코닉', '에스프리 알핀', '아이코닉 4WD', '에스카파드', '에스카파드 4WD'], seoTitle: '그랑 콜레오스 장기렌트 | 월 납부금 비교', seoDescription: '르노코리아 그랑 콜레오스 가솔린 장기렌터카. 중형 SUV 장기렌트 트림별 최저가 견적.' },
  { id: 'rk08', brand: '르노코리아', model: '그랑 콜레오스 하이브리드', slug: 'grand-koleos-hybrid', category: 'SUV', segment: '중형 SUV', fuel: '하이브리드', imageKey: 'renault-grand-koleos-hybrid', trims: ['테크노', '아이코닉', '에스프리 알핀', '에스카파드'], seoTitle: '그랑 콜레오스 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '르노코리아 그랑 콜레오스 E-Tech 하이브리드 장기렌터카. 중형 SUV 하이브리드 장기렌트 견적.' },
  { id: 'rk09', brand: '르노코리아', model: '필랑트', slug: 'filante', category: '세단', segment: '대형 세단', fuel: '하이브리드', imageKey: 'renault-filante', trims: ['테크노', '아이코닉', 'SE', '에스프리 알핀'], seoTitle: '필랑트 장기렌트 | 월 납부금 비교', seoDescription: '르노코리아 필랑트 E-Tech 하이브리드 장기렌터카. 프리미엄 대형 세단 장기렌트 견적.' },
  { id: 'rk10', brand: '르노코리아', model: 'SM6', slug: 'sm6', category: '세단', segment: '중형 세단', fuel: '가솔린', imageKey: 'renault-sm6', trims: ['인스파이어'], seoTitle: 'SM6 장기렌트 | 월 납부금 비교', seoDescription: '르노코리아 SM6 TCe 300 장기렌터카. 감성 중형 세단 장기렌트 최저가 견적.' },

  // ═══════════════════════════════════
  // KGM (12종)
  // ═══════════════════════════════════
  { id: 'kg01', brand: 'KGM', model: '더 뉴 티볼리 1.6 가솔린', slug: 'tivoli', category: 'SUV', segment: '소형 SUV', fuel: '가솔린', imageKey: 'kgm-tivoli', has360Spin: false, trims: ['스마트', '퍼펙트'], seoTitle: '티볼리 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 티볼리 장기렌터카. 소형 SUV 장기렌트 최저가 견적을 확인하세요.' },
  { id: 'kg02', brand: 'KGM', model: '더 뉴 티볼리 1.5 가솔린 터보', slug: 'tivoli-turbo', category: 'SUV', segment: '소형 SUV', fuel: '가솔린', imageKey: 'kgm-tivoli-turbo', trims: ['스마트', '퍼펙트'], seoTitle: '티볼리 터보 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 티볼리 1.5 터보 장기렌터카. 소형 SUV 터보 엔진 장기렌트 견적을 확인하세요.' },
  { id: 'kg03', brand: 'KGM', model: '액티언 하이브리드', slug: 'actyon-hybrid', category: 'SUV', segment: '준중형 SUV', fuel: '하이브리드', imageKey: 'kgm-actyon-hybrid', has360Spin: true, frameCount: 36, spinStartFrame: 4, trims: ['퍼펙트'], seoTitle: '액티언 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 액티언 하이브리드 장기렌터카. 준중형 SUV 하이브리드 장기렌트 견적을 확인하세요.' },
  { id: 'kg04', brand: 'KGM', model: '토레스', slug: 'torres', category: 'SUV', segment: '중형 SUV', fuel: '가솔린', imageKey: 'kgm-torres', has360Spin: true, frameCount: 36, spinStartFrame: 4, trims: ['스마트', '퍼펙트', '프리미엄'], seoTitle: '토레스 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 토레스 장기렌터카. 중형 SUV 장기렌트 최저가 견적을 확인하세요.' },
  { id: 'kg05', brand: 'KGM', model: '토레스 하이브리드', slug: 'torres-hybrid', category: 'SUV', segment: '중형 SUV', fuel: '하이브리드', imageKey: 'kgm-torres-hybrid', has360Spin: true, frameCount: 36, spinStartFrame: 4, trims: ['스마트', '퍼펙트', '프리미엄'], seoTitle: '토레스 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 토레스 하이브리드 장기렌터카. 중형 SUV 하이브리드 장기렌트 견적을 확인하세요.' },
  { id: 'kg06', brand: 'KGM', model: '토레스 밴', slug: 'torres-van', category: 'SUV', segment: '중형 SUV', fuel: '가솔린', imageKey: 'kgm-torres-van', trims: ['스마트', '퍼펙트'], seoTitle: '토레스 밴 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 토레스 밴 장기렌터카. 실용적인 SUV 밴 장기렌트 견적을 확인하세요.' },
  { id: 'kg07', brand: 'KGM', model: '토레스 EVX', slug: 'torres-evx', category: 'EV', segment: '중형 SUV (EV)', fuel: '전기', imageKey: 'kgm-torres-evx', trims: ['스마트', '퍼펙트'], seoTitle: '토레스 EVX 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 토레스 EVX 전기차 장기렌터카. 중형 전기 SUV 장기렌트 견적을 확인하세요.' },
  { id: 'kg08', brand: 'KGM', model: '토레스 EVX 밴', slug: 'torres-evx-van', category: 'EV', segment: '중형 SUV (EV)', fuel: '전기', imageKey: 'kgm-torres-evx-van', trims: ['스마트', '퍼펙트'], seoTitle: '토레스 EVX 밴 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 토레스 EVX 밴 장기렌터카. 전기 SUV 밴 장기렌트 견적을 확인하세요.' },
  { id: 'kg09', brand: 'KGM', model: '렉스턴 뉴 아레나', slug: 'rexton', category: 'SUV', segment: '대형 SUV', fuel: '디젤', imageKey: 'kgm-rexton', trims: ['스마트', '퍼펙트'], seoTitle: '렉스턴 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 렉스턴 장기렌터카. 대형 SUV 장기렌트 최저가 견적을 확인하세요.' },
  { id: 'kg10', brand: 'KGM', model: '렉스턴 써밋 4인승', slug: 'rexton-summit', category: 'SUV', segment: '대형 SUV', fuel: '디젤', imageKey: 'kgm-rexton-summit', trims: ['써밋'], seoTitle: '렉스턴 써밋 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 렉스턴 써밋 장기렌터카. 프리미엄 대형 SUV 장기렌트 견적을 확인하세요.' },
  { id: 'kg11', brand: 'KGM', model: '무쏘', slug: 'musso', category: '트럭', segment: '픽업트럭', fuel: '디젤', imageKey: 'kgm-musso', trims: ['스마트', '퍼펙트', '프리미엄'], seoTitle: '무쏘 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 무쏘 픽업트럭 장기렌터카. 픽업트럭 장기렌트 최저가 견적을 확인하세요.' },
  { id: 'kg12', brand: 'KGM', model: '무쏘 EV', slug: 'musso-ev', category: 'EV', segment: '픽업트럭 (EV)', fuel: '전기', imageKey: 'kgm-musso-ev', trims: ['스마트', '퍼펙트'], seoTitle: '무쏘 EV 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 무쏘 전기 픽업트럭 장기렌터카. 전기 픽업트럭 장기렌트 견적을 확인하세요.' },
  // 테슬라
  { id: 't01', brand: '테슬라', model: 'Model 3', slug: 'tesla-model-3', category: 'EV', segment: '중형 세단 (EV)', fuel: '전기', imageKey: 'tesla-model-3', trims: ['Standard RWD', 'Premium Long Range RWD', 'Performance AWD'], seoTitle: 'Model 3 장기렌트 | 월 납부금 비교', seoDescription: '테슬라 Model 3 장기렌터카. 전기 세단 장기렌트 최저가 견적을 확인하세요.' },
  { id: 't02', brand: '테슬라', model: 'Model Y', slug: 'tesla-model-y', category: 'EV', segment: '중형 SUV (EV)', fuel: '전기', imageKey: 'tesla-model-y', trims: ['RWD', 'Long Range AWD', 'Performance'], seoTitle: 'Model Y 장기렌트 | 월 납부금 비교', seoDescription: '테슬라 Model Y 장기렌터카. 전기 SUV 장기렌트 최저가 견적을 확인하세요.' },

  // ═══════════════════════════════════
  // BMW (26종) — 2026-04-29 크롤러 적재 기반
  // 이미지: 미준비 (imageKey='') → 전체차종 페이지 이모지 표시
  // ═══════════════════════════════════
  { id: 'bmw01', brand: 'BMW', model: '1시리즈', slug: 'bmw-1series', category: '세단', segment: '준중형 세단', fuel: '가솔린', imageKey: 'bmw-1series', trims: [], seoTitle: 'BMW 1시리즈 장기렌트 | 월 납부금 비교', seoDescription: 'BMW 1시리즈 장기렌터카 최저가 견적. 프리미엄 준중형 세단 장기렌트 조건을 비교하세요.' },
  { id: 'bmw02', brand: 'BMW', model: '2시리즈', slug: 'bmw-2series', category: '세단', segment: '쿠페·그란쿠페', fuel: '가솔린', imageKey: 'bmw-2series', trims: [], seoTitle: 'BMW 2시리즈 장기렌트 | 월 납부금 비교', seoDescription: 'BMW 2시리즈 장기렌터카 견적. 쿠페·그란쿠페·액티브투어러 장기렌트 조건을 비교하세요.' },
  { id: 'bmw03', brand: 'BMW', model: '3시리즈', slug: 'bmw-3series', category: '세단', segment: '중형 세단', fuel: '가솔린', imageKey: 'bmw-3series', trims: [], seoTitle: 'BMW 3시리즈 장기렌트 | 월 납부금 비교', seoDescription: 'BMW 3시리즈 장기렌터카 최저가 견적. 인기 프리미엄 중형 세단 장기렌트.' },
  { id: 'bmw04', brand: 'BMW', model: '4시리즈', slug: 'bmw-4series', category: '세단', segment: '중형 쿠페', fuel: '가솔린', imageKey: 'bmw-4series', trims: [], seoTitle: 'BMW 4시리즈 장기렌트 | 월 납부금 비교', seoDescription: 'BMW 4시리즈 장기렌터카 견적. 쿠페·컨버터블·그란쿠페 장기렌트 조건 비교.' },
  { id: 'bmw05', brand: 'BMW', model: '5시리즈', slug: 'bmw-5series', category: '세단', segment: '준대형 세단', fuel: '가솔린', imageKey: 'bmw-5series', trims: [], seoTitle: 'BMW 5시리즈 장기렌트 | 월 납부금 비교', seoDescription: 'BMW 5시리즈 장기렌터카 최저가 견적. 비즈니스 세단 장기렌트 조건을 비교하세요.' },
  { id: 'bmw06', brand: 'BMW', model: '7시리즈', slug: 'bmw-7series', category: '세단', segment: '대형 세단', fuel: '가솔린', imageKey: 'bmw-7series', trims: [], seoTitle: 'BMW 7시리즈 장기렌트 | 월 납부금 비교', seoDescription: 'BMW 7시리즈 장기렌터카 견적. 플래그십 대형 세단 장기렌트 최저가.' },
  { id: 'bmw07', brand: 'BMW', model: '8시리즈', slug: 'bmw-8series', category: '세단', segment: '대형 쿠페', fuel: '가솔린', imageKey: 'bmw-8series', trims: [], seoTitle: 'BMW 8시리즈 장기렌트 | 월 납부금 비교', seoDescription: 'BMW 8시리즈 장기렌터카 견적. 럭셔리 쿠페 장기렌트.' },
  { id: 'bmw08', brand: 'BMW', model: 'i4', slug: 'bmw-i4', category: 'EV', segment: 'EV 그란쿠페', fuel: '전기', imageKey: 'bmw-i4', trims: [], seoTitle: 'BMW i4 장기렌트 | 월 납부금 비교', seoDescription: 'BMW i4 전기차 장기렌터카 견적. 프리미엄 EV 그란쿠페 장기렌트 조건을 비교하세요.' },
  { id: 'bmw09', brand: 'BMW', model: 'i5', slug: 'bmw-i5', category: 'EV', segment: 'EV 준대형 세단', fuel: '전기', imageKey: 'bmw-i5', trims: [], seoTitle: 'BMW i5 장기렌트 | 월 납부금 비교', seoDescription: 'BMW i5 전기차 장기렌터카 견적. 프리미엄 전기 세단 장기렌트.' },
  { id: 'bmw10', brand: 'BMW', model: 'i7', slug: 'bmw-i7', category: 'EV', segment: 'EV 대형 세단', fuel: '전기', imageKey: 'bmw-i7', trims: [], seoTitle: 'BMW i7 장기렌트 | 월 납부금 비교', seoDescription: 'BMW i7 전기차 장기렌터카 견적. 플래그십 EV 대형 세단 장기렌트.' },
  { id: 'bmw11', brand: 'BMW', model: 'iX', slug: 'bmw-ix', category: 'EV', segment: 'EV 대형 SUV', fuel: '전기', imageKey: 'bmw-ix', trims: [], seoTitle: 'BMW iX 장기렌트 | 월 납부금 비교', seoDescription: 'BMW iX 전기차 장기렌터카 견적. 플래그십 EV SUV 장기렌트 최저가.' },
  { id: 'bmw12', brand: 'BMW', model: 'iX1', slug: 'bmw-ix1', category: 'EV', segment: 'EV 소형 SUV', fuel: '전기', imageKey: 'bmw-ix1', trims: [], seoTitle: 'BMW iX1 장기렌트 | 월 납부금 비교', seoDescription: 'BMW iX1 전기차 장기렌터카 견적. 소형 EV SUV 장기렌트 조건 비교.' },
  { id: 'bmw13', brand: 'BMW', model: 'iX2', slug: 'bmw-ix2', category: 'EV', segment: 'EV 소형 SUV', fuel: '전기', imageKey: 'bmw-ix2', trims: [], seoTitle: 'BMW iX2 장기렌트 | 월 납부금 비교', seoDescription: 'BMW iX2 전기차 장기렌터카 견적. 소형 EV SUV 쿠페 장기렌트.' },
  { id: 'bmw14', brand: 'BMW', model: 'M 모델', slug: 'bmw-m', category: '세단', segment: '고성능 M', fuel: '가솔린', imageKey: 'bmw-m', trims: [], seoTitle: 'BMW M 모델 장기렌트 | 월 납부금 비교', seoDescription: 'BMW M2·M3·M4·M5·M8 고성능 모델 장기렌터카 견적.' },
  { id: 'bmw15', brand: 'BMW', model: 'X1', slug: 'bmw-x1', category: 'SUV', segment: '소형 SUV', fuel: '가솔린', imageKey: 'bmw-x1', trims: [], seoTitle: 'BMW X1 장기렌트 | 월 납부금 비교', seoDescription: 'BMW X1 장기렌터카 최저가 견적. 프리미엄 소형 SUV 장기렌트 조건을 비교하세요.' },
  { id: 'bmw16', brand: 'BMW', model: 'X2', slug: 'bmw-x2', category: 'SUV', segment: '소형 SUV 쿠페', fuel: '가솔린', imageKey: 'bmw-x2', trims: [], seoTitle: 'BMW X2 장기렌트 | 월 납부금 비교', seoDescription: 'BMW X2 장기렌터카 견적. 소형 SUV 쿠페 장기렌트.' },
  { id: 'bmw17', brand: 'BMW', model: 'X3', slug: 'bmw-x3', category: 'SUV', segment: '준중형 SUV', fuel: '가솔린', imageKey: 'bmw-x3', trims: [], seoTitle: 'BMW X3 장기렌트 | 월 납부금 비교', seoDescription: 'BMW X3 장기렌터카 최저가 견적. 인기 프리미엄 SUV 장기렌트 조건을 비교하세요.' },
  { id: 'bmw18', brand: 'BMW', model: 'X4', slug: 'bmw-x4', category: 'SUV', segment: '준중형 SUV 쿠페', fuel: '가솔린', imageKey: 'bmw-x4', trims: [], seoTitle: 'BMW X4 장기렌트 | 월 납부금 비교', seoDescription: 'BMW X4 장기렌터카 견적. SUV 쿠페 장기렌트.' },
  { id: 'bmw19', brand: 'BMW', model: 'X4 M', slug: 'bmw-x4-m', category: 'SUV', segment: '준중형 고성능 SUV', fuel: '가솔린', imageKey: 'bmw-x4-m', trims: [], seoTitle: 'BMW X4 M 장기렌트 | 월 납부금 비교', seoDescription: 'BMW X4 M 고성능 SUV 장기렌터카 견적.' },
  { id: 'bmw20', brand: 'BMW', model: 'X5', slug: 'bmw-x5', category: 'SUV', segment: '중형 SUV', fuel: '가솔린', imageKey: 'bmw-x5', trims: [], seoTitle: 'BMW X5 장기렌트 | 월 납부금 비교', seoDescription: 'BMW X5 장기렌터카 최저가 견적. 프리미엄 중형 SUV 장기렌트 조건을 비교하세요.' },
  { id: 'bmw21', brand: 'BMW', model: 'X5 M', slug: 'bmw-x5-m', category: 'SUV', segment: '중형 고성능 SUV', fuel: '가솔린', imageKey: 'bmw-x5-m', trims: [], seoTitle: 'BMW X5 M 장기렌트 | 월 납부금 비교', seoDescription: 'BMW X5 M 고성능 SUV 장기렌터카 견적.' },
  { id: 'bmw22', brand: 'BMW', model: 'X6', slug: 'bmw-x6', category: 'SUV', segment: '대형 SUV 쿠페', fuel: '가솔린', imageKey: 'bmw-x6', trims: [], seoTitle: 'BMW X6 장기렌트 | 월 납부금 비교', seoDescription: 'BMW X6 장기렌터카 견적. 대형 SUV 쿠페 장기렌트.' },
  { id: 'bmw23', brand: 'BMW', model: 'X6 M', slug: 'bmw-x6-m', category: 'SUV', segment: '대형 고성능 SUV', fuel: '가솔린', imageKey: 'bmw-x6-m', trims: [], seoTitle: 'BMW X6 M 장기렌트 | 월 납부금 비교', seoDescription: 'BMW X6 M 고성능 SUV 장기렌터카 견적.' },
  { id: 'bmw24', brand: 'BMW', model: 'X7', slug: 'bmw-x7', category: 'SUV', segment: '대형 SUV', fuel: '가솔린', imageKey: 'bmw-x7', trims: [], seoTitle: 'BMW X7 장기렌트 | 월 납부금 비교', seoDescription: 'BMW X7 장기렌터카 견적. 대형 7인승 프리미엄 SUV 장기렌트 최저가.' },
  { id: 'bmw25', brand: 'BMW', model: 'XM', slug: 'bmw-xm', category: 'SUV', segment: '플래그십 PHEV SUV', fuel: '하이브리드', imageKey: 'bmw-xm', trims: [], seoTitle: 'BMW XM 장기렌트 | 월 납부금 비교', seoDescription: 'BMW XM 플러그인 하이브리드 SUV 장기렌터카 견적.' },
  { id: 'bmw26', brand: 'BMW', model: 'Z4', slug: 'bmw-z4', category: '세단', segment: '로드스터', fuel: '가솔린', imageKey: 'bmw-z4', trims: [], seoTitle: 'BMW Z4 장기렌트 | 월 납부금 비교', seoDescription: 'BMW Z4 로드스터 장기렌터카 견적.' },

  // ═══════════════════════════════════
  // 벤츠 (21종) — 2026-04-29 크롤러 적재 기반
  // 이미지: 미준비 (imageKey='') → 전체차종 페이지 이모지 표시
  // ═══════════════════════════════════
  { id: 'mb01', brand: '벤츠', model: 'A-Class', slug: 'mercedes-a-class', category: '세단', segment: '소형 세단', fuel: '가솔린', imageKey: 'mercedes-a-class', trims: [], seoTitle: '벤츠 A-Class 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 A-Class 장기렌터카 최저가 견적. 프리미엄 소형 세단 장기렌트.' },
  { id: 'mb02', brand: '벤츠', model: 'C-Class', slug: 'mercedes-c-class', category: '세단', segment: '중형 세단', fuel: '가솔린', imageKey: 'mercedes-c-class', trims: [], seoTitle: '벤츠 C-Class 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 C-Class 장기렌터카 최저가 견적. 인기 프리미엄 중형 세단 장기렌트.' },
  { id: 'mb03', brand: '벤츠', model: 'CLA', slug: 'mercedes-cla', category: '세단', segment: '쿠페형 세단', fuel: '가솔린', imageKey: 'mercedes-cla', trims: [], seoTitle: '벤츠 CLA 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 CLA 장기렌터카 견적. 스포티한 쿠페 세단 장기렌트.' },
  { id: 'mb04', brand: '벤츠', model: 'CLE', slug: 'mercedes-cle', category: '세단', segment: '중형 쿠페', fuel: '가솔린', imageKey: 'mercedes-cle', trims: [], seoTitle: '벤츠 CLE 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 CLE 쿠페·카브리올레 장기렌터카 견적.' },
  { id: 'mb05', brand: '벤츠', model: 'E-Class', slug: 'mercedes-e-class', category: '세단', segment: '준대형 세단', fuel: '가솔린', imageKey: 'mercedes-e-class', trims: [], seoTitle: '벤츠 E-Class 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 E-Class 장기렌터카 최저가 견적. 비즈니스 세단 장기렌트 조건 비교.' },
  { id: 'mb06', brand: '벤츠', model: 'S-Class', slug: 'mercedes-s-class', category: '세단', segment: '대형 세단', fuel: '가솔린', imageKey: 'mercedes-s-class', trims: [], seoTitle: '벤츠 S-Class 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 S-Class 장기렌터카 견적. 플래그십 대형 세단 장기렌트.' },
  { id: 'mb07', brand: '벤츠', model: 'SL', slug: 'mercedes-sl', category: '세단', segment: '로드스터', fuel: '가솔린', imageKey: 'mercedes-sl', trims: [], seoTitle: '벤츠 SL 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 SL 로드스터 장기렌터카 견적.' },
  { id: 'mb08', brand: '벤츠', model: 'GLA', slug: 'mercedes-gla', category: 'SUV', segment: '소형 SUV', fuel: '가솔린', imageKey: 'mercedes-gla', trims: [], seoTitle: '벤츠 GLA 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 GLA 장기렌터카 견적. 소형 프리미엄 SUV 장기렌트.' },
  { id: 'mb09', brand: '벤츠', model: 'GLB', slug: 'mercedes-glb', category: 'SUV', segment: '소형 SUV', fuel: '가솔린', imageKey: 'mercedes-glb', trims: [], seoTitle: '벤츠 GLB 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 GLB 장기렌터카 견적. 7인승 소형 SUV 장기렌트.' },
  { id: 'mb10', brand: '벤츠', model: 'GLC', slug: 'mercedes-glc', category: 'SUV', segment: '중형 SUV', fuel: '가솔린', imageKey: 'mercedes-glc', trims: [], seoTitle: '벤츠 GLC 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 GLC 장기렌터카 최저가 견적. 인기 프리미엄 SUV 장기렌트 조건 비교.' },
  { id: 'mb11', brand: '벤츠', model: 'GLC Coupé', slug: 'mercedes-glc-coupe', category: 'SUV', segment: '중형 SUV 쿠페', fuel: '가솔린', imageKey: 'mercedes-glc-coupe', trims: [], seoTitle: '벤츠 GLC 쿠페 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 GLC 쿠페 장기렌터카 견적. SUV 쿠페 장기렌트.' },
  { id: 'mb12', brand: '벤츠', model: 'GLE', slug: 'mercedes-gle', category: 'SUV', segment: '중형 SUV', fuel: '가솔린', imageKey: 'mercedes-gle', trims: [], seoTitle: '벤츠 GLE 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 GLE 장기렌터카 견적. 중형 럭셔리 SUV 장기렌트 최저가.' },
  { id: 'mb13', brand: '벤츠', model: 'GLE Coupé', slug: 'mercedes-gle-coupe', category: 'SUV', segment: '중형 SUV 쿠페', fuel: '가솔린', imageKey: 'mercedes-gle-coupe', trims: [], seoTitle: '벤츠 GLE 쿠페 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 GLE 쿠페 장기렌터카 견적.' },
  { id: 'mb14', brand: '벤츠', model: 'GLS', slug: 'mercedes-gls', category: 'SUV', segment: '대형 SUV', fuel: '가솔린', imageKey: 'mercedes-gls', trims: [], seoTitle: '벤츠 GLS 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 GLS 장기렌터카 견적. 대형 7인승 프리미엄 SUV 장기렌트.' },
  { id: 'mb15', brand: '벤츠', model: 'G-Class', slug: 'mercedes-g-class', category: 'SUV', segment: '오프로드 SUV', fuel: '가솔린', imageKey: 'mercedes-g-class', trims: [], seoTitle: '벤츠 G-Class 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 G-Class 장기렌터카 견적. G바겐 장기렌트 최저가.' },
  { id: 'mb16', brand: '벤츠', model: 'EQA', slug: 'mercedes-eqa', category: 'EV', segment: 'EV 소형 SUV', fuel: '전기', imageKey: 'mercedes-eqa', trims: [], seoTitle: '벤츠 EQA 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 EQA 전기차 장기렌터카 견적. 소형 EV SUV 장기렌트.' },
  { id: 'mb17', brand: '벤츠', model: 'EQB', slug: 'mercedes-eqb', category: 'EV', segment: 'EV 소형 SUV', fuel: '전기', imageKey: 'mercedes-eqb', trims: [], seoTitle: '벤츠 EQB 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 EQB 전기차 장기렌터카 견적. 소형 7인승 EV SUV 장기렌트.' },
  { id: 'mb18', brand: '벤츠', model: 'EQE', slug: 'mercedes-eqe', category: 'EV', segment: 'EV 준대형 세단', fuel: '전기', imageKey: 'mercedes-eqe', trims: [], seoTitle: '벤츠 EQE 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 EQE 전기차 장기렌터카 견적. 프리미엄 EV 세단 장기렌트.' },
  { id: 'mb19', brand: '벤츠', model: 'EQE SUV', slug: 'mercedes-eqe-suv', category: 'EV', segment: 'EV 중형 SUV', fuel: '전기', imageKey: 'mercedes-eqe-suv', trims: [], seoTitle: '벤츠 EQE SUV 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 EQE SUV 전기차 장기렌터카 견적.' },
  { id: 'mb20', brand: '벤츠', model: 'EQS', slug: 'mercedes-eqs', category: 'EV', segment: 'EV 대형 세단', fuel: '전기', imageKey: 'mercedes-eqs', trims: [], seoTitle: '벤츠 EQS 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 EQS 전기차 장기렌터카 견적. 플래그십 EV 세단 장기렌트.' },
  { id: 'mb21', brand: '벤츠', model: 'EQS SUV', slug: 'mercedes-eqs-suv', category: 'EV', segment: 'EV 대형 SUV', fuel: '전기', imageKey: 'mercedes-eqs-suv', trims: [], seoTitle: '벤츠 EQS SUV 장기렌트 | 월 납부금 비교', seoDescription: '메르세데스-벤츠 EQS SUV 전기차 장기렌터카 견적. 플래그십 EV SUV 장기렌트.' },

  { id: 'porsche01', brand: '포르쉐', model: 'Macan', slug: 'porsche-macan', category: 'EV', segment: 'EV 소형 SUV', fuel: '전기', imageKey: 'porsche-macan', trims: [], seoTitle: '포르쉐 Macan 장기렌트 | 월 납부금 비교', seoDescription: '포르쉐 Macan 전기차 장기렌터카 견적. 프리미엄 EV 소형 SUV 장기렌트 조건을 비교하세요.' },
  { id: 'porsche02', brand: '포르쉐', model: 'Taycan', slug: 'porsche-taycan', category: 'EV', segment: 'EV 스포츠 세단', fuel: '전기', imageKey: 'porsche-taycan', trims: [], seoTitle: '포르쉐 Taycan 장기렌트 | 월 납부금 비교', seoDescription: '포르쉐 Taycan 전기차 장기렌터카 견적. 스포츠 EV 세단 장기렌트 최저가.' },
  { id: 'porsche03', brand: '포르쉐', model: 'Taycan Cross Turismo', slug: 'porsche-taycan-cross-turismo', category: 'EV', segment: 'EV 스포츠 왜건', fuel: '전기', imageKey: 'porsche-taycan-cross-turismo', trims: [], seoTitle: '포르쉐 Taycan Cross Turismo 장기렌트 | 월 납부금 비교', seoDescription: '포르쉐 Taycan Cross Turismo 전기차 장기렌터카 견적. EV 스포츠 왜건 장기렌트.' },
  { id: 'porsche04', brand: '포르쉐', model: '911', slug: 'porsche-911', category: '세단', segment: '스포츠카', fuel: '가솔린', imageKey: 'porsche-911', trims: [], seoTitle: '포르쉐 911 장기렌트 | 월 납부금 비교', seoDescription: '포르쉐 911 장기렌터카 견적. 전설적인 스포츠카 장기렌트 조건을 비교하세요.' },
  { id: 'porsche05', brand: '포르쉐', model: 'Cayman', slug: 'porsche-cayman', category: '세단', segment: '미드십 스포츠카', fuel: '가솔린', imageKey: 'porsche-cayman', trims: [], seoTitle: '포르쉐 Cayman 장기렌트 | 월 납부금 비교', seoDescription: '포르쉐 Cayman GTS 장기렌터카 견적. 미드십 스포츠쿠페 장기렌트.' },
  { id: 'porsche06', brand: '포르쉐', model: 'Boxster', slug: 'porsche-boxster', category: '세단', segment: '로드스터', fuel: '가솔린', imageKey: 'porsche-boxster', trims: [], seoTitle: '포르쉐 Boxster 장기렌트 | 월 납부금 비교', seoDescription: '포르쉐 Boxster GTS 장기렌터카 견적. 오픈탑 스포츠 로드스터 장기렌트.' },
  { id: 'porsche07', brand: '포르쉐', model: 'Cayenne', slug: 'porsche-cayenne', category: 'SUV', segment: '대형 SUV', fuel: '가솔린/전기', imageKey: 'porsche-cayenne', trims: [], seoTitle: '포르쉐 Cayenne 장기렌트 | 월 납부금 비교', seoDescription: '포르쉐 Cayenne 장기렌터카 견적. 가솔린·하이브리드·전기 대형 SUV 장기렌트 비교.' },
  { id: 'porsche08', brand: '포르쉐', model: 'Cayenne Coupé', slug: 'porsche-cayenne-coupe', category: 'SUV', segment: '대형 SUV 쿠페', fuel: '가솔린', imageKey: 'porsche-cayenne-coupe', trims: [], seoTitle: '포르쉐 Cayenne Coupé 장기렌트 | 월 납부금 비교', seoDescription: '포르쉐 Cayenne Coupé 장기렌터카 견적. 스포티한 대형 SUV 쿠페 장기렌트.' },
  { id: 'porsche09', brand: '포르쉐', model: 'Panamera', slug: 'porsche-panamera', category: '세단', segment: '대형 스포츠 세단', fuel: '가솔린', imageKey: 'porsche-panamera', trims: [], seoTitle: '포르쉐 Panamera 장기렌트 | 월 납부금 비교', seoDescription: '포르쉐 Panamera 장기렌터카 견적. 대형 스포츠 세단 장기렌트 조건을 비교하세요.' },

  { id: 'mini01', brand: '미니', model: 'Cooper 5-Door', slug: 'mini-cooper-5door', category: 'SUV', segment: '소형 해치백', fuel: '가솔린', imageKey: 'mini-cooper-5door', trims: [], seoTitle: 'MINI Cooper 5-Door 장기렌트 | 월 납부금 비교', seoDescription: 'MINI Cooper 5도어 장기렌터카 견적. 프리미엄 소형 해치백 장기렌트 조건을 비교하세요.' },
  { id: 'mini02', brand: '미니', model: 'Cooper 3-Door', slug: 'mini-cooper-3door', category: '세단', segment: '소형 해치백', fuel: '가솔린', imageKey: 'mini-cooper-3door', trims: [], seoTitle: 'MINI Cooper 3-Door 장기렌트 | 월 납부금 비교', seoDescription: 'MINI Cooper 3도어 장기렌터카 견적. 클래식 소형 해치백 장기렌트.' },
  { id: 'mini03', brand: '미니', model: 'Cooper Convertible', slug: 'mini-cooper-convertible', category: '세단', segment: '소형 컨버터블', fuel: '가솔린', imageKey: 'mini-cooper-convertible', trims: [], seoTitle: 'MINI Cooper Convertible 장기렌트 | 월 납부금 비교', seoDescription: 'MINI Cooper Convertible 장기렌터카 견적. 오픈탑 소형 컨버터블 장기렌트.' },
  { id: 'mini04', brand: '미니', model: 'Countryman', slug: 'mini-countryman', category: 'SUV', segment: '소형 SUV', fuel: '가솔린', imageKey: 'mini-countryman', trims: [], seoTitle: 'MINI Countryman 장기렌트 | 월 납부금 비교', seoDescription: 'MINI Countryman 장기렌터카 견적. 소형 프리미엄 SUV 장기렌트 조건을 비교하세요.' },
  { id: 'mini05', brand: '미니', model: 'Cooper Electric', slug: 'mini-cooper-electric', category: 'EV', segment: 'EV 소형 해치백', fuel: '전기', imageKey: 'mini-cooper-electric', trims: [], seoTitle: 'MINI Cooper Electric 장기렌트 | 월 납부금 비교', seoDescription: 'MINI Cooper 전기차 장기렌터카 견적. 프리미엄 EV 소형 해치백 장기렌트.' },
  { id: 'mini06', brand: '미니', model: 'Aceman', slug: 'mini-aceman', category: 'EV', segment: 'EV 소형 크로스오버', fuel: '전기', imageKey: 'mini-aceman', trims: [], seoTitle: 'MINI Aceman 장기렌트 | 월 납부금 비교', seoDescription: 'MINI Aceman 전기차 장기렌터카 견적. EV 소형 크로스오버 장기렌트.' },
  { id: 'mini07', brand: '미니', model: 'Countryman Electric', slug: 'mini-countryman-electric', category: 'EV', segment: 'EV 소형 SUV', fuel: '전기', imageKey: 'mini-countryman-electric', trims: [], seoTitle: 'MINI Countryman Electric 장기렌트 | 월 납부금 비교', seoDescription: 'MINI Countryman 전기차 장기렌터카 견적. EV 소형 SUV 장기렌트.' },

  { id: 'lr01', brand: '랜드로버', model: 'Defender', slug: 'land-rover-defender', category: 'SUV', segment: '대형 오프로드 SUV', fuel: '가솔린/디젤', imageKey: 'land-rover-defender', trims: [], seoTitle: '랜드로버 Defender 장기렌트 | 월 납부금 비교', seoDescription: '랜드로버 Defender 장기렌터카 견적. 아이코닉 오프로드 SUV 장기렌트 조건을 비교하세요.' },
  { id: 'lr02', brand: '랜드로버', model: 'Discovery', slug: 'land-rover-discovery', category: 'SUV', segment: '대형 SUV', fuel: '가솔린', imageKey: 'land-rover-discovery', trims: [], seoTitle: '랜드로버 Discovery 장기렌트 | 월 납부금 비교', seoDescription: '랜드로버 Discovery 장기렌터카 견적. 7인승 대형 SUV 장기렌트.' },
  { id: 'lr03', brand: '랜드로버', model: 'Discovery Sport', slug: 'land-rover-discovery-sport', category: 'SUV', segment: '중형 SUV', fuel: '가솔린', imageKey: 'land-rover-discovery-sport', trims: [], seoTitle: '랜드로버 Discovery Sport 장기렌트 | 월 납부금 비교', seoDescription: '랜드로버 Discovery Sport 장기렌터카 견적. 5~7인승 중형 SUV 장기렌트.' },
  { id: 'lr04', brand: '랜드로버', model: 'Range Rover', slug: 'land-rover-range-rover', category: 'SUV', segment: '풀사이즈 럭셔리 SUV', fuel: '가솔린', imageKey: 'land-rover-range-rover', trims: [], seoTitle: '랜드로버 Range Rover 장기렌트 | 월 납부금 비교', seoDescription: '랜드로버 Range Rover 장기렌터카 견적. 최고급 풀사이즈 럭셔리 SUV 장기렌트.' },
  { id: 'lr05', brand: '랜드로버', model: 'Range Rover Sport', slug: 'land-rover-range-rover-sport', category: 'SUV', segment: '대형 스포츠 SUV', fuel: '가솔린', imageKey: 'land-rover-range-rover-sport', trims: [], seoTitle: '랜드로버 Range Rover Sport 장기렌트 | 월 납부금 비교', seoDescription: '랜드로버 Range Rover Sport 장기렌터카 견적. 스포티한 대형 럭셔리 SUV 장기렌트.' },
  { id: 'lr06', brand: '랜드로버', model: 'Range Rover Velar', slug: 'land-rover-range-rover-velar', category: 'SUV', segment: '중형 SUV 쿠페', fuel: '가솔린', imageKey: 'land-rover-range-rover-velar', trims: [], seoTitle: '랜드로버 Range Rover Velar 장기렌트 | 월 납부금 비교', seoDescription: '랜드로버 Range Rover Velar 장기렌터카 견적. 디자인 중심 중형 SUV 장기렌트.' },
  { id: 'lr07', brand: '랜드로버', model: 'Range Rover Evoque', slug: 'land-rover-range-rover-evoque', category: 'SUV', segment: '소형 럭셔리 SUV', fuel: '가솔린', imageKey: 'land-rover-range-rover-evoque', trims: [], seoTitle: '랜드로버 Range Rover Evoque 장기렌트 | 월 납부금 비교', seoDescription: '랜드로버 Range Rover Evoque 장기렌터카 견적. 프리미엄 소형 SUV 장기렌트.' },
];

// 유틸리티 함수
export function getVehicleBySlug(slug: string): Vehicle | undefined {
  return VEHICLE_LIST.find((v) => v.slug === slug);
}


export function getVehiclesByBrand(brand: Brand): Vehicle[] {
  return VEHICLE_LIST.filter((v) => v.brand === brand);
}

export function getVehiclesByCategory(category: Category): Vehicle[] {
  return VEHICLE_LIST.filter((v) => v.category === category);
}

export function getAllSlugs(): string[] {
  return VEHICLE_LIST.map((v) => v.slug);
}
