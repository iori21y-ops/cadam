import type { TrimData } from "@/types/diagnosis";

interface Vehicle {
  name: string;
  brand: string;
  class: string;
  price: number;
  tags: string[];
  img: string;
  imageKey?: string;
}

export const VEHICLES: Vehicle[] = [
  { name: "캐스퍼", brand: "현대", class: "경차", price: 1500, tags: ["경차"], img: "🚗", imageKey: "hyundai-casper" },
  { name: "모닝", brand: "기아", class: "경차", price: 1300, tags: ["경차"], img: "🚗", imageKey: "kia-morning" },
  { name: "아반떼", brand: "현대", class: "소형세단", price: 2200, tags: ["소형세단", "하이브리드"], img: "🚙", imageKey: "hyundai-avante" },
  { name: "쏘나타", brand: "현대", class: "중형세단", price: 3300, tags: ["중형세단", "하이브리드"], img: "🚘", imageKey: "hyundai-sonata" },
  { name: "K5", brand: "기아", class: "중형세단", price: 3100, tags: ["중형세단", "하이브리드"], img: "🚘", imageKey: "kia-k5" },
  { name: "그랜저", brand: "현대", class: "대형세단", price: 4500, tags: ["대형세단", "하이브리드"], img: "🏎️", imageKey: "hyundai-grandeur" },
  { name: "코나", brand: "현대", class: "소형SUV", price: 2600, tags: ["소형SUV", "전기차", "하이브리드"], img: "🚙", imageKey: "hyundai-kona" },
  { name: "셀토스", brand: "기아", class: "소형SUV", price: 2500, tags: ["소형SUV"], img: "🚙", imageKey: "kia-seltos" },
  { name: "투싼", brand: "현대", class: "중형SUV", price: 3500, tags: ["중형SUV", "하이브리드"], img: "🚙", imageKey: "hyundai-tucson" },
  { name: "스포티지", brand: "기아", class: "중형SUV", price: 3400, tags: ["중형SUV", "하이브리드"], img: "🚙", imageKey: "kia-sportage" },
  { name: "팰리세이드", brand: "현대", class: "대형SUV", price: 5200, tags: ["대형SUV"], img: "🚐", imageKey: "hyundai-palisade" },
  { name: "카니발", brand: "기아", class: "미니밴", price: 4100, tags: ["미니밴"], img: "🚐", imageKey: "kia-carnival" },
  { name: "아이오닉5", brand: "현대", class: "중형SUV", price: 5000, tags: ["전기차", "중형SUV"], img: "⚡", imageKey: "hyundai-ioniq5" },
  { name: "EV6", brand: "기아", class: "중형SUV", price: 5200, tags: ["전기차", "중형SUV", "스포츠"], img: "⚡", imageKey: "kia-ev6" },
  // 제네시스 (프리미엄 3종)
  { name: "GV70", brand: "제네시스", class: "중형SUV", price: 5500, tags: ["중형SUV", "스포츠"], img: "🏎️", imageKey: "genesis-gv70" },
  { name: "G80", brand: "제네시스", class: "대형세단", price: 6500, tags: ["대형세단"], img: "🏎️", imageKey: "genesis-g80" },
  { name: "GV80", brand: "제네시스", class: "대형SUV", price: 7500, tags: ["대형SUV"], img: "🏎️", imageKey: "genesis-gv80" },
];

export const TRIMS: TrimData = {
  "캐스퍼": [
    { name: "Smart", price: 1385, add: 0, tags: ["경제", "기본"], feats: ["에어백", "후방카메라"] },
    { name: "Smart+", price: 1540, add: 155, tags: ["경제", "편의"], feats: ["스마트키", "열선시트", "8인치내비"] },
    { name: "Inspiration", price: 1760, add: 375, tags: ["풀옵", "편의", "안전"], feats: ["LED헤드램프", "차로이탈방지", "전방충돌방지"] },
  ],
  "모닝": [
    { name: "트렌디", price: 1230, add: 0, tags: ["경제", "기본"], feats: ["에어백", "에어컨"] },
    { name: "프레스티지", price: 1415, add: 185, tags: ["편의", "경제"], feats: ["스마트키", "후방카메라", "열선시트"] },
    { name: "시그니처", price: 1575, add: 345, tags: ["풀옵", "안전"], feats: ["내비", "전방충돌방지", "차로유지보조"] },
  ],
  "아반떼": [
    { name: "Smart", price: 2038, add: 0, tags: ["경제", "기본"], feats: ["8인치디스플레이", "후방카메라"] },
    { name: "Modern", price: 2298, add: 260, tags: ["편의"], feats: ["10.25인치내비", "스마트키", "LED헤드램프"] },
    { name: "Premium", price: 2628, add: 590, tags: ["풀옵", "안전", "편의"], feats: ["BOSE사운드", "서라운드뷰", "빌트인캠"] },
  ],
  "쏘나타": [
    { name: "Exclusive", price: 3016, add: 0, tags: ["기본", "편의"], feats: ["12.3인치클러스터", "내비", "스마트키"] },
    { name: "Premium", price: 3346, add: 330, tags: ["편의", "안전"], feats: ["가죽시트", "열선스티어링", "하이빔보조"] },
    { name: "Signature", price: 3746, add: 730, tags: ["풀옵", "프리미엄"], feats: ["헤드업디스플레이", "서라운드뷰", "원격주차"] },
  ],
  "K5": [
    { name: "트렌디", price: 2836, add: 0, tags: ["경제", "기본"], feats: ["8인치내비", "후방카메라"] },
    { name: "프레스티지", price: 3156, add: 320, tags: ["편의", "안전"], feats: ["가죽시트", "전동시트", "차로유지"] },
    { name: "시그니처", price: 3536, add: 700, tags: ["풀옵", "프리미엄"], feats: ["BOSE", "서라운드뷰", "원격주차"] },
  ],
  "그랜저": [
    { name: "Exclusive", price: 4022, add: 0, tags: ["기본", "편의"], feats: ["12.3인치쌍화면", "가죽시트", "전동시트"] },
    { name: "Calligraphy", price: 4582, add: 560, tags: ["프리미엄", "편의"], feats: ["나파가죽", "21스피커", "후석모니터"] },
    { name: "Calligraphy+", price: 4982, add: 960, tags: ["풀옵", "프리미엄"], feats: ["에어서스펜션", "디지털키2", "파노라마루프"] },
  ],
  "코나": [
    { name: "Smart", price: 2416, add: 0, tags: ["경제", "기본"], feats: ["후방카메라", "크루즈컨트롤"] },
    { name: "Modern", price: 2686, add: 270, tags: ["편의"], feats: ["내비", "LED", "열선시트"] },
    { name: "Inspiration", price: 3026, add: 610, tags: ["풀옵", "안전"], feats: ["서라운드뷰", "원격주차", "헤드업"] },
  ],
  "셀토스": [
    { name: "트렌디", price: 2330, add: 0, tags: ["경제", "기본"], feats: ["8인치내비", "후방카메라"] },
    { name: "프레스티지", price: 2650, add: 320, tags: ["편의", "안전"], feats: ["가죽시트", "전방충돌방지", "차로유지"] },
    { name: "시그니처", price: 2930, add: 600, tags: ["풀옵", "편의"], feats: ["BOSE", "서라운드뷰", "헤드업"] },
  ],
  "투싼": [
    { name: "Modern", price: 3106, add: 0, tags: ["기본", "편의"], feats: ["10.25인치내비", "LED", "전동시트"] },
    { name: "Premium", price: 3486, add: 380, tags: ["안전", "편의"], feats: ["서라운드뷰", "빌트인캠", "원격주차"] },
    { name: "Signature", price: 3826, add: 720, tags: ["풀옵", "프리미엄"], feats: ["헤드업", "나파가죽", "BOSE"] },
  ],
  "스포티지": [
    { name: "트렌디", price: 3044, add: 0, tags: ["기본", "편의"], feats: ["12.3인치내비", "후방카메라"] },
    { name: "프레스티지", price: 3424, add: 380, tags: ["편의", "안전"], feats: ["전동시트", "서라운드뷰", "차로유지"] },
    { name: "시그니처", price: 3774, add: 730, tags: ["풀옵", "프리미엄"], feats: ["헤드업", "나파가죽", "하만카돈"] },
  ],
  "팰리세이드": [
    { name: "Exclusive", price: 4588, add: 0, tags: ["기본", "편의"], feats: ["12.3인치쌍화면", "가죽시트", "3열"] },
    { name: "Calligraphy", price: 5288, add: 700, tags: ["프리미엄"], feats: ["나파가죽", "21스피커", "후석모니터"] },
    { name: "Calligraphy+", price: 5708, add: 1120, tags: ["풀옵", "프리미엄"], feats: ["에어서스펜션", "디지털키", "파노라마루프"] },
  ],
  "카니발": [
    { name: "프레스티지", price: 3708, add: 0, tags: ["기본", "편의"], feats: ["11인석", "내비", "전동슬라이딩도어"] },
    { name: "시그니처", price: 4248, add: 540, tags: ["편의", "프리미엄"], feats: ["9인석", "가죽시트", "열선3열"] },
    { name: "노블레스", price: 4758, add: 1050, tags: ["풀옵", "프리미엄"], feats: ["7인석VIP", "BOSE", "후석모니터"] },
  ],
  "아이오닉5": [
    { name: "Standard", price: 4695, add: 0, tags: ["기본", "경제"], feats: ["58kWh배터리", "후방카메라", "V2L"] },
    { name: "Long Range", price: 5245, add: 550, tags: ["편의"], feats: ["77.4kWh배터리", "내비", "BOSE"] },
    { name: "Prestige", price: 5745, add: 1050, tags: ["풀옵", "프리미엄", "안전"], feats: ["원격주차", "서라운드뷰", "헤드업", "릴렉션시트"] },
  ],
  "EV6": [
    { name: "Standard", price: 4870, add: 0, tags: ["기본", "경제"], feats: ["58kWh배터리", "후방카메라"] },
    { name: "Long Range", price: 5430, add: 560, tags: ["편의"], feats: ["77.4kWh배터리", "내비", "하만카돈"] },
    { name: "GT-Line", price: 5930, add: 1060, tags: ["풀옵", "스포티", "프리미엄"], feats: ["서라운드뷰", "헤드업", "스포츠시트", "GT전용디자인"] },
  ],
};
