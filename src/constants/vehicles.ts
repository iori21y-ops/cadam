export type Category = '세단' | 'SUV' | 'EV' | '다목적' | '트럭';
export type Brand = '현대' | '기아' | '제네시스' | '르노코리아' | 'KGM';

export interface Vehicle {
  id: string;
  brand: Brand;
  model: string;
  slug: string;
  category: Category;
  segment: string;
  fuel: string;
  imageKey: string; // public/cars/{imageKey}.webp
  trims: string[];
  seoTitle: string;
  seoDescription: string;
}

export const VEHICLE_LIST: Vehicle[] = [
  // ═══════════════════════════════════
  // 현대 (21종)
  // ═══════════════════════════════════
  { id: 'h01', brand: '현대', model: '캐스퍼', slug: 'casper', category: '세단', segment: '경차', fuel: '가솔린', imageKey: 'hyundai-casper', trims: ['스마트', '인스퍼레이션'], seoTitle: '캐스퍼 장기렌트 | 월 납부금 비교', seoDescription: '현대 캐스퍼 장기렌터카 최저가 견적. 경차 장기렌트 월 납부금을 비교해 보세요.' },
  { id: 'h02', brand: '현대', model: '아반떼 (CN7)', slug: 'avante', category: '세단', segment: '준중형', fuel: '가솔린', imageKey: 'hyundai-avante', trims: ['스마트', '프리미엄', '인스퍼레이션'], seoTitle: '아반떼 장기렌트 | 월 납부금 비교', seoDescription: '현대 아반떼 장기렌터카 최저가 견적. 36~60개월 조건별 월 납부금을 비교해 보세요.' },
  { id: 'h03', brand: '현대', model: '아반떼 하이브리드', slug: 'avante-hybrid', category: '세단', segment: '준중형', fuel: '하이브리드', imageKey: 'hyundai-avante-hybrid', trims: ['스마트', '프리미엄', '인스퍼레이션'], seoTitle: '아반떼 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '현대 아반떼 하이브리드 장기렌터카. 연비 좋은 하이브리드 장기렌트 견적을 받아보세요.' },
  { id: 'h04', brand: '현대', model: '쏘나타 (DN8)', slug: 'sonata', category: '세단', segment: '중형', fuel: '가솔린', imageKey: 'hyundai-sonata', trims: ['프리미엄', '인스퍼레이션', '캘리그래피'], seoTitle: '쏘나타 장기렌트 | 월 납부금 비교', seoDescription: '현대 쏘나타 장기렌터카 최저가 견적. 중형 세단 장기렌트 조건을 비교해 보세요.' },
  { id: 'h05', brand: '현대', model: '쏘나타 하이브리드', slug: 'sonata-hybrid', category: '세단', segment: '중형', fuel: '하이브리드', imageKey: 'hyundai-sonata-hybrid', trims: ['프리미엄', '인스퍼레이션', '캘리그래피'], seoTitle: '쏘나타 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '현대 쏘나타 하이브리드 장기렌터카. 연비와 성능을 모두 갖춘 장기렌트 견적.' },
  { id: 'h06', brand: '현대', model: '그랜저 (GN7)', slug: 'grandeur', category: '세단', segment: '준대형', fuel: '가솔린', imageKey: 'hyundai-grandeur', trims: ['프리미엄', '캘리그래피', '르블랑'], seoTitle: '그랜저 장기렌트 | 월 납부금 비교', seoDescription: '현대 그랜저 장기렌터카 최저가 견적. 준대형 세단 장기렌트 월 납부금을 비교해 보세요.' },
  { id: 'h07', brand: '현대', model: '그랜저 하이브리드', slug: 'grandeur-hybrid', category: '세단', segment: '준대형', fuel: '하이브리드', imageKey: 'hyundai-grandeur-hybrid', trims: ['프리미엄', '캘리그래피', '르블랑'], seoTitle: '그랜저 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '현대 그랜저 하이브리드 장기렌터카. 프리미엄 하이브리드 장기렌트 견적.' },
  { id: 'h08', brand: '현대', model: '코나 (SX2)', slug: 'kona', category: 'SUV', segment: '소형 SUV', fuel: '가솔린', imageKey: 'hyundai-kona', trims: ['스마트', '프리미엄', '인스퍼레이션'], seoTitle: '코나 장기렌트 | 월 납부금 비교', seoDescription: '현대 코나 장기렌터카. 소형 SUV 장기렌트 견적을 비교해 보세요.' },
  { id: 'h09', brand: '현대', model: '코나 하이브리드', slug: 'kona-hybrid', category: 'SUV', segment: '소형 SUV', fuel: '하이브리드', imageKey: 'hyundai-kona-hybrid', trims: ['스마트', '프리미엄', '인스퍼레이션'], seoTitle: '코나 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '현대 코나 하이브리드 장기렌터카. 연비 좋은 소형 SUV 장기렌트.' },
  { id: 'h10', brand: '현대', model: '투싼 (NX4)', slug: 'tucson', category: 'SUV', segment: '준중형 SUV', fuel: '가솔린', imageKey: 'hyundai-tucson', trims: ['모던', '프리미엄', '인스퍼레이션', '캘리그래피'], seoTitle: '투싼 장기렌트 | 월 납부금 비교', seoDescription: '현대 투싼 장기렌터카 최저가 견적. 인기 SUV 장기렌트 조건을 비교해 보세요.' },
  { id: 'h11', brand: '현대', model: '투싼 하이브리드', slug: 'tucson-hybrid', category: 'SUV', segment: '준중형 SUV', fuel: '하이브리드', imageKey: 'hyundai-tucson-hybrid', trims: ['모던', '프리미엄', '인스퍼레이션'], seoTitle: '투싼 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '현대 투싼 하이브리드 장기렌터카. 연비 좋은 SUV 장기렌트 견적.' },
  { id: 'h12', brand: '현대', model: '싼타페 (MX5)', slug: 'santafe', category: 'SUV', segment: '중형 SUV', fuel: '가솔린', imageKey: 'hyundai-santafe', trims: ['프리미엄', '캘리그래피', '캘리그래피 7인승'], seoTitle: '싼타페 장기렌트 | 월 납부금 비교', seoDescription: '현대 싼타페 장기렌터카. 중형 SUV 장기렌트 견적을 비교해 보세요.' },
  { id: 'h13', brand: '현대', model: '싼타페 하이브리드', slug: 'santafe-hybrid', category: 'SUV', segment: '중형 SUV', fuel: '하이브리드', imageKey: 'hyundai-santafe-hybrid', trims: ['프리미엄', '캘리그래피', '캘리그래피 7인승'], seoTitle: '싼타페 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '현대 싼타페 하이브리드 장기렌터카. 패밀리 SUV 하이브리드 장기렌트.' },
  { id: 'h14', brand: '현대', model: '팰리세이드 (LX2)', slug: 'palisade', category: 'SUV', segment: '대형 SUV', fuel: '디젤', imageKey: 'hyundai-palisade', trims: ['르블랑', '캘리그래피', '캘리그래피 7인승'], seoTitle: '팰리세이드 장기렌트 | 월 납부금 비교', seoDescription: '현대 팰리세이드 장기렌터카. 대형 SUV 장기렌트 최저가 견적.' },
  { id: 'h15', brand: '현대', model: '코나 일렉트릭', slug: 'kona-ev', category: 'EV', segment: '소형 SUV (EV)', fuel: '전기', imageKey: 'hyundai-kona-ev', trims: ['스탠다드', '롱레인지', '롱레인지 프리미엄'], seoTitle: '코나 일렉트릭 장기렌트 | 월 납부금 비교', seoDescription: '현대 코나 전기차 장기렌터카. 전기차 장기렌트 혜택과 견적을 확인하세요.' },
  { id: 'h16', brand: '현대', model: '아이오닉 5 (NE1)', slug: 'ioniq5', category: 'EV', segment: '중형 SUV (EV)', fuel: '전기', imageKey: 'hyundai-ioniq5', trims: ['스탠다드', '롱레인지', '롱레인지 프리미엄', '롱레인지 익스클루시브'], seoTitle: '아이오닉5 장기렌트 | 월 납부금 비교', seoDescription: '현대 아이오닉5 장기렌터카. 전기차 장기렌트 조건과 월 납부금을 비교해 보세요.' },
  { id: 'h17', brand: '현대', model: '아이오닉 6 (CE1)', slug: 'ioniq6', category: 'EV', segment: '중형 세단 (EV)', fuel: '전기', imageKey: 'hyundai-ioniq6', trims: ['스탠다드', '롱레인지', '롱레인지 프리미엄', '롱레인지 익스클루시브'], seoTitle: '아이오닉6 장기렌트 | 월 납부금 비교', seoDescription: '현대 아이오닉6 장기렌터카. 전기 세단 장기렌트 최저가 견적.' },
  { id: 'h18', brand: '현대', model: '스타리아', slug: 'staria', category: '다목적', segment: '다목적', fuel: '디젤', imageKey: 'hyundai-staria', trims: ['투어러 9인승', '라운지 7인승', '라운지 9인승'], seoTitle: '스타리아 장기렌트 | 월 납부금 비교', seoDescription: '현대 스타리아 장기렌터카. 다목적 차량 장기렌트 견적.' },
  { id: 'h19', brand: '현대', model: '포터 II', slug: 'porter2', category: '트럭', segment: '1톤 트럭', fuel: '디젤', imageKey: 'hyundai-porter2', trims: ['슈퍼캡', '더블캡'], seoTitle: '포터2 장기렌트 | 월 납부금 비교', seoDescription: '현대 포터2 장기렌터카. 1톤 트럭 장기렌트 사업자 전용 견적.' },
  { id: 'h20', brand: '현대', model: '캐스퍼 일렉트릭', slug: 'casper-ev', category: 'EV', segment: '경차 (EV)', fuel: '전기', imageKey: 'hyundai-casper-ev', trims: ['스마트', '프리미엄', '인스퍼레이션'], seoTitle: '캐스퍼 일렉트릭 장기렌트 | 월 납부금 비교', seoDescription: '현대 캐스퍼 일렉트릭 장기렌터카. 경차 전기차 장기렌트 최저가 견적을 확인하세요.' },
  { id: 'h21', brand: '현대', model: '아이오닉9', slug: 'ioniq9', category: 'EV', segment: '대형 SUV (EV)', fuel: '전기', imageKey: 'hyundai-ioniq9', trims: ['스탠다드', '롱레인지', '롱레인지 프리미엄'], seoTitle: '아이오닉9 장기렌트 | 월 납부금 비교', seoDescription: '현대 아이오닉9 장기렌터카. 플래그십 대형 전기 SUV 장기렌트 최저가 견적.' },

  // ═══════════════════════════════════
  // 기아 (23종)
  // ═══════════════════════════════════
  { id: 'k01', brand: '기아', model: '모닝', slug: 'morning', category: '세단', segment: '경차', fuel: '가솔린', imageKey: 'kia-morning', trims: ['트렌디', '프레스티지', '시그니처'], seoTitle: '모닝 장기렌트 | 월 납부금 비교', seoDescription: '기아 모닝 장기렌터카. 경차 장기렌트 최저가 견적을 확인하세요.' },
  { id: 'k02', brand: '기아', model: '레이', slug: 'ray', category: '세단', segment: '경차', fuel: '가솔린', imageKey: 'kia-ray', trims: ['트렌디', '프레스티지', '시그니처'], seoTitle: '레이 장기렌트 | 월 납부금 비교', seoDescription: '기아 레이 장기렌터카. 넓은 경차 장기렌트 견적.' },
  { id: 'k03', brand: '기아', model: 'K3', slug: 'k3', category: '세단', segment: '준중형', fuel: '가솔린', imageKey: 'kia-k3', trims: ['트렌디', '프레스티지', '시그니처'], seoTitle: 'K3 장기렌트 | 월 납부금 비교', seoDescription: '기아 K3 장기렌터카. 준중형 세단 장기렌트 견적을 비교해 보세요.' },
  { id: 'k04', brand: '기아', model: 'K5', slug: 'k5', category: '세단', segment: '중형', fuel: '가솔린', imageKey: 'kia-k5', trims: ['트렌디', '프레스티지', '시그니처', '그래비티'], seoTitle: 'K5 장기렌트 | 월 납부금 비교', seoDescription: '기아 K5 장기렌터카 최저가 견적. 중형 세단 장기렌트 조건을 비교하세요.' },
  { id: 'k05', brand: '기아', model: 'K5 하이브리드', slug: 'k5-hybrid', category: '세단', segment: '중형', fuel: '하이브리드', imageKey: 'kia-k5-hybrid', trims: ['트렌디', '프레스티지', '시그니처', '그래비티'], seoTitle: 'K5 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '기아 K5 하이브리드 장기렌터카. 연비 좋은 중형 세단 장기렌트.' },
  { id: 'k06', brand: '기아', model: 'K8', slug: 'k8', category: '세단', segment: '준대형', fuel: '가솔린', imageKey: 'kia-k8', trims: ['프레스티지', '시그니처', '시그니처 AWD'], seoTitle: 'K8 장기렌트 | 월 납부금 비교', seoDescription: '기아 K8 장기렌터카. 준대형 세단 장기렌트 견적을 확인하세요.' },
  { id: 'k07', brand: '기아', model: 'K8 하이브리드', slug: 'k8-hybrid', category: '세단', segment: '준대형', fuel: '하이브리드', imageKey: 'kia-k8-hybrid', trims: ['프레스티지', '시그니처'], seoTitle: 'K8 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '기아 K8 하이브리드 장기렌터카. 프리미엄 하이브리드 장기렌트.' },
  { id: 'k08', brand: '기아', model: 'K9', slug: 'k9', category: '세단', segment: '대형', fuel: '가솔린', imageKey: 'kia-k9', trims: ['마스터즈', '마스터즈 AWD'], seoTitle: 'K9 장기렌트 | 월 납부금 비교', seoDescription: '기아 K9 장기렌터카. 대형 세단 장기렌트 최저가 견적.' },
  { id: 'k09', brand: '기아', model: '셀토스', slug: 'seltos', category: 'SUV', segment: '소형 SUV', fuel: '가솔린', imageKey: 'kia-seltos', trims: ['트렌디', '프레스티지', '시그니처', '그래비티'], seoTitle: '셀토스 장기렌트 | 월 납부금 비교', seoDescription: '기아 셀토스 장기렌터카. 소형 SUV 장기렌트 견적을 비교하세요.' },
  { id: 'k10', brand: '기아', model: '스포티지 (NQ5)', slug: 'sportage', category: 'SUV', segment: '준중형 SUV', fuel: '가솔린', imageKey: 'kia-sportage', trims: ['트렌디', '프레스티지', '시그니처', '그래비티'], seoTitle: '스포티지 장기렌트 | 월 납부금 비교', seoDescription: '기아 스포티지 장기렌터카 최저가 견적. 인기 SUV 장기렌트 조건 비교.' },
  { id: 'k11', brand: '기아', model: '스포티지 하이브리드', slug: 'sportage-hybrid', category: 'SUV', segment: '준중형 SUV', fuel: '하이브리드', imageKey: 'kia-sportage-hybrid', trims: ['트렌디', '프레스티지', '시그니처', '그래비티'], seoTitle: '스포티지 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '기아 스포티지 하이브리드 장기렌터카. 연비 좋은 SUV 장기렌트.' },
  { id: 'k12', brand: '기아', model: '쏘렌토 (MQ4)', slug: 'sorento', category: 'SUV', segment: '중형 SUV', fuel: '가솔린', imageKey: 'kia-sorento', trims: ['프레스티지', '시그니처', '그래비티', '그래비티 7인승'], seoTitle: '쏘렌토 장기렌트 | 월 납부금 비교', seoDescription: '기아 쏘렌토 장기렌터카. 중형 SUV 장기렌트 견적을 확인하세요.' },
  { id: 'k13', brand: '기아', model: '쏘렌토 하이브리드', slug: 'sorento-hybrid', category: 'SUV', segment: '중형 SUV', fuel: '하이브리드', imageKey: 'kia-sorento-hybrid', trims: ['프레스티지', '시그니처', '그래비티'], seoTitle: '쏘렌토 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '기아 쏘렌토 하이브리드 장기렌터카. 패밀리 SUV 하이브리드 장기렌트.' },
  { id: 'k14', brand: '기아', model: '모하비', slug: 'mohave', category: 'SUV', segment: '대형 SUV', fuel: '디젤', imageKey: 'kia-mohave', trims: ['프레스티지', '시그니처', '그래비티'], seoTitle: '모하비 장기렌트 | 월 납부금 비교', seoDescription: '기아 모하비 장기렌터카. 대형 SUV 장기렌트 최저가 견적.' },
  { id: 'k15', brand: '기아', model: 'EV3', slug: 'ev3', category: 'EV', segment: '소형 SUV (EV)', fuel: '전기', imageKey: 'kia-ev3', trims: ['에어', '어스', '어스 롱레인지'], seoTitle: 'EV3 장기렌트 | 월 납부금 비교', seoDescription: '기아 EV3 장기렌터카. 전기차 소형 SUV 장기렌트 견적.' },
  { id: 'k16', brand: '기아', model: 'EV6', slug: 'ev6', category: 'EV', segment: '중형 CUV (EV)', fuel: '전기', imageKey: 'kia-ev6', trims: ['스탠다드', '롱레인지', '롱레인지 프레스티지', 'GT-Line'], seoTitle: 'EV6 장기렌트 | 월 납부금 비교', seoDescription: '기아 EV6 장기렌터카. 전기차 장기렌트 혜택과 견적을 확인하세요.' },
  { id: 'k17', brand: '기아', model: 'EV9', slug: 'ev9', category: 'EV', segment: '대형 SUV (EV)', fuel: '전기', imageKey: 'kia-ev9', trims: ['에어', '어스', '어스 7인승'], seoTitle: 'EV9 장기렌트 | 월 납부금 비교', seoDescription: '기아 EV9 장기렌터카. 대형 전기 SUV 장기렌트 최저가 견적.' },
  { id: 'k18', brand: '기아', model: '카니발 (KA4)', slug: 'carnival', category: '다목적', segment: '다목적', fuel: '디젤', imageKey: 'kia-carnival', trims: ['프레스티지 7인승', '시그니처 7인승', '시그니처 9인승', '노블레스'], seoTitle: '카니발 장기렌트 | 월 납부금 비교', seoDescription: '기아 카니발 장기렌터카. 다목적 차량 장기렌트 견적을 확인하세요.' },
  { id: 'k19', brand: '기아', model: '봉고 III', slug: 'bongo3', category: '트럭', segment: '1톤 트럭', fuel: '디젤', imageKey: 'kia-bongo3', trims: ['킹캡', '더블캡', '1톤'], seoTitle: '봉고3 장기렌트 | 월 납부금 비교', seoDescription: '기아 봉고3 장기렌터카. 1톤 트럭 사업자 장기렌트 견적.' },
  { id: 'k20', brand: '기아', model: '니로 하이브리드', slug: 'niro', category: 'SUV', segment: '소형 SUV', fuel: '하이브리드', imageKey: 'kia-niro', trims: ['트렌디', '프레스티지', '시그니처'], seoTitle: '니로 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '기아 니로 하이브리드 장기렌터카. 연비 좋은 소형 SUV 하이브리드 장기렌트 견적.' },
  { id: 'k21', brand: '기아', model: '니로 플러그인 하이브리드', slug: 'niro-phev', category: 'SUV', segment: '소형 SUV', fuel: '플러그인 하이브리드', imageKey: 'kia-niro-plus', trims: ['트렌디', '프레스티지', '시그니처'], seoTitle: '니로 플러그인 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '기아 니로 플러그인 하이브리드 장기렌터카. 전기+하이브리드 소형 SUV 장기렌트 견적.' },
  { id: 'k22', brand: '기아', model: '니로 EV', slug: 'niro-ev', category: 'EV', segment: '소형 SUV (EV)', fuel: '전기', imageKey: 'kia-niro-ev', trims: ['에어', '어스', '어스 롱레인지'], seoTitle: '니로 EV 장기렌트 | 월 납부금 비교', seoDescription: '기아 니로 EV 장기렌터카. 소형 전기 SUV 장기렌트 최저가 견적을 확인하세요.' },
  { id: 'k23', brand: '기아', model: '레이 EV', slug: 'ray-ev', category: 'EV', segment: '경차 (EV)', fuel: '전기', imageKey: 'kia-ray-ev', trims: ['에어', '어스'], seoTitle: '레이 EV 장기렌트 | 월 납부금 비교', seoDescription: '기아 레이 EV 장기렌터카. 전기 경차 장기렌트 최저가 견적을 확인하세요.' },

  // ═══════════════════════════════════
  // 제네시스 (7종)
  // ═══════════════════════════════════
  { id: 'g01', brand: '제네시스', model: 'G70', slug: 'g70', category: '세단', segment: '스포츠 세단', fuel: '가솔린', imageKey: 'genesis-g70', trims: ['2.0T', '2.0T 스포츠', '3.3T 스포츠'], seoTitle: 'G70 장기렌트 | 월 납부금 비교', seoDescription: '제네시스 G70 장기렌터카. 스포츠 세단 장기렌트 견적을 확인하세요.' },
  { id: 'g02', brand: '제네시스', model: 'G80', slug: 'g80', category: '세단', segment: '대형 세단', fuel: '가솔린', imageKey: 'genesis-g80', trims: ['2.5T', '2.5T AWD', '3.5T', '전동화(EV)'], seoTitle: 'G80 장기렌트 | 월 납부금 비교', seoDescription: '제네시스 G80 장기렌터카. 프리미엄 세단 장기렌트 최저가 견적.' },
  { id: 'g03', brand: '제네시스', model: 'G90', slug: 'g90', category: '세단', segment: '플래그십', fuel: '가솔린', imageKey: 'genesis-g90', trims: ['3.5T', '3.5T AWD', '롱휠베이스'], seoTitle: 'G90 장기렌트 | 월 납부금 비교', seoDescription: '제네시스 G90 장기렌터카. 플래그십 세단 장기렌트 견적.' },
  { id: 'g04', brand: '제네시스', model: 'GV60', slug: 'gv60', category: 'EV', segment: '소형 SUV (EV)', fuel: '전기', imageKey: 'genesis-gv60', trims: ['스탠다드', '퍼포먼스'], seoTitle: 'GV60 장기렌트 | 월 납부금 비교', seoDescription: '제네시스 GV60 장기렌터카. 프리미엄 전기차 SUV 장기렌트.' },
  { id: 'g05', brand: '제네시스', model: 'GV70', slug: 'gv70', category: 'SUV', segment: '중형 SUV', fuel: '가솔린', imageKey: 'genesis-gv70', trims: ['2.5T', '2.5T AWD', '2.2D', '전동화(EV)'], seoTitle: 'GV70 장기렌트 | 월 납부금 비교', seoDescription: '제네시스 GV70 장기렌터카. 프리미엄 SUV 장기렌트 견적을 비교하세요.' },
  { id: 'g06', brand: '제네시스', model: 'GV80', slug: 'gv80', category: 'SUV', segment: '대형 SUV', fuel: '가솔린', imageKey: 'genesis-gv80', trims: ['2.5T', '2.5T AWD', '3.5T', '3.5T AWD'], seoTitle: 'GV80 장기렌트 | 월 납부금 비교', seoDescription: '제네시스 GV80 장기렌터카. 대형 SUV 장기렌트 최저가 견적.' },
  { id: 'g07', brand: '제네시스', model: 'GV80 쿠페', slug: 'gv80-coupe', category: 'SUV', segment: '대형 SUV 쿠페', fuel: '가솔린', imageKey: 'genesis-gv80-coupe', trims: ['2.5T', '3.5T', '3.5T AWD'], seoTitle: 'GV80 쿠페 장기렌트 | 월 납부금 비교', seoDescription: '제네시스 GV80 쿠페 장기렌터카. 프리미엄 SUV 쿠페 장기렌트 견적.' },

  // ═══════════════════════════════════
  // 르노코리아 (5종)
  // ═══════════════════════════════════
  { id: 'rk01', brand: '르노코리아', model: 'QM6', slug: 'qm6', category: 'SUV', segment: '중형 SUV', fuel: '가솔린/LPG', imageKey: 'renault-qm6', trims: ['LE', 'RE', 'RE 시그니처'], seoTitle: 'QM6 장기렌트 | 월 납부금 비교', seoDescription: '르노코리아 QM6 장기렌터카. 중형 SUV 가솔린·LPG 장기렌트 견적을 확인하세요.' },
  { id: 'rk02', brand: '르노코리아', model: 'XM3', slug: 'xm3', category: 'SUV', segment: '소형 SUV', fuel: '가솔린', imageKey: 'renault-xm3', trims: ['LE', 'RE', 'RE 오라'], seoTitle: 'XM3 장기렌트 | 월 납부금 비교', seoDescription: '르노코리아 XM3 장기렌터카. 감각적인 소형 SUV 장기렌트 견적.' },
  { id: 'rk03', brand: '르노코리아', model: 'XM3 하이브리드', slug: 'xm3-hybrid', category: 'SUV', segment: '소형 SUV', fuel: '하이브리드', imageKey: 'renault-xm3-hybrid', trims: ['RE 하이브리드', 'RE 오라 하이브리드'], seoTitle: 'XM3 하이브리드 장기렌트 | 월 납부금 비교', seoDescription: '르노코리아 XM3 하이브리드 장기렌터카. 연비 좋은 소형 SUV 하이브리드 장기렌트.' },
  { id: 'rk04', brand: '르노코리아', model: '아르카나', slug: 'arkana', category: 'SUV', segment: '소형 SUV 쿠페', fuel: '하이브리드', imageKey: 'renault-arkana', trims: ['LE', 'RE', 'RE 시그니처'], seoTitle: '아르카나 장기렌트 | 월 납부금 비교', seoDescription: '르노코리아 아르카나 하이브리드 장기렌터카. 스타일리시한 SUV 쿠페 장기렌트 견적.' },
  { id: 'rk05', brand: '르노코리아', model: '마스터', slug: 'master', category: '다목적', segment: '대형 밴', fuel: '디젤', imageKey: 'renault-master', trims: ['3인승', '9인승', '12인승'], seoTitle: '마스터 장기렌트 | 월 납부금 비교', seoDescription: '르노코리아 마스터 장기렌터카. 대형 밴 다목적 장기렌트 사업자 전용 견적.' },

  // ═══════════════════════════════════
  // KGM (8종)
  // ═══════════════════════════════════
  { id: 'kg01', brand: 'KGM', model: '티볼리', slug: 'tivoli', category: 'SUV', segment: '소형 SUV', fuel: '가솔린', imageKey: 'kgm-tivoli', trims: ['스마트', '퍼펙트', '프리미엄'], seoTitle: '티볼리 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 티볼리 장기렌터카. 소형 SUV 장기렌트 최저가 견적을 확인하세요.' },
  { id: 'kg02', brand: 'KGM', model: '코란도', slug: 'korando', category: 'SUV', segment: '준중형 SUV', fuel: '가솔린', imageKey: 'kgm-korando', trims: ['스마트', '퍼펙트', '프리미엄'], seoTitle: '코란도 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 코란도 장기렌터카. 준중형 SUV 장기렌트 견적을 확인하세요.' },
  { id: 'kg03', brand: 'KGM', model: '코란도 이모션', slug: 'korando-ev', category: 'EV', segment: '준중형 SUV (EV)', fuel: '전기', imageKey: 'kgm-korando-ev', trims: ['스마트', '퍼펙트'], seoTitle: '코란도 이모션 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 코란도 이모션 전기차 장기렌터카. 준중형 전기 SUV 장기렌트 견적.' },
  { id: 'kg04', brand: 'KGM', model: '토레스', slug: 'torres', category: 'SUV', segment: '중형 SUV', fuel: '가솔린', imageKey: 'kgm-torres', trims: ['스마트', '퍼펙트', '프리미엄'], seoTitle: '토레스 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 토레스 장기렌터카. 중형 SUV 장기렌트 최저가 견적을 확인하세요.' },
  { id: 'kg05', brand: 'KGM', model: '토레스 EVX', slug: 'torres-evx', category: 'EV', segment: '중형 SUV (EV)', fuel: '전기', imageKey: 'kgm-torres-evx', trims: ['스마트', '퍼펙트'], seoTitle: '토레스 EVX 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 토레스 EVX 전기차 장기렌터카. 중형 전기 SUV 장기렌트 견적을 확인하세요.' },
  { id: 'kg06', brand: 'KGM', model: '렉스턴', slug: 'rexton', category: 'SUV', segment: '대형 SUV', fuel: '디젤', imageKey: 'kgm-rexton', trims: ['스마트', '퍼펙트', '프리미엄', '프린스'], seoTitle: '렉스턴 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 렉스턴 장기렌터카. 대형 SUV 장기렌트 최저가 견적을 확인하세요.' },
  { id: 'kg07', brand: 'KGM', model: '렉스턴 스포츠', slug: 'rexton-sports', category: '트럭', segment: '픽업트럭', fuel: '디젤', imageKey: 'kgm-rexton-sports', trims: ['스마트', '퍼펙트', '프리미엄'], seoTitle: '렉스턴 스포츠 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 렉스턴 스포츠 장기렌터카. 픽업트럭 장기렌트 사업자 전용 견적.' },
  { id: 'kg08', brand: 'KGM', model: '렉스턴 스포츠 칸', slug: 'rexton-sports-khan', category: '트럭', segment: '픽업트럭', fuel: '디젤', imageKey: 'kgm-rexton-sports-khan', trims: ['스마트', '퍼펙트', '프리미엄'], seoTitle: '렉스턴 스포츠 칸 장기렌트 | 월 납부금 비교', seoDescription: 'KGM 렉스턴 스포츠 칸 장기렌터카. 확장형 픽업트럭 장기렌트 견적을 확인하세요.' },
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
