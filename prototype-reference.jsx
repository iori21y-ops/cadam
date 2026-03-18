import { useState, useEffect } from "react";

/* ═══════════════════════════════════════════
   FINANCE DATA
   ═══════════════════════════════════════════ */
const DEF_FIN_BASIC = [
  {id:"business",question:"사업자이신가요?",subtitle:"사업자 여부에 따라 세제 혜택이 달라집니다",skipIf:[],options:[
    {label:"개인 (비사업자)",value:"personal",scores:{installment:2,lease:0,rent:1,cash:2},nextQ:""},
    {label:"개인사업자",value:"sole",scores:{installment:1,lease:3,rent:3,cash:1},nextQ:""},
    {label:"법인사업자",value:"corp",scores:{installment:0,lease:3,rent:3,cash:1},nextQ:""},
  ]},
  {id:"ownership",question:"차량 소유에 대한\n생각은 어떠세요?",subtitle:"내 명의 소유 vs 편한 사용",skipIf:[],options:[
    {label:"반드시 내 명의로 소유",value:"must_own",scores:{installment:3,lease:0,rent:0,cash:3},nextQ:"budget"},
    {label:"소유도 좋지만 필수는 아님",value:"flexible",scores:{installment:2,lease:2,rent:2,cash:1},nextQ:""},
    {label:"편하게 사용하는 게 좋다",value:"use_only",scores:{installment:0,lease:3,rent:3,cash:0},nextQ:""},
  ]},
  {id:"cycle",question:"차량 교체 주기는?",subtitle:"새 차로 바꾸는 주기",skipIf:[{qId:"ownership",values:["must_own"]}],options:[
    {label:"2~3년마다 새 차로",value:"short",scores:{installment:0,lease:3,rent:3,cash:0},nextQ:""},
    {label:"4~5년 정도 타고 교체",value:"medium",scores:{installment:3,lease:2,rent:1,cash:2},nextQ:""},
    {label:"6년 이상 오래 타는 편",value:"long",scores:{installment:2,lease:0,rent:0,cash:3},nextQ:""},
  ]},
  {id:"budget",question:"초기 자금 여유는?",subtitle:"차량 구매 시 한 번에 쓸 수 있는 금액",skipIf:[],options:[
    {label:"여유 자금이 충분하다",value:"rich",scores:{installment:1,lease:1,rent:0,cash:3},nextQ:""},
    {label:"있지만 나눠 내고 싶다",value:"moderate",scores:{installment:3,lease:2,rent:2,cash:1},nextQ:""},
    {label:"목돈 지출은 부담스럽다",value:"tight",scores:{installment:2,lease:2,rent:3,cash:0},nextQ:"payment"},
  ]},
  {id:"maintenance",question:"차량 관리는 어떻게?",subtitle:"보험·정비 관리 방식",skipIf:[{qId:"budget",values:["tight"]}],options:[
    {label:"직접 알아보고 관리",value:"self",scores:{installment:3,lease:2,rent:0,cash:3},nextQ:""},
    {label:"일부는 도움 받고 싶다",value:"partial",scores:{installment:2,lease:3,rent:1,cash:1},nextQ:""},
    {label:"전부 포함되면 좋겠다",value:"full",scores:{installment:0,lease:1,rent:3,cash:0},nextQ:""},
  ]},
  {id:"mileage",question:"연간 예상 주행거리는?",subtitle:"리스·렌트는 주행거리 제한이 있습니다",skipIf:[],options:[
    {label:"1만km 이하",value:"low",scores:{installment:1,lease:3,rent:3,cash:1},nextQ:""},
    {label:"1~2만km",value:"mid",scores:{installment:2,lease:2,rent:2,cash:2},nextQ:""},
    {label:"2만km 이상",value:"high",scores:{installment:3,lease:1,rent:1,cash:3},nextQ:""},
  ]},
  {id:"payment",question:"월 납입금에 대한 생각은?",subtitle:"매달 고정 지출 선호도",skipIf:[],options:[
    {label:"월 납입금 없는 게 좋다",value:"none",scores:{installment:0,lease:0,rent:0,cash:3},nextQ:""},
    {label:"적당한 월 납입 괜찮다",value:"ok",scores:{installment:3,lease:2,rent:2,cash:0},nextQ:""},
    {label:"보험·정비 포함이면 좋겠다",value:"allin",scores:{installment:0,lease:1,rent:3,cash:0},nextQ:""},
  ]},
];
const DEF_FIN_DETAIL = [
  {id:"price_range",question:"구매 예정 차량의\n가격대는?",subtitle:"고가 차량일수록 차이가 큽니다",skipIf:[],options:[
    {label:"3,000만원 이하",value:"low",scores:{installment:2,lease:1,rent:2,cash:3},nextQ:""},{label:"3,000~6,000만원",value:"mid",scores:{installment:3,lease:2,rent:2,cash:2},nextQ:""},{label:"6,000만원~1억원",value:"high",scores:{installment:1,lease:3,rent:2,cash:1},nextQ:""},{label:"1억원 이상",value:"premium",scores:{installment:0,lease:3,rent:3,cash:1},nextQ:""},
  ]},
  {id:"credit",question:"현재 신용 상태는?",subtitle:"금융 승인과 금리에 영향",skipIf:[],options:[
    {label:"우수 (1~3등급)",value:"excellent",scores:{installment:3,lease:3,rent:1,cash:1},nextQ:""},{label:"보통 (4~6등급)",value:"average",scores:{installment:2,lease:2,rent:2,cash:1},nextQ:""},{label:"관리 필요 (7등급 이하)",value:"low",scores:{installment:0,lease:0,rent:3,cash:2},nextQ:"insurance"},{label:"잘 모르겠다",value:"unknown",scores:{installment:1,lease:1,rent:2,cash:1},nextQ:""},
  ]},
  {id:"purpose",question:"차량의 주요 용도는?",subtitle:"용도에 따라 유리한 상품이 다릅니다",skipIf:[],options:[
    {label:"출퇴근·일상 이동",value:"commute",scores:{installment:2,lease:1,rent:2,cash:2},nextQ:""},{label:"영업·업무용",value:"business",scores:{installment:0,lease:3,rent:3,cash:0},nextQ:"tax"},{label:"가족 여가·장거리",value:"family",scores:{installment:3,lease:1,rent:1,cash:3},nextQ:""},{label:"법인 임직원용",value:"corporate",scores:{installment:0,lease:3,rent:3,cash:0},nextQ:"tax"},
  ]},
  {id:"depreciation",question:"차량 감가상각이\n신경 쓰이시나요?",subtitle:"시간이 지나면 가치가 하락합니다",skipIf:[{qId:"ownership",values:["must_own"]}],options:[
    {label:"매우 신경 쓰인다",value:"concern",scores:{installment:0,lease:3,rent:3,cash:0},nextQ:""},{label:"어느 정도 감안",value:"moderate",scores:{installment:2,lease:2,rent:2,cash:2},nextQ:""},{label:"신경 쓰지 않는다",value:"none",scores:{installment:3,lease:0,rent:0,cash:3},nextQ:""},
  ]},
  {id:"insurance",question:"자동차 보험은?",subtitle:"보험 가입 방식",skipIf:[],options:[
    {label:"직접 비교해서 저렴하게",value:"self",scores:{installment:3,lease:2,rent:0,cash:3},nextQ:""},{label:"알아서 해주면 좋겠다",value:"easy",scores:{installment:1,lease:2,rent:3,cash:0},nextQ:""},{label:"월 비용에 포함",value:"included",scores:{installment:0,lease:1,rent:3,cash:0},nextQ:""},
  ]},
  {id:"tax",question:"세금 처리는?",subtitle:"사업자 비용처리 방식",skipIf:[{qId:"business",values:["personal"]}],options:[
    {label:"세금 혜택 기대 안 함",value:"none",scores:{installment:2,lease:0,rent:0,cash:3},nextQ:""},{label:"가능하면 비용처리",value:"some",scores:{installment:1,lease:3,rent:3,cash:0},nextQ:""},{label:"절세가 가장 중요",value:"priority",scores:{installment:0,lease:3,rent:3,cash:0},nextQ:""},
  ]},
  {id:"cancel",question:"중도 계약 변경\n가능성이 있나요?",subtitle:"중도해지나 차량 변경 가능성",skipIf:[],options:[
    {label:"끝까지 유지",value:"keep",scores:{installment:2,lease:3,rent:2,cash:2},nextQ:""},{label:"바꿀 수도 있다",value:"maybe",scores:{installment:2,lease:1,rent:2,cash:2},nextQ:""},{label:"변경 가능성 높다",value:"likely",scores:{installment:1,lease:0,rent:3,cash:3},nextQ:""},
  ]},
];
const DEF_PRODUCTS = {
  installment:{name:"할부",color:"#007AFF",lightBg:"rgba(0,122,255,0.08)",emoji:"📋",tagline:"내 차를 내 이름으로",description:"차량 소유권을 확보하면서 월 납입으로 부담을 분산합니다.",pros:["소유권 즉시 확보","주행거리 제한 없음","자유로운 튜닝·개조","장기 보유 시 경제적"],cons:["이자 비용 발생","보험·정비 직접 관리","초기 선수금 필요"],bestFor:"장기 보유 + 내 명의 소유를 원하는 분"},
  lease:{name:"리스",color:"#5856D6",lightBg:"rgba(88,86,214,0.08)",emoji:"📝",tagline:"스마트한 비용 처리",description:"사업자 세제 혜택과 신차를 합리적으로 이용합니다.",pros:["사업자 세제 혜택","초기 비용 절감","신차 교체 용이","부가세 환급"],cons:["소유권 없음","주행거리 제한","중도해지 위약금"],bestFor:"세제 혜택이 필요한 사업자"},
  rent:{name:"장기렌트",color:"#34C759",lightBg:"rgba(52,199,89,0.08)",emoji:"🚙",tagline:"관리 걱정 없이 편하게",description:"보험·정비·세금 포함 올인원 서비스입니다.",pros:["보험·정비·세금 올인원","비용처리 가능","신용영향 적음","관리 최소화"],cons:["총 비용 높을 수 있음","소유권 없음","주행거리 제한"],bestFor:"올인원 편의를 원하는 분"},
  cash:{name:"현금구매",color:"#FF9500",lightBg:"rgba(255,149,0,0.08)",emoji:"💰",tagline:"이자 없이 온전한 내 차",description:"목돈으로 이자 부담 없이 완전 소유합니다.",pros:["이자 0원","즉시 완전 소유","제한 없음","총 비용 최저"],cons:["큰 목돈 필요","기회비용 발생","직접 관리"],bestFor:"여유 자금 충분 + 장기 보유"},
};
const PK=["installment","lease","rent","cash"],PL={installment:"할부",lease:"리스",rent:"렌트",cash:"현금"};

/* ═══════════════════════════════════════════
   VEHICLE DATA (basic 5 + detail 6 with skipIf/nextQ)
   ═══════════════════════════════════════════ */
const ALL_TAGS=["경차","소형세단","소형SUV","중형세단","중형SUV","대형세단","대형SUV","미니밴","스포츠","하이브리드","전기차","일반"];

const DEF_VEH_BASIC = [
  {id:"v_purpose",question:"차량의 주요 용도는?",subtitle:"가장 자주 사용하는 상황",skipIf:[],options:[
    {label:"출퇴근·도심 이동",value:"commute",tags:["경차","소형세단","소형SUV"],nextQ:""},
    {label:"영업·업무용",value:"business",tags:["중형세단","대형세단"],nextQ:""},
    {label:"가족 여행·레저",value:"family",tags:["중형SUV","대형SUV","미니밴"],nextQ:"v_people"},
    {label:"주말 드라이브·취미",value:"hobby",tags:["스포츠","소형SUV"],nextQ:""},
  ]},
  {id:"v_budget",question:"월 예산은\n어느 정도인가요?",subtitle:"보험·유지비 포함 월 총 비용",skipIf:[],options:[
    {label:"30만원 이하",value:"low",tags:["경차","소형세단"],nextQ:""},
    {label:"30~50만원",value:"mid",tags:["소형세단","소형SUV","중형세단"],nextQ:""},
    {label:"50~80만원",value:"high",tags:["중형세단","중형SUV","대형세단"],nextQ:""},
    {label:"80만원 이상",value:"premium",tags:["대형세단","대형SUV","스포츠"],nextQ:""},
  ]},
  {id:"v_people",question:"주로 함께 타는\n인원은?",subtitle:"일반적인 탑승 인원",skipIf:[],options:[
    {label:"혼자 또는 2명",value:"small",tags:["경차","소형세단","스포츠"],nextQ:""},
    {label:"3~4명 (소가족)",value:"medium",tags:["중형세단","소형SUV","중형SUV"],nextQ:""},
    {label:"5명 이상 (대가족)",value:"large",tags:["대형SUV","미니밴"],nextQ:""},
  ]},
  {id:"v_priority",question:"차량 선택 시\n가장 중요한 것은?",subtitle:"하나만 고른다면",skipIf:[],options:[
    {label:"연비·경제성",value:"economy",tags:["경차","소형세단","하이브리드"],nextQ:""},
    {label:"안전·편의 장비",value:"safety",tags:["중형세단","중형SUV","대형SUV"],nextQ:""},
    {label:"디자인·브랜드",value:"design",tags:["대형세단","스포츠"],nextQ:""},
    {label:"넓은 실내 공간",value:"space",tags:["대형SUV","미니밴","중형SUV"],nextQ:""},
  ]},
  {id:"v_fuel",question:"선호하는 연료는?",subtitle:"전기차·하이브리드 관심이 높아지고 있습니다",skipIf:[],options:[
    {label:"가솔린/디젤",value:"ice",tags:["일반"],nextQ:""},
    {label:"하이브리드",value:"hybrid",tags:["하이브리드"],nextQ:""},
    {label:"전기차",value:"ev",tags:["전기차"],nextQ:""},
    {label:"상관없음",value:"any",tags:["일반","하이브리드","전기차"],nextQ:""},
  ]},
];

const DEF_VEH_DETAIL = [
  {id:"v_parking",question:"주차 환경은\n어떠신가요?",subtitle:"주차 공간이 차량 크기 선택에 영향을 줍니다",skipIf:[],options:[
    {label:"좁은 골목·기계식 주차장",value:"narrow",tags:["경차","소형세단"],nextQ:""},
    {label:"아파트 지하주차장",value:"apt",tags:["소형SUV","중형세단","중형SUV"],nextQ:""},
    {label:"넉넉한 개인 주차장",value:"wide",tags:["대형SUV","대형세단","미니밴"],nextQ:""},
  ]},
  {id:"v_brand",question:"브랜드 선호가\n있으신가요?",subtitle:"국산·수입 선호도",skipIf:[],options:[
    {label:"국산차가 좋다",value:"domestic",tags:["경차","소형세단","중형세단","대형세단","소형SUV","중형SUV","대형SUV","미니밴"],nextQ:""},
    {label:"수입차에 관심 있다",value:"import",tags:["대형세단","스포츠"],nextQ:""},
    {label:"상관없음",value:"any",tags:[],nextQ:""},
  ]},
  {id:"v_drive",question:"원하는 주행 느낌은?",subtitle:"운전 스타일에 따라 추천이 달라집니다",skipIf:[{qId:"v_purpose",values:["commute"]}],options:[
    {label:"편안하고 부드럽게",value:"comfort",tags:["중형세단","대형세단","미니밴"],nextQ:""},
    {label:"스포티하고 다이나믹하게",value:"sporty",tags:["스포츠","소형SUV"],nextQ:""},
    {label:"높은 시야·안정감",value:"suv",tags:["중형SUV","대형SUV"],nextQ:""},
  ]},
  {id:"v_tech",question:"가장 중요한\n편의 사양은?",subtitle:"최근 차량 기술 트렌드를 반영합니다",skipIf:[],options:[
    {label:"주행보조 (ADAS·자율주행)",value:"adas",tags:["중형세단","중형SUV","대형SUV","전기차"],nextQ:""},
    {label:"인포테인먼트 (큰 화면·음향)",value:"infotain",tags:["대형세단","대형SUV","스포츠"],nextQ:""},
    {label:"실용성 (적재공간·시트배열)",value:"practical",tags:["미니밴","대형SUV","중형SUV"],nextQ:""},
    {label:"특별히 중요하지 않다",value:"none",tags:[],nextQ:""},
  ]},
  {id:"v_resale",question:"중고 매각 가치가\n중요한가요?",subtitle:"리세일 밸류를 고려합니다",skipIf:[{qId:"v_budget",values:["low"]}],options:[
    {label:"매우 중요하다",value:"important",tags:["중형SUV","대형SUV","하이브리드"],nextQ:""},
    {label:"어느 정도 고려",value:"moderate",tags:["중형세단","소형SUV"],nextQ:""},
    {label:"상관없다",value:"none",tags:[],nextQ:""},
  ]},
  {id:"v_range",question:"주로 달리는\n거리는?",subtitle:"일 평균 주행 거리",skipIf:[],options:[
    {label:"30km 이하 (근거리)",value:"short",tags:["경차","소형세단","전기차"],nextQ:""},
    {label:"30~100km",value:"medium",tags:["소형SUV","중형세단","하이브리드"],nextQ:""},
    {label:"100km 이상 (장거리)",value:"long",tags:["중형SUV","대형세단","하이브리드"],nextQ:""},
  ]},
];

const VEHICLES=[
  {name:"캐스퍼",brand:"현대",class:"경차",price:1500,monthly:{installment:22,lease:25,rent:32,cash:0},tags:["경차"],img:"🚗"},
  {name:"모닝",brand:"기아",class:"경차",price:1300,monthly:{installment:19,lease:22,rent:28,cash:0},tags:["경차"],img:"🚗"},
  {name:"아반떼",brand:"현대",class:"소형세단",price:2200,monthly:{installment:32,lease:35,rent:42,cash:0},tags:["소형세단","하이브리드"],img:"🚙"},
  {name:"쏘나타",brand:"현대",class:"중형세단",price:3300,monthly:{installment:48,lease:50,rent:58,cash:0},tags:["중형세단","하이브리드"],img:"🚘"},
  {name:"K5",brand:"기아",class:"중형세단",price:3100,monthly:{installment:45,lease:47,rent:55,cash:0},tags:["중형세단","하이브리드"],img:"🚘"},
  {name:"그랜저",brand:"현대",class:"대형세단",price:4500,monthly:{installment:65,lease:62,rent:72,cash:0},tags:["대형세단","하이브리드"],img:"🏎️"},
  {name:"코나",brand:"현대",class:"소형SUV",price:2600,monthly:{installment:38,lease:40,rent:48,cash:0},tags:["소형SUV","전기차","하이브리드"],img:"🚙"},
  {name:"셀토스",brand:"기아",class:"소형SUV",price:2500,monthly:{installment:36,lease:38,rent:46,cash:0},tags:["소형SUV"],img:"🚙"},
  {name:"투싼",brand:"현대",class:"중형SUV",price:3500,monthly:{installment:51,lease:52,rent:60,cash:0},tags:["중형SUV","하이브리드"],img:"🚙"},
  {name:"스포티지",brand:"기아",class:"중형SUV",price:3400,monthly:{installment:49,lease:50,rent:58,cash:0},tags:["중형SUV","하이브리드"],img:"🚙"},
  {name:"팰리세이드",brand:"현대",class:"대형SUV",price:5200,monthly:{installment:75,lease:70,rent:82,cash:0},tags:["대형SUV"],img:"🚐"},
  {name:"카니발",brand:"기아",class:"미니밴",price:4100,monthly:{installment:59,lease:56,rent:66,cash:0},tags:["미니밴"],img:"🚐"},
  {name:"아이오닉5",brand:"현대",class:"전기SUV",price:5000,monthly:{installment:72,lease:68,rent:78,cash:0},tags:["전기차","중형SUV"],img:"⚡"},
  {name:"EV6",brand:"기아",class:"전기SUV",price:5200,monthly:{installment:75,lease:70,rent:80,cash:0},tags:["전기차","중형SUV","스포츠"],img:"⚡"},
];

/* ═══════════════════════════════════════════
   VEHICLE TRIMS & OPTIONS DATA
   ═══════════════════════════════════════════ */
const TRIMS={
  "캐스퍼":[{name:"Smart",price:1385,add:0,tags:["경제","기본"],feats:["에어백","후방카메라"]},{name:"Smart+",price:1540,add:155,tags:["경제","편의"],feats:["스마트키","열선시트","8인치내비"]},{name:"Inspiration",price:1760,add:375,tags:["풀옵","편의","안전"],feats:["LED헤드램프","차로이탈방지","전방충돌방지"]}],
  "모닝":[{name:"트렌디",price:1230,add:0,tags:["경제","기본"],feats:["에어백","에어컨"]},{name:"프레스티지",price:1415,add:185,tags:["편의","경제"],feats:["스마트키","후방카메라","열선시트"]},{name:"시그니처",price:1575,add:345,tags:["풀옵","안전"],feats:["내비","전방충돌방지","차로유지보조"]}],
  "아반떼":[{name:"Smart",price:2038,add:0,tags:["경제","기본"],feats:["8인치디스플레이","후방카메라"]},{name:"Modern",price:2298,add:260,tags:["편의"],feats:["10.25인치내비","스마트키","LED헤드램프"]},{name:"Premium",price:2628,add:590,tags:["풀옵","안전","편의"],feats:["BOSE사운드","서라운드뷰","빌트인캠"]}],
  "쏘나타":[{name:"Exclusive",price:3016,add:0,tags:["기본","편의"],feats:["12.3인치클러스터","내비","스마트키"]},{name:"Premium",price:3346,add:330,tags:["편의","안전"],feats:["가죽시트","열선스티어링","하이빔보조"]},{name:"Signature",price:3746,add:730,tags:["풀옵","프리미엄"],feats:["헤드업디스플레이","서라운드뷰","원격주차"]}],
  "K5":[{name:"트렌디",price:2836,add:0,tags:["경제","기본"],feats:["8인치내비","후방카메라"]},{name:"프레스티지",price:3156,add:320,tags:["편의","안전"],feats:["가죽시트","전동시트","차로유지"]},{name:"시그니처",price:3536,add:700,tags:["풀옵","프리미엄"],feats:["BOSE","서라운드뷰","원격주차"]}],
  "그랜저":[{name:"Exclusive",price:4022,add:0,tags:["기본","편의"],feats:["12.3인치쌍화면","가죽시트","전동시트"]},{name:"Calligraphy",price:4582,add:560,tags:["프리미엄","편의"],feats:["나파가죽","21스피커","후석모니터"]},{name:"Calligraphy+",price:4982,add:960,tags:["풀옵","프리미엄"],feats:["에어서스펜션","디지털키2","파노라마루프"]}],
  "코나":[{name:"Smart",price:2416,add:0,tags:["경제","기본"],feats:["후방카메라","크루즈컨트롤"]},{name:"Modern",price:2686,add:270,tags:["편의"],feats:["내비","LED","열선시트"]},{name:"Inspiration",price:3026,add:610,tags:["풀옵","안전"],feats:["서라운드뷰","원격주차","헤드업"]}],
  "셀토스":[{name:"트렌디",price:2330,add:0,tags:["경제","기본"],feats:["8인치내비","후방카메라"]},{name:"프레스티지",price:2650,add:320,tags:["편의","안전"],feats:["가죽시트","전방충돌방지","차로유지"]},{name:"시그니처",price:2930,add:600,tags:["풀옵","편의"],feats:["BOSE","서라운드뷰","헤드업"]}],
  "투싼":[{name:"Modern",price:3106,add:0,tags:["기본","편의"],feats:["10.25인치내비","LED","전동시트"]},{name:"Premium",price:3486,add:380,tags:["안전","편의"],feats:["서라운드뷰","빌트인캠","원격주차"]},{name:"Signature",price:3826,add:720,tags:["풀옵","프리미엄"],feats:["헤드업","나파가죽","BOSE"]}],
  "스포티지":[{name:"트렌디",price:3044,add:0,tags:["기본","편의"],feats:["12.3인치내비","후방카메라"]},{name:"프레스티지",price:3424,add:380,tags:["편의","안전"],feats:["전동시트","서라운드뷰","차로유지"]},{name:"시그니처",price:3774,add:730,tags:["풀옵","프리미엄"],feats:["헤드업","나파가죽","하만카돈"]}],
  "팰리세이드":[{name:"Exclusive",price:4588,add:0,tags:["기본","편의"],feats:["12.3인치쌍화면","가죽시트","3열"]},{name:"Calligraphy",price:5288,add:700,tags:["프리미엄"],feats:["나파가죽","21스피커","후석모니터"]},{name:"Calligraphy+",price:5708,add:1120,tags:["풀옵","프리미엄"],feats:["에어서스펜션","디지털키","파노라마루프"]}],
  "카니발":[{name:"프레스티지",price:3708,add:0,tags:["기본","편의"],feats:["11인석","내비","전동슬라이딩도어"]},{name:"시그니처",price:4248,add:540,tags:["편의","프리미엄"],feats:["9인석","가죽시트","열선3열"]},{name:"노블레스",price:4758,add:1050,tags:["풀옵","프리미엄"],feats:["7인석VIP","BOSE","후석모니터"]}],
  "아이오닉5":[{name:"Standard",price:4695,add:0,tags:["기본","경제"],feats:["58kWh배터리","후방카메라","V2L"]},{name:"Long Range",price:5245,add:550,tags:["편의"],feats:["77.4kWh배터리","내비","BOSE"]},{name:"Prestige",price:5745,add:1050,tags:["풀옵","프리미엄","안전"],feats:["원격주차","서라운드뷰","헤드업","릴렉션시트"]}],
  "EV6":[{name:"Standard",price:4870,add:0,tags:["기본","경제"],feats:["58kWh배터리","후방카메라"]},{name:"Long Range",price:5430,add:560,tags:["편의"],feats:["77.4kWh배터리","내비","하만카돈"]},{name:"GT-Line",price:5930,add:1060,tags:["풀옵","스포티","프리미엄"],feats:["서라운드뷰","헤드업","스포츠시트","GT전용디자인"]}],
};

const OPT_QUESTIONS=[
  {id:"o_budget",question:"옵션에 추가로\n투자할 예산은?",subtitle:"기본 트림 대비 추가 비용",options:[
    {label:"최소한으로 (0~100만원)",value:"min",tags:["경제","기본"]},
    {label:"적당히 (100~500만원)",value:"mid",tags:["편의","안전"]},
    {label:"풀옵션 원한다 (500만원+)",value:"max",tags:["풀옵","프리미엄"]},
  ]},
  {id:"o_safety",question:"안전 사양은\n얼마나 중요한가요?",subtitle:"주행 보조·충돌 방지 등",options:[
    {label:"기본 에어백이면 충분",value:"basic",tags:["기본","경제"]},
    {label:"전방충돌방지는 있어야",value:"moderate",tags:["안전"]},
    {label:"최신 ADAS 풀옵션 원함",value:"full",tags:["풀옵","안전","프리미엄"]},
  ]},
  {id:"o_comfort",question:"편의 사양 중\n가장 중요한 것은?",subtitle:"하나만 고른다면",options:[
    {label:"열선 시트·스티어링",value:"heated",tags:["편의"]},
    {label:"내비·큰 디스플레이",value:"navi",tags:["편의","기본"]},
    {label:"가죽시트·전동시트",value:"leather",tags:["프리미엄","편의"]},
    {label:"특별히 없음",value:"none",tags:["경제","기본"]},
  ]},
  {id:"o_tech",question:"첨단 기능에 대한\n관심은?",subtitle:"원격주차, 서라운드뷰, 헤드업디스플레이 등",options:[
    {label:"없어도 된다",value:"none",tags:["기본","경제"]},
    {label:"있으면 좋겠다",value:"nice",tags:["편의"]},
    {label:"반드시 있어야 한다",value:"must",tags:["풀옵","프리미엄"]},
  ]},
  {id:"o_sound",question:"사운드 시스템은\n중요한가요?",subtitle:"BOSE, 하만카돈, JBL 등 프리미엄 사운드",options:[
    {label:"기본으로 충분",value:"basic",tags:["기본","경제"]},
    {label:"좋으면 좋지만 필수 아님",value:"nice",tags:["편의"]},
    {label:"프리미엄 사운드 원함",value:"premium",tags:["프리미엄","풀옵"]},
  ]},
];

/* ═══════════════════════════════════════════
   ENGINE + STORAGE + STYLE
   ═══════════════════════════════════════════ */
function shouldSkip(q,a){if(!q.skipIf||!q.skipIf.length)return false;return q.skipIf.some(c=>{const p=a[c.qId];return p&&c.values.includes(p.value);});}
function findNext(qs,ci,opt,a){if(opt.nextQ){const t=qs.findIndex(q=>q.id===opt.nextQ);if(t>ci)return t;}for(let i=ci+1;i<qs.length;i++){if(!shouldSkip(qs[i],a))return i;}return -1;}
const ST_KEY="car-platform-v4";const AI_KEY="car-ai-config-v1";const F="-apple-system,'SF Pro Text',BlinkMacSystemFont,sans-serif";const FD="-apple-system,'SF Pro Display',BlinkMacSystemFont,sans-serif";
async function ld(){
  let main=null,aiCfg=null;
  try{const r=await window.storage.get(ST_KEY);if(r?.value)main=JSON.parse(r.value);}catch(e){}
  try{const r=await window.storage.get(AI_KEY);if(r?.value)aiCfg=JSON.parse(r.value);}catch(e){}
  if(main&&aiCfg) main.aiConfig=aiCfg;
  else if(main&&!aiCfg&&main.aiConfig) aiCfg=main.aiConfig; // migrate old format
  return main?{...main,aiConfig:aiCfg||null}:null;
}
async function sv(d){
  try{
    // Save AI config separately for reliability
    if(d.aiConfig){
      await window.storage.set(AI_KEY,JSON.stringify(d.aiConfig));
    }
    // Save the rest (without aiConfig to reduce size)
    const rest={finBasic:d.finBasic,finDetail:d.finDetail,vehBasic:d.vehBasic,vehDetail:d.vehDetail,products:d.products};
    await window.storage.set(ST_KEY,JSON.stringify(rest));
    return true;
  }catch(e){console.log("save error",e);return true;}
}

/* ═══════════════════════════════════════════
   SHARED UI
   ═══════════════════════════════════════════ */
function ScoreRing({pct,color,size=60}){const sw=5,r=(size-sw)/2,ci=2*Math.PI*r;const[a,sa]=useState(0);useEffect(()=>{setTimeout(()=>sa(pct),100);},[pct]);return(<svg width={size} height={size} style={{transform:"rotate(-90deg)"}}><circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F5F5F7" strokeWidth={sw}/><circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={sw} strokeDasharray={ci} strokeDashoffset={ci-(ci*a)/100} strokeLinecap="round" style={{transition:"stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)"}}/></svg>);}
function ShareBtns({title,text}){const[cp,scp]=useState(false);return(<div style={{display:"flex",gap:10,justifyContent:"center",marginTop:16}}><button onClick={()=>{navigator.clipboard?.writeText(`${title}\n${text}`).then(()=>{scp(true);setTimeout(()=>scp(false),2000);});}} style={{fontFamily:F,fontSize:13,fontWeight:500,color:"#1D1D1F",background:"#F5F5F7",border:"none",borderRadius:12,padding:"12px 20px",cursor:"pointer"}}>{cp?"✓ 복사됨":"🔗 링크 복사"}</button><button onClick={()=>window.open("https://sharer.kakao.com","_blank")} style={{fontFamily:F,fontSize:13,fontWeight:500,color:"#3B1E1E",background:"#FEE500",border:"none",borderRadius:12,padding:"12px 20px",cursor:"pointer"}}>💬 카카오톡</button></div>);}
function ConsultCTA({label}){const[sh,sSh]=useState(false);const[ok,sOk]=useState(false);const[fm,sFm]=useState({n:"",p:""});if(ok)return(<div style={{background:"#F0FFF4",borderRadius:16,padding:24,textAlign:"center",border:"1px solid #C6F6D5"}}><div style={{fontSize:32,marginBottom:8}}>✅</div><div style={{fontFamily:FD,fontSize:17,fontWeight:700,color:"#1D1D1F"}}>상담 신청 완료!</div><div style={{fontFamily:F,fontSize:13,color:"#86868B",marginTop:4}}>24시간 내 연락드립니다.</div></div>);
  return(<div style={{background:"#FFF",borderRadius:20,padding:24,boxShadow:"0 2px 20px rgba(0,0,0,0.06)"}}>{!sh?<div style={{textAlign:"center"}}><div style={{fontFamily:FD,fontSize:17,fontWeight:700,color:"#1D1D1F",marginBottom:6}}>맞춤 상담 받아보세요</div><div style={{fontFamily:F,fontSize:13,color:"#86868B",marginBottom:20}}>{label||"전문 상담사가 최적 조건을 찾아드립니다."}</div><div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}><button onClick={()=>sSh(true)} style={{fontFamily:F,fontSize:15,fontWeight:600,color:"#FFF",background:"#007AFF",border:"none",borderRadius:14,padding:"14px 28px",cursor:"pointer"}}>📋 상담 신청</button><a href="https://open.kakao.com" target="_blank" rel="noreferrer" style={{fontFamily:F,fontSize:15,fontWeight:600,color:"#3B1E1E",background:"#FEE500",borderRadius:14,padding:"14px 28px",textDecoration:"none"}}>💬 카카오톡</a></div></div>:<div><div style={{display:"flex",flexDirection:"column",gap:12}}><input placeholder="이름" value={fm.n} onChange={e=>sFm({...fm,n:e.target.value})} style={{fontFamily:F,fontSize:15,padding:"14px 16px",borderRadius:12,border:"1px solid #E5E5EA",background:"#F5F5F7",outline:"none",boxSizing:"border-box",width:"100%"}}/><input placeholder="연락처" value={fm.p} onChange={e=>sFm({...fm,p:e.target.value})} style={{fontFamily:F,fontSize:15,padding:"14px 16px",borderRadius:12,border:"1px solid #E5E5EA",background:"#F5F5F7",outline:"none",boxSizing:"border-box",width:"100%"}}/><div style={{display:"flex",gap:8}}><button onClick={()=>sSh(false)} style={{fontFamily:F,fontSize:14,color:"#86868B",background:"#F5F5F7",border:"none",borderRadius:12,padding:"14px 20px",cursor:"pointer",flex:1}}>취소</button><button onClick={()=>{if(fm.n&&fm.p)sOk(true);}} style={{fontFamily:F,fontSize:14,fontWeight:600,color:"#FFF",background:fm.n&&fm.p?"#007AFF":"#D1D1D6",border:"none",borderRadius:12,padding:"14px 20px",cursor:"pointer",flex:2}}>신청</button></div></div></div>}</div>);}
/* ═══════════════════════════════════════════
   AI CHARACTER CONFIG
   ═══════════════════════════════════════════ */
const DEF_AI_CONFIG = {
  charName: "박대표",
  charEmoji: "👨‍💼",
  charTitle: "박대표의 한마디",
  charSubtitle: "AI 맞춤 조언",
  bgColor: "#007AFF",
  model: "claude-sonnet-4-20250514",
  maxCalls: 5,
  promptTemplate: `당신은 '{charName}'이라는 친근한 자동차 금융 전문가 캐릭터입니다.
30~40대 자영업자/직장인에게 반말로 편하게 조언하는 스타일입니다.
아래 고객 진단 결과를 보고 2~3문장으로 핵심 조언을 해주세요.
이모지 1~2개 사용하고, "사장님" 또는 "대표님"이라고 호칭하세요.

{context}`,
  tonePresets: [
    { name: "친근한 반말", desc: "사장님~ 이렇게 하세요!", prompt: '반말로 편하게 조언합니다. "사장님" 호칭.' },
    { name: "전문가 존댓말", desc: "고객님, 추천드립니다.", prompt: '존댓말로 정중하게 조언합니다. "고객님" 호칭.' },
    { name: "유머러스", desc: "사장님 이건 진짜 꿀팁!", prompt: '유머를 섞어 재미있게 조언합니다. "사장님" 호칭. 가벼운 비유를 사용하세요.' },
    { name: "간결·핵심", desc: "렌트 추천. 이유: 비용처리.", prompt: '극도로 간결하게 핵심만 말합니다. 1~2문장. 불필요한 수식어 없이.' },
  ],
  fallbacks: [
    "사장님, 진단 결과가 나왔네요! 😊 궁금한 거 있으면 언제든 상담 신청해주세요!",
    "대표님, 결과 확인해보세요! 🚗 전문 상담사가 더 자세히 도와드릴 수 있어요!",
    "사장님, 딱 맞는 결과예요! 💪 실제 견적은 상담으로 확인해보세요!",
    "대표님, 좋은 선택이에요! 😊 상담으로 더 좋은 조건 받아보세요!",
  ],
};

/* ═══════════════════════════════════════════
   PARK AI — with session limit + cache + config
   ═══════════════════════════════════════════ */
const parkCache = {};
let parkCallCount = 0;
function clearParkCache(){Object.keys(parkCache).forEach(k=>delete parkCache[k]);parkCallCount=0;}

function ParkAI({ctx, cfg}){
  const c0 = cfg || DEF_AI_CONFIG;
  const maxC = c0.maxCalls||5;
  const[c,sc]=useState("");
  const[l,sl]=useState(true);
  const[fromCache,setFromCache]=useState(false);
  const[limited,setLimited]=useState(false);

  // Include maxCalls in cfgKey so changes trigger re-run
  const cfgKey = (c0.charName||"")+(c0.model||"")+String(maxC)+(c0.promptTemplate||"").length;

  useEffect(()=>{
    sc("");sl(true);setFromCache(false);setLimited(false);
    (async()=>{
      const cacheKey = cfgKey + "|" + ctx.trim();

      // 1) Cache hit
      if(parkCache[cacheKey]){ sc(parkCache[cacheKey]); setFromCache(true); sl(false); return; }

      // 2) Session limit reached
      if(parkCallCount >= maxC){
        const fbs = c0.fallbacks||DEF_AI_CONFIG.fallbacks;
        sc(fbs[Math.floor(Math.random()*fbs.length)]);
        setLimited(true); sl(false); return;
      }

      // 3) API call
      try{
        parkCallCount++;
        const prompt = (c0.promptTemplate||DEF_AI_CONFIG.promptTemplate)
          .replace("{charName}", c0.charName||"박대표")
          .replace("{context}", ctx);
        const r=await fetch("https://api.anthropic.com/v1/messages",{
          method:"POST", headers:{"Content-Type":"application/json"},
          body:JSON.stringify({ model:c0.model||"claude-sonnet-4-20250514", max_tokens:1000, messages:[{role:"user",content:prompt}] })
        });
        const d=await r.json();
        const text=d.content?.map(x=>x.text||"").join("")||"";
        if(text){ parkCache[cacheKey]=text; sc(text); }
        else { sc((c0.fallbacks||DEF_AI_CONFIG.fallbacks)[0]); }
      }catch(e){
        const fbs=c0.fallbacks||DEF_AI_CONFIG.fallbacks;
        sc(fbs[Math.floor(Math.random()*fbs.length)]);
      }
      sl(false);
    })();
  },[ctx, cfgKey]);

  const remaining = Math.max(0, maxC - parkCallCount);
  return(<div style={{background:"linear-gradient(135deg,#1D1D1F,#2C2C2E)",borderRadius:20,padding:24,marginBottom:16}}>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
      <div style={{width:44,height:44,borderRadius:22,background:c0.bgColor||"#007AFF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{c0.charEmoji||"👨‍💼"}</div>
      <div style={{flex:1}}>
        <div style={{fontFamily:FD,fontSize:15,fontWeight:700,color:"#FFF"}}>{c0.charTitle||"박대표의 한마디"}</div>
        <div style={{fontFamily:F,fontSize:11,color:"rgba(255,255,255,0.4)"}}>
          {limited?"세션 한도 도달 · 기본 메시지":fromCache?"캐시 응답 · API 미사용":(c0.charSubtitle||"AI 맞춤 조언")}
        </div>
      </div>
      <div style={{textAlign:"right",flexShrink:0}}>
        <div style={{fontFamily:FD,fontSize:16,fontWeight:700,color:remaining<=1?"#FF6B6B":"rgba(255,255,255,0.6)"}}>{remaining}/{maxC}</div>
        <div style={{fontFamily:F,fontSize:9,color:"rgba(255,255,255,0.3)"}}>잔여 호출</div>
      </div>
    </div>
    {l?<div style={{fontFamily:F,fontSize:14,color:"rgba(255,255,255,0.5)"}}>분석 중...</div>:<div style={{fontFamily:F,fontSize:15,color:"rgba(255,255,255,0.85)",lineHeight:1.8}}>{c}</div>}
  </div>);
}

/* ═══════════════════════════════════════════
   GENERIC QUIZ MODULE (mode select → survey → result)
   Used for BOTH finance and vehicle
   ═══════════════════════════════════════════ */
function QuizModule({basicQs,detailQs,color,renderResult,onHome}){
  const[phase,setPhase]=useState("mode");const[mode,setMode]=useState(null);const[selM,setSelM]=useState(null);
  const[qi,setQi]=useState(0);const[ans,setAns]=useState({});const[hist,setHist]=useState([]);const[anim,setAnim]=useState(false);
  const qs=mode==="detail"?[...basicQs,...detailQs]:basicQs;const cur=qs[qi];const aCnt=Object.keys(ans).length;

  const pickM=(m)=>{setSelM(m);setTimeout(()=>{setAnim(true);setTimeout(()=>{setMode(m);setPhase("survey");const q=m==="detail"?[...basicQs,...detailQs]:basicQs;let s=0;while(s<q.length&&shouldSkip(q[s],{}))s++;setQi(s);setAns({});setHist([]);setAnim(false);},350);},300);};
  const pick=(o)=>{const na={...ans,[cur.id]:o};setAns(na);setTimeout(()=>{setAnim(true);setTimeout(()=>{const ni=findNext(qs,qi,o,na);if(ni>=0&&ni<qs.length){setHist(p=>[...p,qi]);setQi(ni);}else setPhase("result");setAnim(false);},350);},250);};
  const back=()=>{if(hist.length>0){setAnim(true);setTimeout(()=>{const h=[...hist];const li=h.pop();setHist(h);setAns(a=>{const n={...a};delete n[cur?.id];return n;});setQi(li);setAnim(false);},300);}else setPhase("mode");};
  const restart=()=>{setPhase("mode");setMode(null);setSelM(null);setQi(0);setAns({});setHist([]);};
  const toDetail=()=>{const allQ=[...basicQs,...detailQs];let s=basicQs.length;while(s<allQ.length&&shouldSkip(allQ[s],ans))s++;setMode("detail");setQi(s);setHist([...hist,qi]);setPhase("survey");};

  if(phase==="mode"){
    const sq=selM==="quick",sd=selM==="detail";
    return(<div style={{paddingTop:"clamp(40px,8vh,80px)",maxWidth:460,margin:"0 auto",opacity:anim?0:1,transform:anim?"translateX(-40px)":"translateX(0)",transition:"all 0.35s cubic-bezier(0.4,0,0.2,1)"}}>
      <h2 style={{fontFamily:FD,fontSize:"clamp(26px,5vw,34px)",fontWeight:700,color:"#1D1D1F",textAlign:"center",lineHeight:1.3,marginBottom:8}}>진단 방식을<br/>선택해주세요.</h2>
      <p style={{fontSize:15,color:"#86868B",textAlign:"center",marginBottom:40}}>목적에 맞는 진단을 선택하세요</p>
      <div style={{display:"flex",flexDirection:"column",gap:14}}>
        {[["quick","간편 테스트","핵심 질문만으로 빠르게","약 1분",basicQs.length],["detail","상세 테스트","정밀 분석으로 확실하게","약 3분",basicQs.length+detailQs.length]].map(([k,t,d,tm,cnt])=>{const sel=selM===k;return(
          <button key={k} onClick={()=>pickM(k)} style={{background:sel?color:"#FFF",border:sel?`2px solid ${color}`:"2px solid transparent",borderRadius:20,padding:"28px 26px",cursor:selM?"default":"pointer",textAlign:"left",transition:"all 0.35s cubic-bezier(0.4,0,0.2,1)",boxShadow:sel?`0 4px 24px ${color}40`:"0 2px 16px rgba(0,0,0,0.05)",opacity:(selM&&!sel)?0.4:1,pointerEvents:selM?"none":"auto"}}
            onMouseEnter={e=>{if(!sel){e.currentTarget.style.transform="scale(1.015)";e.currentTarget.style.borderColor=color;}}} onMouseLeave={e=>{if(!sel){e.currentTarget.style.transform="scale(1)";e.currentTarget.style.borderColor="transparent";}}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><span style={{padding:"4px 12px",borderRadius:8,background:sel?"rgba(255,255,255,0.2)":"#F5F5F7",fontSize:12,fontWeight:600,color:sel?"rgba(255,255,255,0.8)":"#86868B",fontFamily:F}}>{tm}</span><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:13,color:sel?"rgba(255,255,255,0.6)":"#AEAEB2"}}>{cnt}개</span><div style={{width:22,height:22,borderRadius:11,border:sel?"none":"2px solid #D1D1D6",background:sel?"#FFF":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>{sel&&<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div></div></div>
            <div style={{fontFamily:FD,fontSize:22,fontWeight:700,color:sel?"#FFF":"#1D1D1F",marginBottom:6,transition:"all 0.35s ease"}}>{t}</div>
            <div style={{fontFamily:F,fontSize:14,color:sel?"rgba(255,255,255,0.7)":"#86868B",transition:"all 0.35s ease"}}>{d}</div>
          </button>);})}
      </div>
    </div>);
  }
  if(phase==="survey"&&cur){
    const pct=Math.round((aCnt/qs.length)*100);
    return(<div style={{paddingTop:16,maxWidth:500,margin:"0 auto"}}>
      <div style={{marginBottom:32}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontFamily:F,fontSize:12,color:"#AEAEB2"}}><span>Q{aCnt+1}</span><span>{aCnt}/~{qs.length}</span></div><div style={{width:"100%",height:4,background:"#E5E5EA",borderRadius:2,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:2,transition:"width 0.5s ease"}}/></div></div>
      <div style={{opacity:anim?0:1,transform:anim?"translateX(40px)":"translateX(0)",transition:"all 0.45s cubic-bezier(0.4,0,0.2,1)"}}>
        <h2 style={{fontFamily:FD,fontSize:"clamp(26px,5vw,34px)",fontWeight:700,color:"#1D1D1F",textAlign:"center",lineHeight:1.3,marginBottom:8,whiteSpace:"pre-line"}}>{cur.question}</h2>
        <p style={{fontFamily:F,fontSize:15,color:"#86868B",textAlign:"center",marginBottom:36}}>{cur.subtitle}</p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {cur.options.map((o,i)=>{const s=ans[cur.id]?.value===o.value;return(
            <button key={o.value} onClick={()=>pick(o)} style={{display:"flex",alignItems:"center",gap:16,padding:"17px 22px",background:s?color:"#FFF",border:"none",borderRadius:16,cursor:"pointer",boxShadow:s?`0 2px 12px ${color}44`:"0 1px 3px rgba(0,0,0,0.06)",opacity:anim?0:1,transform:anim?"translateY(16px)":"translateY(0)",transition:"all 0.25s ease",transitionDelay:`${i*0.04}s`}}
              onMouseEnter={e=>{if(!s)e.currentTarget.style.transform="scale(1.012)";}} onMouseLeave={e=>{if(!s)e.currentTarget.style.transform="scale(1)";}}>
              <span style={{fontFamily:F,fontSize:16,fontWeight:s?600:400,color:s?"#FFF":"#1D1D1F",flex:1}}>{o.label}</span>
              <div style={{width:22,height:22,borderRadius:11,border:s?"none":"2px solid #D1D1D6",background:s?"#FFF":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>{s&&<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>
            </button>);})}
        </div>
      </div>
      <div style={{textAlign:"center",marginTop:32}}><button onClick={back} style={{background:"none",border:"none",color,fontSize:15,cursor:"pointer",fontFamily:F}}>{hist.length===0?"← 테스트 선택":"이전으로"}</button></div>
    </div>);
  }
  if(phase==="result") return renderResult({answers:ans,questions:qs,mode,restart,toDetail,onHome});
  return null;
}

/* ═══════════════════════════════════════════
   FINANCE RESULT
   ═══════════════════════════════════════════ */
function FinResult({answers,questions,mode,products,restart,toDetail,onHome,aiCfg}){
  const tot={installment:0,lease:0,rent:0,cash:0};const aQs=questions.filter(q=>answers[q.id]);
  Object.values(answers).forEach(o=>{if(o?.scores)Object.entries(o.scores).forEach(([k,v])=>{tot[k]+=v;});});
  const mx=aQs.length*3,sorted=Object.entries(tot).sort((a,b)=>b[1]-a[1]),tk=sorted[0][0],top=products[tk];
  const ctx=Object.entries(answers).map(([k,v])=>`${k}:${v.label}`).join(",")+`\n추천:${top.name}`;
  return(<div style={{maxWidth:520,margin:"0 auto"}}>
    <div style={{textAlign:"center",marginBottom:8}}><span style={{display:"inline-block",padding:"5px 14px",borderRadius:20,background:mode==="quick"?"#F5F5F7":"#007AFF",fontFamily:F,fontSize:12,fontWeight:600,color:mode==="quick"?"#86868B":"#FFF"}}>{mode==="quick"?"간편":"상세"} · {aQs.length}개 응답</span></div>
    <div style={{textAlign:"center",marginBottom:32}}><h2 style={{fontFamily:FD,fontSize:"clamp(28px,5.5vw,38px)",fontWeight:700,color:"#1D1D1F",lineHeight:1.25}}>고객님께는 <span style={{color:top.color}}>{top.name}</span>를<br/>추천합니다.</h2></div>
    <ParkAI ctx={ctx} cfg={aiCfg}/>
    <div style={{background:"#FFF",borderRadius:24,padding:28,boxShadow:"0 2px 20px rgba(0,0,0,0.06)",marginBottom:16}}>
      <div style={{display:"flex",alignItems:"center",gap:16,marginBottom:20}}><div style={{width:52,height:52,borderRadius:16,background:top.lightBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>{top.emoji}</div><div><div style={{fontFamily:FD,fontSize:20,fontWeight:700,color:"#1D1D1F"}}>{top.name}</div><div style={{fontFamily:F,fontSize:13,color:"#86868B",marginTop:2}}>{top.tagline}</div></div></div>
      <p style={{fontFamily:F,fontSize:14,color:"#6E6E73",lineHeight:1.7,marginBottom:20}}>{top.description}</p>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}><div><div style={{fontFamily:F,fontSize:11,fontWeight:600,color:"#34C759",marginBottom:10}}>장점</div>{top.pros.map((p,i)=><div key={i} style={{fontFamily:F,fontSize:13,color:"#3A3A3C",padding:"4px 0",display:"flex",gap:6}}><span style={{color:"#34C759"}}>+</span>{p}</div>)}</div><div><div style={{fontFamily:F,fontSize:11,fontWeight:600,color:"#FF3B30",marginBottom:10}}>유의사항</div>{top.cons.map((c,i)=><div key={i} style={{fontFamily:F,fontSize:13,color:"#636366",padding:"4px 0",display:"flex",gap:6}}><span style={{color:"#FF3B30"}}>−</span>{c}</div>)}</div></div>
    </div>
    <div style={{background:"#FFF",borderRadius:20,padding:24,boxShadow:"0 2px 20px rgba(0,0,0,0.06)",marginBottom:16}}><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,textAlign:"center"}}>{sorted.map(([k,s])=>{const p=products[k],pc=Math.round((s/Math.max(mx,1))*100);return(<div key={k}><div style={{position:"relative",display:"inline-block",marginBottom:8}}><ScoreRing pct={pc} color={p.color}/><div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontFamily:FD,fontSize:14,fontWeight:700,color:"#1D1D1F"}}>{pc}</div></div><div style={{fontFamily:F,fontSize:12,fontWeight:600}}>{p.name}</div></div>);})}</div></div>
    {aQs.length<questions.length&&<div style={{fontFamily:F,fontSize:12,color:"#AEAEB2",textAlign:"center",marginBottom:12}}>{questions.length-aQs.length}개 질문 스킵됨</div>}
    <ShareBtns title={`나의 금융상품: ${top.name}`} text={top.tagline}/>
    <div style={{marginTop:24}}><ConsultCTA label={`${top.name} 관련 상담`}/></div>
    <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:24,flexWrap:"wrap"}}><button onClick={restart} style={{fontFamily:F,fontSize:15,color:"#007AFF",background:"#FFF",border:"1px solid #D1D1D6",borderRadius:14,padding:"14px 28px",cursor:"pointer"}}>다시 진단</button>{mode==="quick"&&<button onClick={toDetail} style={{fontFamily:F,fontSize:15,color:"#5856D6",background:"#FFF",border:"1px solid #D1D1D6",borderRadius:14,padding:"14px 28px",cursor:"pointer"}}>상세 →</button>}<button onClick={onHome} style={{fontFamily:F,fontSize:15,fontWeight:600,color:"#FFF",background:"#007AFF",border:"none",borderRadius:14,padding:"14px 28px",cursor:"pointer"}}>홈으로</button></div>
  </div>);
}

/* ═══════════════════════════════════════════
   VEHICLE RESULT
   ═══════════════════════════════════════════ */
function VehResult({answers,questions,mode,products,restart,toDetail,onHome,onOption,aiCfg}){
  const tags=Object.values(answers).flatMap(a=>a.tags||[]);const aQs=questions.filter(q=>answers[q.id]);
  const scored=VEHICLES.map(v=>{let s=0;tags.forEach(t=>{if(v.tags.includes(t))s++;if(v.class===t)s++;});return{...v,s};}).sort((a,b)=>b.s-a.s).slice(0,4);const top=scored[0];
  const ctx=Object.entries(answers).map(([k,v])=>`${k}:${v.label}`).join(",")+`\n추천:${scored.slice(0,3).map(v=>v.name).join(",")}`;
  return(<div style={{maxWidth:520,margin:"0 auto"}}>
    <div style={{textAlign:"center",marginBottom:8}}><span style={{display:"inline-block",padding:"5px 14px",borderRadius:20,background:mode==="quick"?"#F5F5F7":"#5856D6",fontFamily:F,fontSize:12,fontWeight:600,color:mode==="quick"?"#86868B":"#FFF"}}>{mode==="quick"?"간편":"상세"} · {aQs.length}개 응답</span></div>
    <div style={{textAlign:"center",marginBottom:32}}><h2 style={{fontFamily:FD,fontSize:"clamp(26px,5vw,36px)",fontWeight:700,color:"#1D1D1F",lineHeight:1.25}}><span style={{color:"#5856D6"}}>{top.name}</span>을(를) 추천합니다.</h2></div>
    <ParkAI ctx={ctx} cfg={aiCfg}/>
    {scored.map((v,i)=>(<div key={v.name} style={{background:"#FFF",borderRadius:20,padding:22,boxShadow:"0 2px 16px rgba(0,0,0,0.05)",marginBottom:12,border:i===0?"2px solid #5856D6":"none"}}>
      {i===0&&<div style={{fontFamily:F,fontSize:11,fontWeight:600,color:"#5856D6",marginBottom:10}}>BEST MATCH</div>}
      <div style={{display:"flex",alignItems:"center",gap:16}}><div style={{fontSize:36}}>{v.img}</div><div style={{flex:1}}><div style={{fontFamily:FD,fontSize:18,fontWeight:700,color:"#1D1D1F"}}>{v.brand} {v.name}</div><div style={{fontFamily:F,fontSize:13,color:"#86868B"}}>{v.class}</div></div><div style={{textAlign:"right"}}><div style={{fontFamily:FD,fontSize:18,fontWeight:700}}>{(v.price/100).toFixed(1)}천만</div></div></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginTop:14}}>{Object.entries(v.monthly).map(([k,val])=>val>0?(<div key={k} style={{background:products[k].lightBg,borderRadius:10,padding:"8px 4px",textAlign:"center"}}><div style={{fontFamily:F,fontSize:10,color:"#86868B"}}>{products[k].name}</div><div style={{fontFamily:FD,fontSize:14,fontWeight:700,color:products[k].color}}>{val}만</div><div style={{fontFamily:F,fontSize:9,color:"#AEAEB2"}}>/월</div></div>):(<div key={k} style={{background:"#F5F5F7",borderRadius:10,padding:"8px 4px",textAlign:"center"}}><div style={{fontFamily:F,fontSize:10,color:"#86868B"}}>{products[k].name}</div><div style={{fontFamily:FD,fontSize:14,fontWeight:700}}>일시불</div></div>))}</div>
    </div>))}
    {aQs.length<questions.length&&<div style={{fontFamily:F,fontSize:12,color:"#AEAEB2",textAlign:"center",marginBottom:12}}>{questions.length-aQs.length}개 질문 스킵됨</div>}
    <ShareBtns title={`추천 차종: ${top.brand} ${top.name}`} text={top.class}/>
    <div style={{marginTop:24}}><ConsultCTA label={`${top.brand} ${top.name} 상담`}/></div>
    <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:24,flexWrap:"wrap"}}><button onClick={restart} style={{fontFamily:F,fontSize:15,color:"#5856D6",background:"#FFF",border:"1px solid #D1D1D6",borderRadius:14,padding:"14px 28px",cursor:"pointer"}}>다시 진단</button>{mode==="quick"&&<button onClick={toDetail} style={{fontFamily:F,fontSize:15,color:"#5856D6",background:"#FFF",border:"1px solid #D1D1D6",borderRadius:14,padding:"14px 28px",cursor:"pointer"}}>상세 →</button>}<button onClick={onHome} style={{fontFamily:F,fontSize:15,fontWeight:600,color:"#FFF",background:"#5856D6",border:"none",borderRadius:14,padding:"14px 28px",cursor:"pointer"}}>홈으로</button></div>
    {/* Option Recommendation CTA */}
    {TRIMS[top.name]&&<div style={{marginTop:20,background:"linear-gradient(135deg,#5856D6,#7C6FE0)",borderRadius:20,padding:24,textAlign:"center"}}>
      <div style={{fontFamily:FD,fontSize:17,fontWeight:700,color:"#FFF",marginBottom:6}}>{top.name}의 최적 옵션은?</div>
      <div style={{fontFamily:F,fontSize:13,color:"rgba(255,255,255,0.7)",marginBottom:16}}>5개 질문으로 딱 맞는 트림과 옵션을 추천해드립니다</div>
      <button onClick={()=>onOption&&onOption(top)} style={{fontFamily:F,fontSize:15,fontWeight:600,color:"#5856D6",background:"#FFF",border:"none",borderRadius:14,padding:"14px 32px",cursor:"pointer"}}>🎯 옵션 추천받기</button>
    </div>}
  </div>);
}

/* ═══════════════════════════════════════════
   OPTION QUIZ + RESULT
   ═══════════════════════════════════════════ */
function OptionQuiz({vehicle,products,onHome,onBack,aiCfg}){
  const[phase,setPhase]=useState("survey");// survey|result
  const[qi,setQi]=useState(0);const[ans,setAns]=useState({});const[hist,setHist]=useState([]);const[anim,setAnim]=useState(false);
  const qs=OPT_QUESTIONS;const cur=qs[qi];const aCnt=Object.keys(ans).length;
  const trims=TRIMS[vehicle.name]||[];
  const color="#E04DBF";

  const pick=(o)=>{const na={...ans,[cur.id]:o};setAns(na);setTimeout(()=>{setAnim(true);setTimeout(()=>{if(qi<qs.length-1){setHist(p=>[...p,qi]);setQi(qi+1);}else setPhase("result");setAnim(false);},350);},250);};
  const back=()=>{if(hist.length>0){setAnim(true);setTimeout(()=>{const h=[...hist];const li=h.pop();setHist(h);setAns(a=>{const n={...a};delete n[cur?.id];return n;});setQi(li);setAnim(false);},300);}else onBack();};

  if(phase==="survey"&&cur){
    const pct=Math.round((aCnt/qs.length)*100);
    return(<div style={{paddingTop:16,maxWidth:500,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:8}}><span style={{fontFamily:F,fontSize:13,fontWeight:600,color:"#86868B"}}>{vehicle.brand} {vehicle.name} 옵션 추천</span></div>
      <div style={{marginBottom:32}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontFamily:F,fontSize:12,color:"#AEAEB2"}}><span>Q{aCnt+1}</span><span>{aCnt}/{qs.length}</span></div><div style={{width:"100%",height:4,background:"#E5E5EA",borderRadius:2,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:color,borderRadius:2,transition:"width 0.5s ease"}}/></div></div>
      <div style={{opacity:anim?0:1,transform:anim?"translateX(40px)":"translateX(0)",transition:"all 0.45s ease"}}>
        <h2 style={{fontFamily:FD,fontSize:"clamp(26px,5vw,34px)",fontWeight:700,color:"#1D1D1F",textAlign:"center",lineHeight:1.3,marginBottom:8,whiteSpace:"pre-line"}}>{cur.question}</h2>
        <p style={{fontFamily:F,fontSize:15,color:"#86868B",textAlign:"center",marginBottom:36}}>{cur.subtitle}</p>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {cur.options.map((o,i)=>{const s=ans[cur.id]?.value===o.value;return(
            <button key={o.value} onClick={()=>pick(o)} style={{display:"flex",alignItems:"center",gap:16,padding:"17px 22px",background:s?color:"#FFF",border:"none",borderRadius:16,cursor:"pointer",boxShadow:s?`0 2px 12px ${color}44`:"0 1px 3px rgba(0,0,0,0.06)",opacity:anim?0:1,transform:anim?"translateY(16px)":"translateY(0)",transition:"all 0.25s ease",transitionDelay:`${i*0.04}s`}}
              onMouseEnter={e=>{if(!s)e.currentTarget.style.transform="scale(1.012)";}} onMouseLeave={e=>{if(!s)e.currentTarget.style.transform="scale(1)";}}>
              <span style={{fontFamily:F,fontSize:16,fontWeight:s?600:400,color:s?"#FFF":"#1D1D1F",flex:1}}>{o.label}</span>
              <div style={{width:22,height:22,borderRadius:11,border:s?"none":"2px solid #D1D1D6",background:s?"#FFF":"transparent",display:"flex",alignItems:"center",justifyContent:"center"}}>{s&&<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke={color} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}</div>
            </button>);})}
        </div>
      </div>
      <div style={{textAlign:"center",marginTop:32}}><button onClick={back} style={{background:"none",border:"none",color,fontSize:15,cursor:"pointer",fontFamily:F}}>{hist.length===0?"← 차종 결과로":"이전으로"}</button></div>
    </div>);
  }

  // OPTION RESULT
  if(phase==="result"){
    const userTags=Object.values(ans).flatMap(a=>a.tags||[]);
    const scored=trims.map(t=>{let s=0;userTags.forEach(tag=>{if(t.tags.includes(tag))s++;});return{...t,score:s};}).sort((a,b)=>b.score-a.score);
    const best=scored[0];
    const addPrice=best.add;
    const totalPrice=best.price;
    const ctx=`차종:${vehicle.brand} ${vehicle.name}\n옵션응답:${Object.entries(ans).map(([k,v])=>`${k}:${v.label}`).join(",")}\n추천트림:${best.name}(${best.feats.join(",")})`;

    return(<div style={{maxWidth:520,margin:"0 auto"}}>
      <div style={{textAlign:"center",marginBottom:8}}><span style={{fontFamily:F,fontSize:12,fontWeight:600,color:color}}>옵션 추천 완료</span></div>
      <div style={{textAlign:"center",marginBottom:32}}>
        <h2 style={{fontFamily:FD,fontSize:"clamp(24px,5vw,34px)",fontWeight:700,color:"#1D1D1F",lineHeight:1.3}}>
          {vehicle.name}은<br/><span style={{color}}>{best.name}</span> 트림을<br/>추천합니다.
        </h2>
      </div>

      <ParkAI ctx={ctx} cfg={aiCfg}/>

      {/* Recommended Trim */}
      <div style={{background:"#FFF",borderRadius:24,padding:28,boxShadow:"0 2px 20px rgba(0,0,0,0.06)",marginBottom:16,border:`2px solid ${color}`}}>
        <div style={{fontFamily:F,fontSize:11,fontWeight:600,color,marginBottom:12}}>BEST OPTION</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <div><div style={{fontFamily:FD,fontSize:22,fontWeight:700,color:"#1D1D1F"}}>{vehicle.brand} {vehicle.name}</div><div style={{fontFamily:F,fontSize:15,fontWeight:600,color,marginTop:2}}>{best.name} 트림</div></div>
          <div style={{textAlign:"right"}}><div style={{fontFamily:FD,fontSize:22,fontWeight:700,color:"#1D1D1F"}}>{(totalPrice/100).toFixed(1)}천만</div>{addPrice>0&&<div style={{fontFamily:F,fontSize:12,color:"#86868B"}}>기본 대비 +{addPrice}만원</div>}</div>
        </div>
        <div style={{fontFamily:F,fontSize:13,fontWeight:600,color:"#1D1D1F",marginBottom:10}}>주요 포함 사양</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
          {best.feats.map((f,i)=>(<div key={i} style={{fontFamily:F,fontSize:13,color:"#3A3A3C",padding:"8px 14px",background:"#F5F5F7",borderRadius:10,display:"flex",alignItems:"center",gap:6}}><span style={{color:"#34C759"}}>✓</span>{f}</div>))}
        </div>
        {/* Monthly cost by product */}
        <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid #F5F5F7"}}>
          <div style={{fontFamily:F,fontSize:12,fontWeight:600,color:"#86868B",marginBottom:10}}>이 트림의 예상 월 비용</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
            {PK.map(k=>{const pr=products[k];const m=k==="cash"?0:Math.round(totalPrice*10000*(k==="rent"?1.06:k==="lease"?1.035:1.045)/48/10000)+(k==="rent"?8:0);
              return(<div key={k} style={{background:pr.lightBg,borderRadius:10,padding:"8px 4px",textAlign:"center"}}><div style={{fontFamily:F,fontSize:10,color:"#86868B"}}>{pr.name}</div>{m>0?<div style={{fontFamily:FD,fontSize:14,fontWeight:700,color:pr.color}}>{m}만<span style={{fontSize:9}}>/월</span></div>:<div style={{fontFamily:FD,fontSize:14,fontWeight:700}}>일시불</div>}</div>);
            })}
          </div>
        </div>
      </div>

      {/* All trims comparison */}
      <div style={{background:"#FFF",borderRadius:20,padding:24,boxShadow:"0 2px 16px rgba(0,0,0,0.05)",marginBottom:16}}>
        <div style={{fontFamily:FD,fontSize:16,fontWeight:700,color:"#1D1D1F",marginBottom:16}}>전체 트림 비교</div>
        {scored.map((t,i)=>(<div key={t.name} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0",borderBottom:i<scored.length-1?"1px solid #F5F5F7":"none"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            {i===0&&<span style={{fontFamily:F,fontSize:10,fontWeight:700,color:"#FFF",background:color,borderRadius:6,padding:"2px 8px"}}>추천</span>}
            <div><div style={{fontFamily:F,fontSize:15,fontWeight:i===0?700:500,color:"#1D1D1F"}}>{t.name}</div><div style={{fontFamily:F,fontSize:11,color:"#86868B",marginTop:2}}>{t.feats.slice(0,3).join(" · ")}</div></div>
          </div>
          <div style={{textAlign:"right"}}><div style={{fontFamily:FD,fontSize:16,fontWeight:700,color:"#1D1D1F"}}>{(t.price/100).toFixed(1)}천만</div>{t.add>0&&<div style={{fontFamily:F,fontSize:11,color:"#AEAEB2"}}>+{t.add}만</div>}</div>
        </div>))}
      </div>

      <ShareBtns title={`${vehicle.name} 추천 트림: ${best.name}`} text={`${best.feats.slice(0,3).join(", ")} 포함`}/>
      <div style={{marginTop:24}}><ConsultCTA label={`${vehicle.name} ${best.name} 견적 상담`}/></div>
      <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:24,flexWrap:"wrap"}}>
        <button onClick={onBack} style={{fontFamily:F,fontSize:15,color:"#5856D6",background:"#FFF",border:"1px solid #D1D1D6",borderRadius:14,padding:"14px 28px",cursor:"pointer"}}>← 차종 결과</button>
        <button onClick={onHome} style={{fontFamily:F,fontSize:15,fontWeight:600,color:"#FFF",background:color,border:"none",borderRadius:14,padding:"14px 28px",cursor:"pointer"}}>홈으로</button>
      </div>
    </div>);
  }
  return null;
}

/* ═══════════════════════════════════════════
   CALCULATOR (compact)
   ═══════════════════════════════════════════ */
function Calc({products,onHome}){const[v,sV]=useState(VEHICLES[3]);const[p,sP]=useState(48);const[d,sD]=useState(20);const b=v.price*10000,da=b*d/100,fi=b-da;
  const cs={installment:{m:Math.round(fi*1.045/p/10000),t:Math.round(fi*1.045/10000)+Math.round(da/10000),n:"이자 4.5%"},lease:{m:Math.round(fi*1.035/p/10000),t:Math.round(fi*1.035/10000)+Math.round(da/10000),n:"리스 3.5%"},rent:{m:Math.round(fi*1.06/p/10000)+8,t:Math.round((fi*1.06/p/10000+8)*p),n:"보험·정비 포함"},cash:{m:0,t:Math.round(b/10000),n:"일시불"}};
  return(<div style={{maxWidth:560,margin:"0 auto"}}><div style={{textAlign:"center",marginBottom:32}}><h2 style={{fontFamily:FD,fontSize:"clamp(26px,5vw,34px)",fontWeight:700,color:"#1D1D1F"}}>월 비용 계산기</h2><p style={{fontFamily:F,fontSize:15,color:"#86868B",marginTop:8}}>차종과 조건을 선택하면 비교합니다</p></div>
    <div style={{background:"#FFF",borderRadius:20,padding:24,boxShadow:"0 2px 16px rgba(0,0,0,0.05)",marginBottom:16}}><label style={{fontFamily:F,fontSize:12,fontWeight:600,color:"#86868B",display:"block",marginBottom:10}}>차종</label><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8}}>{VEHICLES.filter((_,i)=>[0,2,3,5,6,8,10,12,13].includes(i)).map(x=>(<button key={x.name} onClick={()=>sV(x)} style={{fontFamily:F,fontSize:12,fontWeight:v.name===x.name?600:400,padding:"10px 8px",background:v.name===x.name?"#007AFF":"#F5F5F7",color:v.name===x.name?"#FFF":"#1D1D1F",border:"none",borderRadius:10,cursor:"pointer",textAlign:"center"}}><div style={{fontSize:20,marginBottom:4}}>{x.img}</div>{x.name}</button>))}</div></div>
    <div style={{background:"#FFF",borderRadius:20,padding:24,boxShadow:"0 2px 16px rgba(0,0,0,0.05)",marginBottom:16}}><div style={{marginBottom:20}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontFamily:F,fontSize:13,fontWeight:600}}>기간</span><span style={{fontFamily:FD,fontSize:15,fontWeight:700,color:"#007AFF"}}>{p}개월</span></div><input type="range" min={24} max={72} step={12} value={p} onChange={e=>sP(+e.target.value)} style={{width:"100%",accentColor:"#007AFF"}}/></div><div><div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontFamily:F,fontSize:13,fontWeight:600}}>선수금</span><span style={{fontFamily:FD,fontSize:15,fontWeight:700,color:"#007AFF"}}>{d}%</span></div><input type="range" min={0} max={50} step={10} value={d} onChange={e=>sD(+e.target.value)} style={{width:"100%",accentColor:"#007AFF"}}/></div></div>
    <div style={{background:"#FFF",borderRadius:20,padding:24,boxShadow:"0 2px 16px rgba(0,0,0,0.05)",marginBottom:16}}><div style={{fontFamily:FD,fontSize:16,fontWeight:700,marginBottom:4}}>{v.brand} {v.name}</div><div style={{fontFamily:F,fontSize:13,color:"#86868B",marginBottom:20}}>{(v.price/100).toFixed(1)}천만 · {p}개월 · 선수금 {d}%</div><div style={{display:"flex",flexDirection:"column",gap:10}}>{Object.entries(cs).map(([k,c])=>{const pr=products[k];return(<div key={k} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 18px",background:pr.lightBg,borderRadius:14}}><div style={{fontSize:22}}>{pr.emoji}</div><div style={{flex:1}}><div style={{fontFamily:F,fontSize:14,fontWeight:600}}>{pr.name}</div><div style={{fontFamily:F,fontSize:11,color:"#86868B"}}>{c.n}</div></div><div style={{textAlign:"right"}}>{c.m>0?<><div style={{fontFamily:FD,fontSize:20,fontWeight:700,color:pr.color}}>{c.m}<span style={{fontSize:13}}>만/월</span></div><div style={{fontFamily:F,fontSize:11,color:"#86868B"}}>총 {c.t}만</div></>:<div style={{fontFamily:FD,fontSize:20,fontWeight:700,color:pr.color}}>{c.t}만</div>}</div></div>);})}</div></div>
    <ConsultCTA label={`${v.brand} ${v.name} 상담`}/><div style={{textAlign:"center",marginTop:24}}><button onClick={onHome} style={{fontFamily:F,fontSize:15,fontWeight:600,color:"#FFF",background:"#007AFF",border:"none",borderRadius:14,padding:"14px 32px",cursor:"pointer"}}>홈으로</button></div>
  </div>);
}

/* ═══════════════════════════════════════════
   ADMIN PANEL (finance + vehicle questions)
   ═══════════════════════════════════════════ */
const abtn=(bg="#007AFF",c="#FFF",x={})=>({fontFamily:F,fontSize:13,fontWeight:600,color:c,background:bg,border:"none",borderRadius:10,padding:"8px 16px",cursor:"pointer",...x});
const ainp=(x={})=>({fontFamily:F,fontSize:14,color:"#1D1D1F",background:"#F5F5F7",border:"1px solid #E5E5EA",borderRadius:10,padding:"10px 14px",outline:"none",width:"100%",boxSizing:"border-box",...x});

function Admin({data,onSave,onBack}){
  const[fb,sFb]=useState(JSON.parse(JSON.stringify(data.finBasic)));const[fd,sFd]=useState(JSON.parse(JSON.stringify(data.finDetail)));
  const[vb,sVb]=useState(JSON.parse(JSON.stringify(data.vehBasic)));const[vd,sVd]=useState(JSON.parse(JSON.stringify(data.vehDetail)));
  const[pr,sPr]=useState(JSON.parse(JSON.stringify(data.products)));
  const[ai,sAi]=useState(JSON.parse(JSON.stringify(data.aiConfig||DEF_AI_CONFIG)));
  const[tab,sTab]=useState("fb");const[eq,sEq]=useState(null);const[saved,sSaved]=useState(false);const[cfR,sCfR]=useState(false);
  const[testResult,sTestResult]=useState("");const[testLoading,sTestLoading]=useState(false);

  const tabMap={fb:{qs:fb,set:sFb,label:"금융 간편",type:"finance"},fd:{qs:fd,set:sFd,label:"금융 상세",type:"finance"},vb:{qs:vb,set:sVb,label:"차종 간편",type:"vehicle"},vd:{qs:vd,set:sVd,label:"차종 상세",type:"vehicle"},pr:{qs:null,set:null,label:"상품",type:"product"},ai:{qs:null,set:null,label:"AI 캐릭터",type:"ai"}};
  const cur=tabMap[tab];const qs=cur?.qs;const setQs=cur?.set;
  const allFinQ=[...fb,...fd];const allVehQ=[...vb,...vd];const allQ=cur?.type==="finance"?allFinQ:cur?.type==="vehicle"?allVehQ:[];

  const hSave=async()=>{
    try{
      const ok=await onSave({finBasic:fb,finDetail:fd,vehBasic:vb,vehDetail:vd,products:pr,aiConfig:ai});
      sSaved(true);setTimeout(()=>sSaved(false),2000);
    }catch(e){
      sSaved(true);setTimeout(()=>sSaved(false),2000);
    }
  };
  const hReset=async()=>{sFb(JSON.parse(JSON.stringify(DEF_FIN_BASIC)));sFd(JSON.parse(JSON.stringify(DEF_FIN_DETAIL)));sVb(JSON.parse(JSON.stringify(DEF_VEH_BASIC)));sVd(JSON.parse(JSON.stringify(DEF_VEH_DETAIL)));sPr(JSON.parse(JSON.stringify(DEF_PRODUCTS)));sAi(JSON.parse(JSON.stringify(DEF_AI_CONFIG)));sCfR(false);await onSave({finBasic:DEF_FIN_BASIC,finDetail:DEF_FIN_DETAIL,vehBasic:DEF_VEH_BASIC,vehDetail:DEF_VEH_DETAIL,products:DEF_PRODUCTS,aiConfig:DEF_AI_CONFIG});sSaved(true);setTimeout(()=>sSaved(false),2000);};

  const uAi=(f,v)=>sAi(a=>({...a,[f]:v}));
  const uFb=(i,v)=>sAi(a=>{const f=[...a.fallbacks];f[i]=v;return{...a,fallbacks:f};});
  const addFb=()=>sAi(a=>({...a,fallbacks:[...a.fallbacks,"새 폴백 메시지"]}));
  const delFb=(i)=>sAi(a=>{const f=[...a.fallbacks];f.splice(i,1);return{...a,fallbacks:f};});
  const applyTone=(preset)=>sAi(a=>({...a,promptTemplate:a.promptTemplate.replace(/^.*조언.*$/m, preset.prompt)}));

  const testAI=async()=>{
    sTestLoading(true); sTestResult("");
    const prompt = (ai.promptTemplate||"").replace("{charName}",ai.charName).replace("{context}","business:개인사업자, ownership:편하게 사용, budget:목돈 부담\n추천:장기렌트");
    try{
      const r=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:ai.model,max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      const d=await r.json(); sTestResult(d.content?.map(x=>x.text||"").join("")||"응답 없음");
    }catch(e){ sTestResult("API 호출 실패: "+e.message); }
    sTestLoading(false);
  };

  // Generic question CRUD
  const uQ=(i,f,v)=>{const q=[...qs];q[i]={...q[i],[f]:v};setQs(q);};
  const uO=(qi,oi,f,v)=>{const q=JSON.parse(JSON.stringify(qs));q[qi].options[oi][f]=v;setQs(q);};
  const uS=(qi,oi,pk,v)=>{const q=JSON.parse(JSON.stringify(qs));q[qi].options[oi].scores[pk]=Math.max(0,Math.min(5,parseInt(v)||0));setQs(q);};
  const tTag=(qi,oi,tag)=>{const q=JSON.parse(JSON.stringify(qs));const ts=q[qi].options[oi].tags;const x=ts.indexOf(tag);if(x>=0)ts.splice(x,1);else ts.push(tag);setQs(q);};
  const addQ=()=>{const isV=cur.type==="vehicle";const q=[...qs,{id:"q_"+Date.now(),question:"새 질문",subtitle:"설명",skipIf:[],options:[
    {label:"선택지 1",value:"o1",...(isV?{tags:[],nextQ:""}:{scores:{installment:0,lease:0,rent:0,cash:0},nextQ:""})},
    {label:"선택지 2",value:"o2",...(isV?{tags:[],nextQ:""}:{scores:{installment:0,lease:0,rent:0,cash:0},nextQ:""})},
  ]}];setQs(q);sEq(q.length-1);};
  const delQ=(i)=>{const q=[...qs];q.splice(i,1);setQs(q);if(eq===i)sEq(null);};
  const mvQ=(i,d)=>{const q=[...qs];const n=i+d;if(n<0||n>=q.length)return;[q[i],q[n]]=[q[n],q[i]];setQs(q);if(eq===i)sEq(n);};
  const addO=(qi)=>{const isV=cur.type==="vehicle";const q=JSON.parse(JSON.stringify(qs));q[qi].options.push({label:"새 선택지",value:"v_"+Date.now(),...(isV?{tags:[],nextQ:""}:{scores:{installment:0,lease:0,rent:0,cash:0},nextQ:""})});setQs(q);};
  const delO=(qi,oi)=>{const q=JSON.parse(JSON.stringify(qs));if(q[qi].options.length<=2)return;q[qi].options.splice(oi,1);setQs(q);};
  const addSk=(qi)=>{const q=JSON.parse(JSON.stringify(qs));if(!q[qi].skipIf)q[qi].skipIf=[];q[qi].skipIf.push({qId:"",values:[]});setQs(q);};
  const rmSk=(qi,si)=>{const q=JSON.parse(JSON.stringify(qs));q[qi].skipIf.splice(si,1);setQs(q);};
  const uSkQ=(qi,si,v)=>{const q=JSON.parse(JSON.stringify(qs));q[qi].skipIf[si]={qId:v,values:[]};setQs(q);};
  const tSkV=(qi,si,v)=>{const q=JSON.parse(JSON.stringify(qs));const vs=q[qi].skipIf[si].values;const x=vs.indexOf(v);if(x>=0)vs.splice(x,1);else vs.push(v);setQs(q);};

  const uP=(k,f,v)=>sPr(p=>({...p,[k]:{...p[k],[f]:v}}));
  const uPL=(k,f,i,v)=>sPr(p=>{const a=[...p[k][f]];a[i]=v;return{...p,[k]:{...p[k],[f]:a}};});
  const aPL=(k,f)=>sPr(p=>({...p,[k]:{...p[k],[f]:[...p[k][f],"새 항목"]}}));
  const dPL=(k,f,i)=>sPr(p=>{const a=[...p[k][f]];a.splice(i,1);return{...p,[k]:{...p[k],[f]:a}};});

  return(<div style={{minHeight:"100vh",background:"#F5F5F7",fontFamily:F}}>
    <nav style={{padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(245,245,247,0.72)",backdropFilter:"blur(20px)",borderBottom:"0.5px solid rgba(0,0,0,0.08)",position:"sticky",top:0,zIndex:100}}>
      <button onClick={onBack} style={{background:"none",border:"none",color:"#007AFF",fontSize:15,cursor:"pointer",fontFamily:F}}>← 돌아가기</button>
      <span style={{fontFamily:FD,fontSize:16,fontWeight:700}}>관리자</span>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>{saved&&<span style={{fontFamily:F,fontSize:13,color:"#34C759",fontWeight:600}}>✓</span>}<button onClick={hSave} style={abtn()}>저장</button></div>
    </nav>
    <main style={{padding:"20px 20px 80px",maxWidth:700,margin:"0 auto"}}>
      {/* Tabs */}
      <div style={{display:"flex",gap:3,background:"#E5E5EA",borderRadius:12,padding:3,marginBottom:24,flexWrap:"wrap"}}>
        {[["fb","금융간편"],["fd","금융상세"],["vb","차종간편"],["vd","차종상세"],["pr","상품"],["ai","AI"]].map(([k,l])=>(<button key={k} onClick={()=>{sTab(k);sEq(null);}} style={{flex:1,minWidth:50,padding:"10px 0",borderRadius:10,border:"none",cursor:"pointer",fontFamily:F,fontSize:11,fontWeight:600,background:tab===k?"#FFF":"transparent",color:tab===k?"#1D1D1F":"#86868B",boxShadow:tab===k?"0 1px 4px rgba(0,0,0,0.08)":"none"}}>{l}</button>))}
      </div>

      {/* Questions */}
      {tab!=="pr"&&tab!=="ai"&&qs&&(<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}><span style={{fontFamily:FD,fontSize:18,fontWeight:700}}>{cur.label} ({qs.length}개)</span><button onClick={addQ} style={abtn()}>+ 추가</button></div>
        {qs.map((q,qi)=>(<div key={q.id} style={{background:"#FFF",borderRadius:16,overflow:"hidden",marginBottom:10,border:eq===qi?"2px solid #007AFF":"2px solid transparent"}}>
          <div style={{padding:"14px 20px",display:"flex",alignItems:"center",gap:12,cursor:"pointer"}} onClick={()=>sEq(eq===qi?null:qi)}>
            <span style={{fontFamily:F,fontSize:12,fontWeight:700,color:"#86868B",minWidth:26}}>Q{qi+1}</span>
            <div style={{flex:1}}><div style={{fontFamily:F,fontSize:14,fontWeight:600,color:"#1D1D1F"}}>{q.question.replace("\n"," ")}</div><div style={{fontFamily:F,fontSize:10,color:"#AEAEB2",marginTop:2,display:"flex",gap:8}}><span>{q.options.length}개</span>{q.skipIf?.length>0&&<span style={{color:"#FF9500"}}>스킵{q.skipIf.length}</span>}{q.options.some(o=>o.nextQ)&&<span style={{color:"#5856D6"}}>분기</span>}</div></div>
            <div style={{display:"flex",gap:4}}><button onClick={e=>{e.stopPropagation();mvQ(qi,-1);}} style={{background:"#F5F5F7",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:13}}>↑</button><button onClick={e=>{e.stopPropagation();mvQ(qi,1);}} style={{background:"#F5F5F7",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:13}}>↓</button><button onClick={e=>{e.stopPropagation();delQ(qi);}} style={{background:"#FFF5F5",border:"none",borderRadius:8,width:30,height:30,cursor:"pointer",fontSize:13,color:"#FF3B30"}}>✕</button></div>
          </div>
          {eq===qi&&(<div style={{padding:"0 20px 20px",borderTop:"1px solid #F5F5F7"}}><div style={{paddingTop:14,display:"flex",flexDirection:"column",gap:12}}>
            <div><label style={{fontFamily:F,fontSize:11,fontWeight:600,color:"#86868B",display:"block",marginBottom:6}}>질문</label><textarea value={q.question} onChange={e=>uQ(qi,"question",e.target.value)} style={{...ainp(),height:56,resize:"vertical"}}/></div>
            <div><label style={{fontFamily:F,fontSize:11,fontWeight:600,color:"#86868B",display:"block",marginBottom:6}}>설명</label><input value={q.subtitle} onChange={e=>uQ(qi,"subtitle",e.target.value)} style={ainp()}/></div>
            {/* Skip */}
            <div style={{background:"#FFFBF0",borderRadius:12,padding:12,border:"1px solid #FFE8B0"}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><label style={{fontFamily:F,fontSize:11,fontWeight:600,color:"#FF9500"}}>🔀 스킵 조건</label><button onClick={()=>addSk(qi)} style={abtn("#FFF5E0","#FF9500",{fontSize:10,padding:"4px 10px"})}>+ 조건</button></div>
              {(!q.skipIf||!q.skipIf.length)?<div style={{fontFamily:F,fontSize:11,color:"#AEAEB2"}}>조건 없음</div>:q.skipIf.map((c,si)=>{const rQ=allQ.find(x=>x.id===c.qId);return(<div key={si} style={{background:"#FFF",borderRadius:10,padding:10,marginBottom:6}}>
                <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:6}}><select value={c.qId} onChange={e=>uSkQ(qi,si,e.target.value)} style={{...ainp({fontSize:12,padding:"6px 8px",flex:1})}}><option value="">질문 선택</option>{allQ.filter(x=>x.id!==q.id).map(x=><option key={x.id} value={x.id}>{x.question.replace("\n"," ")}</option>)}</select><button onClick={()=>rmSk(qi,si)} style={{background:"none",border:"none",color:"#FF3B30",cursor:"pointer"}}>✕</button></div>
                {rQ&&<div style={{display:"flex",flexWrap:"wrap",gap:4}}>{rQ.options.map(o=><button key={o.value} onClick={()=>tSkV(qi,si,o.value)} style={{fontFamily:F,fontSize:10,padding:"3px 8px",borderRadius:6,border:"none",cursor:"pointer",background:c.values.includes(o.value)?"#FF9500":"#F5F5F7",color:c.values.includes(o.value)?"#FFF":"#86868B"}}>{o.label}</button>)}</div>}
              </div>);})}
            </div>
            {/* Options */}
            <div><div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}><label style={{fontFamily:F,fontSize:11,fontWeight:600,color:"#86868B"}}>선택지{cur.type==="finance"?" & 가중치":""} & 분기{cur.type==="vehicle"?" & 태그":""}</label><button onClick={()=>addO(qi)} style={abtn("#F5F5F7","#007AFF",{fontSize:11,padding:"5px 10px"})}>+</button></div>
              {q.options.map((o,oi)=>(<div key={oi} style={{background:"#FAFAFA",borderRadius:12,padding:12,marginBottom:8}}>
                <div style={{display:"flex",gap:6,marginBottom:8,alignItems:"center"}}><input value={o.label} onChange={e=>uO(qi,oi,"label",e.target.value)} style={ainp({flex:1,fontSize:13})}/>{q.options.length>2&&<button onClick={()=>delO(qi,oi)} style={{background:"none",border:"none",color:"#FF3B30",cursor:"pointer"}}>✕</button>}</div>
                {/* Finance: scores */}
                {cur.type==="finance"&&<div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:8}}>{PK.map(pk=><div key={pk} style={{textAlign:"center"}}><div style={{fontFamily:F,fontSize:9,fontWeight:600,color:"#AEAEB2",marginBottom:3}}>{PL[pk]}</div><input type="number" min="0" max="5" value={o.scores[pk]} onChange={e=>uS(qi,oi,pk,e.target.value)} style={{...ainp({textAlign:"center",padding:"5px 2px",fontSize:14,fontWeight:700}),width:"100%"}}/></div>)}</div>}
                {/* Vehicle: tags */}
                {cur.type==="vehicle"&&<div style={{marginBottom:8}}><div style={{fontFamily:F,fontSize:10,color:"#86868B",marginBottom:4}}>태그:</div><div style={{display:"flex",flexWrap:"wrap",gap:4}}>{ALL_TAGS.map(t=><button key={t} onClick={()=>tTag(qi,oi,t)} style={{fontFamily:F,fontSize:10,padding:"3px 8px",borderRadius:6,border:"none",cursor:"pointer",background:o.tags?.includes(t)?"#5856D6":"#F0F0F0",color:o.tags?.includes(t)?"#FFF":"#86868B"}}>{t}</button>)}</div></div>}
                {/* Branch */}
                <div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontFamily:F,fontSize:10,color:"#5856D6",fontWeight:600}}>↳분기:</span><select value={o.nextQ||""} onChange={e=>uO(qi,oi,"nextQ",e.target.value)} style={{...ainp({fontSize:11,padding:"5px 8px",flex:1,color:o.nextQ?"#5856D6":"#AEAEB2"})}}><option value="">기본 순서</option>{allQ.filter(x=>x.id!==q.id).map(x=><option key={x.id} value={x.id}>→ {x.question.replace("\n"," ")}</option>)}</select></div>
              </div>))}
            </div>
          </div></div>)}
        </div>))}
      </div>)}

      {/* Products */}
      {tab==="pr"&&<div><div style={{fontFamily:FD,fontSize:18,fontWeight:700,marginBottom:16}}>상품 정보</div>{PK.map(pk=>{const p=pr[pk];return(<div key={pk} style={{background:"#FFF",borderRadius:16,padding:20,marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}><div style={{width:40,height:40,borderRadius:12,background:p.lightBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20}}>{p.emoji}</div><div style={{fontFamily:FD,fontSize:18,fontWeight:700}}>{p.name}</div></div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}><div><label style={{fontFamily:F,fontSize:11,fontWeight:600,color:"#86868B",display:"block",marginBottom:4}}>상품명</label><input value={p.name} onChange={e=>uP(pk,"name",e.target.value)} style={ainp()}/></div><div><label style={{fontFamily:F,fontSize:11,fontWeight:600,color:"#86868B",display:"block",marginBottom:4}}>태그라인</label><input value={p.tagline} onChange={e=>uP(pk,"tagline",e.target.value)} style={ainp()}/></div></div>
          <div><label style={{fontFamily:F,fontSize:11,fontWeight:600,color:"#86868B",display:"block",marginBottom:4}}>설명</label><textarea value={p.description} onChange={e=>uP(pk,"description",e.target.value)} style={{...ainp(),height:56,resize:"vertical"}}/></div>
          <div><label style={{fontFamily:F,fontSize:11,fontWeight:600,color:"#86868B",display:"block",marginBottom:4}}>추천 대상</label><input value={p.bestFor} onChange={e=>uP(pk,"bestFor",e.target.value)} style={ainp()}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>{["pros","cons"].map(f=><div key={f}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><label style={{fontFamily:F,fontSize:11,fontWeight:600,color:f==="pros"?"#34C759":"#FF3B30"}}>{f==="pros"?"장점":"유의사항"}</label><button onClick={()=>aPL(pk,f)} style={{background:"none",border:"none",color:"#007AFF",fontSize:12,cursor:"pointer"}}>+</button></div>{p[f].map((item,i)=><div key={i} style={{display:"flex",gap:6,marginBottom:4}}><input value={item} onChange={e=>uPL(pk,f,i,e.target.value)} style={ainp({fontSize:12,padding:"6px 10px"})}/><button onClick={()=>dPL(pk,f,i)} style={{background:"none",border:"none",color:"#FF3B30",cursor:"pointer",fontSize:13}}>✕</button></div>)}</div>)}</div>
        </div>
      </div>);})}</div>}

      {/* AI CHARACTER TAB */}
      {tab==="ai"&&<div>
        <div style={{fontFamily:FD,fontSize:18,fontWeight:700,marginBottom:16}}>AI 캐릭터 설정</div>

        {/* Preview */}
        <div style={{background:"linear-gradient(135deg,#1D1D1F,#2C2C2E)",borderRadius:20,padding:24,marginBottom:16}}>
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
            <div style={{width:44,height:44,borderRadius:22,background:ai.bgColor||"#007AFF",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22}}>{ai.charEmoji||"👨‍💼"}</div>
            <div><div style={{fontFamily:FD,fontSize:15,fontWeight:700,color:"#FFF"}}>{ai.charTitle||"AI 한마디"}</div><div style={{fontFamily:F,fontSize:11,color:"rgba(255,255,255,0.4)"}}>{ai.charSubtitle||"AI 조언"}</div></div>
          </div>
          <div style={{fontFamily:F,fontSize:14,color:"rgba(255,255,255,0.6)",fontStyle:"italic"}}>미리보기 — 실제 코멘트는 고객 진단 결과에 따라 달라집니다</div>
        </div>

        {/* Character Info */}
        <div style={{background:"#FFF",borderRadius:16,padding:20,marginBottom:12}}>
          <div style={{fontFamily:F,fontSize:14,fontWeight:700,color:"#1D1D1F",marginBottom:14}}>캐릭터 기본 정보</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div><label style={{fontFamily:F,fontSize:11,fontWeight:600,color:"#86868B",display:"block",marginBottom:4}}>캐릭터 이름</label><input value={ai.charName} onChange={e=>uAi("charName",e.target.value)} style={ainp()}/></div>
            <div><label style={{fontFamily:F,fontSize:11,fontWeight:600,color:"#86868B",display:"block",marginBottom:4}}>이모지</label><input value={ai.charEmoji} onChange={e=>uAi("charEmoji",e.target.value)} style={ainp()}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
            <div><label style={{fontFamily:F,fontSize:11,fontWeight:600,color:"#86868B",display:"block",marginBottom:4}}>표시 제목</label><input value={ai.charTitle} onChange={e=>uAi("charTitle",e.target.value)} style={ainp()}/></div>
            <div><label style={{fontFamily:F,fontSize:11,fontWeight:600,color:"#86868B",display:"block",marginBottom:4}}>부제</label><input value={ai.charSubtitle} onChange={e=>uAi("charSubtitle",e.target.value)} style={ainp()}/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div><label style={{fontFamily:F,fontSize:11,fontWeight:600,color:"#86868B",display:"block",marginBottom:4}}>아이콘 배경색</label><div style={{display:"flex",gap:8,alignItems:"center"}}><input type="color" value={ai.bgColor||"#007AFF"} onChange={e=>uAi("bgColor",e.target.value)} style={{width:40,height:36,border:"none",borderRadius:8,cursor:"pointer"}}/><input value={ai.bgColor} onChange={e=>uAi("bgColor",e.target.value)} style={ainp({flex:1})}/></div></div>
            <div><label style={{fontFamily:F,fontSize:11,fontWeight:600,color:"#86868B",display:"block",marginBottom:4}}>세션당 최대 호출</label><input type="number" min={1} max={50} value={ai.maxCalls} onChange={e=>uAi("maxCalls",Math.max(1,parseInt(e.target.value)||5))} style={ainp()}/></div>
          </div>
        </div>

        {/* Model */}
        <div style={{background:"#FFF",borderRadius:16,padding:20,marginBottom:12}}>
          <div style={{fontFamily:F,fontSize:14,fontWeight:700,color:"#1D1D1F",marginBottom:14}}>AI 모델 선택</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {[
              {id:"claude-sonnet-4-20250514",name:"Sonnet 4",desc:"균형 (입력 $3/출력 $15 per 1M)",badge:"현재"},
              {id:"claude-haiku-4-5-20251001",name:"Haiku 4.5",desc:"저비용 (입력 $1/출력 $5 per 1M)",badge:"추천"},
              {id:"claude-sonnet-4-5-20250929",name:"Sonnet 4.5",desc:"고성능 (입력 $3/출력 $15 per 1M)",badge:""},
            ].map(m=>(
              <button key={m.id} onClick={()=>uAi("model",m.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",background:ai.model===m.id?"#007AFF":"#F5F5F7",border:"none",borderRadius:12,cursor:"pointer",textAlign:"left"}}>
                <div style={{width:18,height:18,borderRadius:9,border:ai.model===m.id?"none":"2px solid #D1D1D6",background:ai.model===m.id?"#FFF":"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{ai.model===m.id&&<div style={{width:8,height:8,borderRadius:4,background:"#007AFF"}}/>}</div>
                <div style={{flex:1}}><div style={{fontFamily:F,fontSize:14,fontWeight:600,color:ai.model===m.id?"#FFF":"#1D1D1F"}}>{m.name} {m.badge&&<span style={{fontSize:10,fontWeight:700,color:ai.model===m.id?"rgba(255,255,255,0.7)":"#007AFF",background:ai.model===m.id?"rgba(255,255,255,0.2)":"rgba(0,122,255,0.1)",padding:"2px 6px",borderRadius:4,marginLeft:6}}>{m.badge}</span>}</div><div style={{fontFamily:F,fontSize:11,color:ai.model===m.id?"rgba(255,255,255,0.6)":"#86868B",marginTop:2}}>{m.desc}</div></div>
              </button>
            ))}
          </div>
        </div>

        {/* Tone Presets */}
        <div style={{background:"#FFF",borderRadius:16,padding:20,marginBottom:12}}>
          <div style={{fontFamily:F,fontSize:14,fontWeight:700,color:"#1D1D1F",marginBottom:10}}>톤 프리셋</div>
          <div style={{fontFamily:F,fontSize:12,color:"#86868B",marginBottom:14}}>클릭하면 프롬프트의 조언 스타일 라인이 변경됩니다</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            {(ai.tonePresets||DEF_AI_CONFIG.tonePresets).map((tp,i)=>(
              <button key={i} onClick={()=>applyTone(tp)} style={{padding:"12px 14px",background:"#F5F5F7",border:"none",borderRadius:12,cursor:"pointer",textAlign:"left",transition:"all 0.2s ease"}}
                onMouseEnter={e=>{e.currentTarget.style.background="#E8E8ED";}} onMouseLeave={e=>{e.currentTarget.style.background="#F5F5F7";}}>
                <div style={{fontFamily:F,fontSize:13,fontWeight:600,color:"#1D1D1F"}}>{tp.name}</div>
                <div style={{fontFamily:F,fontSize:11,color:"#86868B",marginTop:3}}>{tp.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Prompt Template */}
        <div style={{background:"#FFF",borderRadius:16,padding:20,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontFamily:F,fontSize:14,fontWeight:700,color:"#1D1D1F"}}>프롬프트 템플릿</div>
            <button onClick={()=>uAi("promptTemplate",DEF_AI_CONFIG.promptTemplate)} style={abtn("#F5F5F7","#86868B",{fontSize:11,padding:"5px 10px"})}>기본값</button>
          </div>
          <div style={{fontFamily:F,fontSize:11,color:"#86868B",marginBottom:10,lineHeight:1.5}}>
            사용 가능한 변수: <code style={{background:"#F0F0F5",padding:"1px 6px",borderRadius:4,fontSize:11}}>{"{charName}"}</code> = 캐릭터 이름, <code style={{background:"#F0F0F5",padding:"1px 6px",borderRadius:4,fontSize:11}}>{"{context}"}</code> = 고객 답변 데이터
          </div>
          <textarea value={ai.promptTemplate} onChange={e=>uAi("promptTemplate",e.target.value)} style={{...ainp(),height:140,resize:"vertical",fontFamily:"'SF Mono',Menlo,monospace",fontSize:13,lineHeight:1.6}}/>
        </div>

        {/* Test */}
        <div style={{background:"#FFF",borderRadius:16,padding:20,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div style={{fontFamily:F,fontSize:14,fontWeight:700,color:"#1D1D1F"}}>테스트 실행</div>
            <button onClick={testAI} disabled={testLoading} style={abtn(testLoading?"#D1D1D6":"#007AFF","#FFF",{fontSize:12})}>{testLoading?"생성 중...":"테스트 호출"}</button>
          </div>
          <div style={{fontFamily:F,fontSize:11,color:"#86868B",marginBottom:10}}>샘플 데이터(개인사업자, 장기렌트 추천)로 실제 API를 호출합니다</div>
          {testResult&&<div style={{background:"linear-gradient(135deg,#1D1D1F,#2C2C2E)",borderRadius:12,padding:16}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}><span style={{fontSize:16}}>{ai.charEmoji}</span><span style={{fontFamily:F,fontSize:13,fontWeight:600,color:"#FFF"}}>{ai.charName}</span></div>
            <div style={{fontFamily:F,fontSize:14,color:"rgba(255,255,255,0.85)",lineHeight:1.7}}>{testResult}</div>
          </div>}
        </div>

        {/* Fallback Messages */}
        <div style={{background:"#FFF",borderRadius:16,padding:20,marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
            <div><div style={{fontFamily:F,fontSize:14,fontWeight:700,color:"#1D1D1F"}}>폴백 메시지</div><div style={{fontFamily:F,fontSize:11,color:"#86868B",marginTop:2}}>API 실패 또는 세션 한도 초과 시 표시됩니다</div></div>
            <button onClick={addFb} style={abtn("#F5F5F7","#007AFF",{fontSize:11,padding:"5px 10px"})}>+ 추가</button>
          </div>
          {ai.fallbacks.map((fb,i)=>(<div key={i} style={{display:"flex",gap:6,marginBottom:8,alignItems:"flex-start"}}>
            <span style={{fontFamily:F,fontSize:12,color:"#AEAEB2",marginTop:12,minWidth:20}}>{i+1}</span>
            <textarea value={fb} onChange={e=>uFb(i,e.target.value)} style={{...ainp({fontSize:13}),height:48,resize:"vertical",flex:1}}/>
            {ai.fallbacks.length>1&&<button onClick={()=>delFb(i)} style={{background:"none",border:"none",color:"#FF3B30",cursor:"pointer",fontSize:14,marginTop:10}}>✕</button>}
          </div>))}
        </div>
      </div>}

      <div style={{marginTop:32,padding:20,background:"#FFF",borderRadius:16}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontFamily:F,fontSize:14,fontWeight:600}}>초기화</div><div style={{fontFamily:F,fontSize:12,color:"#86868B"}}>기본값 복원</div></div>{!cfR?<button onClick={()=>sCfR(true)} style={abtn("#FFF5F5","#FF3B30")}>초기화</button>:<div style={{display:"flex",gap:8}}><button onClick={()=>sCfR(false)} style={abtn("#F5F5F7","#86868B")}>취소</button><button onClick={hReset} style={abtn("#FF3B30","#FFF")}>확인</button></div>}</div></div>
    </main>
  </div>);
}

/* ═══════════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════════ */
export default function App(){
  const[scr,setScr]=useState("home");const[fade,sFade]=useState(false);const[admin,sAdmin]=useState(false);const[ok,sOk]=useState(false);const[optVeh,sOptVeh]=useState(null);
  const[fb,sFb]=useState(DEF_FIN_BASIC);const[fd,sFd]=useState(DEF_FIN_DETAIL);
  const[vb,sVb]=useState(DEF_VEH_BASIC);const[vd,sVd]=useState(DEF_VEH_DETAIL);
  const[pr,sPr]=useState(DEF_PRODUCTS);const[aiCfg,sAiCfg]=useState(DEF_AI_CONFIG);

  useEffect(()=>{(async()=>{const d=await ld();if(d){if(d.finBasic)sFb(d.finBasic);if(d.finDetail)sFd(d.finDetail);if(d.vehBasic)sVb(d.vehBasic);if(d.vehDetail)sVd(d.vehDetail);if(d.products)sPr(d.products);if(d.aiConfig)sAiCfg(d.aiConfig);}sOk(true);})();setTimeout(()=>sFade(true),100);},[]);

  const home=()=>{setScr("home");sOptVeh(null);};
  const goOption=(veh)=>{sOptVeh(veh);setScr("option");};
  const onAdSv=async(d)=>{try{sFb(d.finBasic);sFd(d.finDetail);sVb(d.vehBasic);sVd(d.vehDetail);sPr(d.products);if(d.aiConfig)sAiCfg(d.aiConfig);clearParkCache();await sv(d);return true;}catch(e){return true;}};

  if(admin) return <Admin data={{finBasic:fb,finDetail:fd,vehBasic:vb,vehDetail:vd,products:pr,aiConfig:aiCfg}} onSave={onAdSv} onBack={()=>sAdmin(false)}/>;
  if(!ok) return <div style={{minHeight:"100vh",background:"#F5F5F7",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:F,color:"#86868B"}}>불러오는 중...</div>;

  const svcs=[{id:"finance",icon:"📊",title:"금융상품 진단",desc:"간편·상세 테스트로 최적 상품 찾기",color:"#007AFF",time:"1~3분"},{id:"vehicle",icon:"🚗",title:"차종 추천",desc:"간편·상세 테스트로 최적 차종 추천",color:"#5856D6",time:"1~3분"},{id:"calc",icon:"🧮",title:"월 비용 계산기",desc:"차종별 금융상품 월 납입금 비교",color:"#FF9500",time:"바로"},{id:"consult",icon:"💬",title:"무료 상담",desc:"전문 상담사의 맞춤 견적",color:"#34C759",time:"24h"}];

  return(<div style={{minHeight:"100vh",background:"#F5F5F7",fontFamily:F}}>
    <nav style={{padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(245,245,247,0.72)",backdropFilter:"blur(20px)",borderBottom:"0.5px solid rgba(0,0,0,0.08)",position:"sticky",top:0,zIndex:100}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>{scr!=="home"&&<button onClick={home} style={{background:"none",border:"none",color:"#007AFF",fontSize:15,cursor:"pointer",fontFamily:F,marginRight:8}}>←</button>}<span style={{fontSize:20}}>🚘</span><span style={{fontSize:16,fontWeight:600,color:"#1D1D1F"}}>카담 Auto Finance</span></div>
      <button onClick={()=>sAdmin(true)} style={{background:"none",border:"none",color:"#AEAEB2",fontSize:18,cursor:"pointer"}}>⚙</button>
    </nav>
    <main style={{padding:"24px 20px 60px",maxWidth:600,margin:"0 auto"}}>
      {scr==="home"&&<><div style={{textAlign:"center",paddingTop:"clamp(32px,6vh,60px)",paddingBottom:40,opacity:fade?1:0,transform:fade?"translateY(0)":"translateY(20px)",transition:"all 0.7s ease"}}><div style={{fontSize:56,marginBottom:20}}>🚘</div><h1 style={{fontFamily:FD,fontSize:"clamp(28px,5.5vw,42px)",fontWeight:700,color:"#1D1D1F",lineHeight:1.2,letterSpacing:"-0.04em",marginBottom:12}}>자동차, 뭘 어떻게<br/>이용해야 할까?</h1><p style={{fontFamily:F,fontSize:16,color:"#86868B",lineHeight:1.6,maxWidth:360,margin:"0 auto"}}>차종 선택부터 금융상품 비교까지<br/>1분 진단으로 최적의 답을 찾아드립니다.</p></div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>{svcs.map((s,i)=><button key={s.id} onClick={()=>setScr(s.id)} style={{background:"#FFF",border:"none",borderRadius:20,padding:"24px 22px",cursor:"pointer",textAlign:"left",transition:"all 0.25s ease",boxShadow:"0 2px 16px rgba(0,0,0,0.04)",opacity:fade?1:0,transform:fade?"translateY(0)":"translateY(20px)",transitionDelay:`${0.1+i*0.08}s`}} onMouseEnter={e=>{e.currentTarget.style.transform="scale(1.015)";}} onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";}}>
          <div style={{display:"flex",alignItems:"center",gap:16}}><div style={{width:52,height:52,borderRadius:16,background:`${s.color}12`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{s.icon}</div><div style={{flex:1}}><div style={{fontFamily:FD,fontSize:18,fontWeight:700,color:"#1D1D1F"}}>{s.title}</div><div style={{fontFamily:F,fontSize:13,color:"#86868B",marginTop:3}}>{s.desc}</div></div><div style={{flexShrink:0}}><span style={{fontFamily:F,fontSize:11,color:"#AEAEB2"}}>{s.time}</span></div></div>
        </button>)}</div>
        <div style={{display:"flex",justifyContent:"center",gap:24,marginTop:36}}>{[["🔒","개인정보 미수집"],["⚡","1분 소요"],["🎯","AI 맞춤 추천"]].map(([ic,lb])=><div key={lb} style={{textAlign:"center"}}><div style={{fontSize:20,marginBottom:4}}>{ic}</div><div style={{fontFamily:F,fontSize:11,color:"#AEAEB2"}}>{lb}</div></div>)}</div>
      </>}
      {scr==="finance"&&<QuizModule basicQs={fb} detailQs={fd} color="#007AFF" onHome={home} renderResult={p=><FinResult {...p} products={pr} aiCfg={aiCfg}/>}/>}
      {scr==="vehicle"&&<QuizModule basicQs={vb} detailQs={vd} color="#5856D6" onHome={home} renderResult={p=><VehResult {...p} products={pr} onOption={goOption} aiCfg={aiCfg}/>}/>}
      {scr==="option"&&optVeh&&<OptionQuiz vehicle={optVeh} products={pr} onHome={home} onBack={()=>setScr("vehicle")} aiCfg={aiCfg}/>}
      {scr==="calc"&&<Calc products={pr} onHome={home}/>}
      {scr==="consult"&&<div style={{paddingTop:40,maxWidth:480,margin:"0 auto"}}><div style={{textAlign:"center",marginBottom:32}}><div style={{fontSize:48,marginBottom:16}}>💬</div><h2 style={{fontFamily:FD,fontSize:28,fontWeight:700,marginBottom:8}}>무료 상담 신청</h2><p style={{fontFamily:F,fontSize:15,color:"#86868B",lineHeight:1.6}}>전문 상담사가 최적 조건을 찾아드립니다.</p></div><ConsultCTA/></div>}
    </main>
  </div>);
}
