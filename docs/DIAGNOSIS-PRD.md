# 카담(CADAM) 자동차 진단 모듈 — 통합 PRD v1.0

## 1. 개요

기존 카담(CADAM) 장기렌터카 랜딩페이지에 **자동차 금융상품 진단 + 차종 추천 + 옵션 추천 + 월 비용 계산기** 모듈을 추가한다. 기존 `/quote` 견적 플로우는 그대로 유지하고, `/diagnosis` 경로 아래에 새 기능을 배치한다.

### 기존 카담과의 관계
- 기존: `/quote` = 6스텝 장기렌트 견적 플로우 (차종→기간→주행거리→납입→연락처)
- 신규: `/diagnosis` = 설문 기반 진단 (금융상품/차종/옵션 추천)
- 상호 연결: 진단 결과에서 "견적 받기" → `/quote`로 연결, `/cars/[slug]` 차종 상세와 양방향 링크

---

## 2. 기존 스택 (수정 불가)

| 항목 | 현재 |
|------|------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 (`@theme inline` in globals.css) |
| State | Zustand + persist middleware |
| Animation | Framer Motion |
| DB | Supabase (PostgreSQL + RLS) |
| Rate Limit | Upstash Redis |
| Font | Pretendard Variable |
| Hosting | Vercel (cadam-beta.vercel.app) |
| Analytics | Google Analytics 4 |

### 기존 디자인 시스템 (준수)
```css
--color-primary: #1B3A5C
--color-accent: #2E86C1
--color-success: #27AE60
--color-warning: #F39C12
--color-danger: #E74C3C
--color-kakao: #FEE500
```

### 진단 모듈 추가 색상 (globals.css @theme inline에 추가)
```css
--color-finance: #007AFF
--color-vehicle: #5856D6
--color-option: #E04DBF
--color-calculator: #FF9500
--color-rent: #34C759
```

---

## 3. 라우트 구조

```
기존 (수정 없음)
├── /                        메인 랜딩
├── /quote                   6스텝 견적 플로우
├── /popular-estimates       인기차종 견적
├── /info                    정보
├── /promotions              프로모션
├── /cars/[slug]             차종 상세 (45종)
├── /privacy                 개인정보
└── /admin                   관리자 대시보드

신규 추가
├── /diagnosis               진단 허브 (4개 서비스 카드)
│   ├── /diagnosis/finance   금융상품 진단
│   ├── /diagnosis/vehicle   차종 추천
│   │   └── /diagnosis/vehicle/option  옵션 추천
│   └── /diagnosis/calculator 월 비용 계산기
├── /api/ai-comment          박대표 AI (서버사이드)
└── /admin
    └── (기존 빠른 메뉴에 "진단 관리" 추가)
```

### 메인 페이지 연결
기존 메인 페이지의 4개 서비스 카드 아래 또는 사이에 "내게 맞는 상품 진단" 카드를 추가하여 `/diagnosis`로 연결.

---

## 4. 핵심 엔진: QuizModule

금융 진단과 차종 추천이 공유하는 범용 설문 엔진.

### 데이터 구조 (src/types/diagnosis.ts)

금융 질문: `scores` 기반 (상품별 0~5점)
차종 질문: `tags` 기반 (차급 태그 매칭)
옵션 질문: `tags` 기반 (트림 태그 매칭)

모든 질문에 `skipIf` (조건부 스킵)과 `nextQ` (조건 분기) 지원.

### 플로우 엔진 (src/lib/flow-engine.ts)

```typescript
shouldSkip(question, answers): boolean
findNextIndex(questions, currentIdx, selectedOption, answers): number
```
- 분기는 앞으로만 (무한루프 방지)
- 뒤로가기는 history 스택으로 정확한 경로 역추적

---

## 5. 금융상품 진단

### 모드 선택
- 간편 테스트 (7문항): business→ownership→cycle→budget→maintenance→mileage→payment
- 상세 테스트 (14문항): 간편 + price_range→credit→purpose→depreciation→insurance→tax→cancel

### 스킵/분기 규칙
| 조건 | 동작 |
|------|------|
| ownership="반드시 소유" | cycle 스킵 + budget으로 점프 |
| budget="목돈 부담" | maintenance 스킵 + payment으로 점프 |
| business="개인" | tax 스킵 (상세) |
| credit="관리 필요" | insurance로 점프 (상세) |
| purpose="영업/법인" | tax로 점프 (상세) |
| ownership="반드시 소유" | depreciation 스킵 (상세) |

### 결과
- 4개 상품(할부/리스/렌트/현금) 점수 비교 + ScoreRing
- 1위 상품 상세 카드 (장점/유의사항)
- 박대표 AI 코멘트
- "이 상품으로 견적 받기" → `/quote` 연결
- 공유(링크복사/카카오톡) + 상담 CTA

---

## 6. 차종 추천

### 모드 선택
- 간편 (5문항): v_purpose→v_budget→v_people→v_priority→v_fuel
- 상세 (11문항): 간편 + v_parking→v_brand→v_drive→v_tech→v_resale→v_range

### 결과
- TOP4 차종 (기존 VEHICLE_LIST 45종에서 매칭)
- 각 차종에 `/cars/[slug]` 링크 + "견적 받기" → `/quote` 연결
- 옵션 추천 CTA → `/diagnosis/vehicle/option`

### 차량 데이터 연동
이번 모듈의 차량 DB는 기존 `src/constants/vehicles.ts`의 VEHICLE_LIST를 확장하여 사용.
기존 Vehicle 타입에 `quizTags`, `monthlyEstimate` 필드를 추가.

---

## 7. 옵션 추천

차종 결과에서 선택한 차종의 트림 데이터로 5문항 설문 진행.
결과: 추천 트림 + 포함 사양 + 전체 트림 비교 + 월 비용.

---

## 8. 월 비용 계산기

차종 선택 + 기간(24~72개월 슬라이더) + 선수금(0~50% 슬라이더) → 할부/리스/렌트/현금 4상품 월 비용 비교.

가격 데이터: 기존 Supabase price_ranges 테이블 활용 가능. 없는 경우 추정 계산 (기본 금리 기반).

---

## 9. 박대표 AI

### 서버사이드 API Route (/api/ai-comment)
```typescript
// POST /api/ai-comment
Request: { context: string, config: AIConfig }
Response: { comment: string }
```
- ANTHROPIC_API_KEY 환경변수로 서버에만 보관
- Upstash Redis로 IP 기반 rate limiting (분당 10회)

### 설정 (Supabase diagnosis_config 테이블에 저장)
캐릭터명, 이모지, 모델, 프롬프트 템플릿, 톤 프리셋, 폴백 메시지, 세션 한도 등 관리 페이지에서 편집 가능.

---

## 10. 관리 페이지 확장

기존 `/admin` 대시보드의 빠른 메뉴에 추가:
```
📊 진단 관리 → /admin/diagnosis
```

### /admin/diagnosis 탭 구조 (6탭)
1. 금융 간편 질문 — 질문CRUD + 가중치(0~5) + 스킵/분기
2. 금융 상세 질문
3. 차종 간편 질문 — 질문CRUD + 태그 토글 + 스킵/분기
4. 차종 상세 질문
5. 상품 정보 — 이름/태그라인/설명/장점/유의사항
6. AI 캐릭터 — 이름/이모지/모델/프롬프트/톤/폴백/테스트

---

## 11. DB 추가 테이블

```sql
-- 진단 설정 (질문/상품/AI 설정 JSON 저장)
CREATE TABLE diagnosis_config (
  id varchar(50) PRIMARY KEY,  -- 'finance_basic', 'vehicle_detail', 'products', 'ai_config' 등
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- 진단 결과 로그 (통계용)
CREATE TABLE diagnosis_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type varchar(20) NOT NULL,           -- 'finance', 'vehicle', 'option'
  mode varchar(10),                     -- 'quick', 'detail'
  answers jsonb,
  result jsonb,                         -- 추천 상품/차종/트림
  ip_hash varchar(64),
  created_at timestamptz DEFAULT now()
);
```

---

## 12. 파일 배치

```
src/
├── app/
│   ├── diagnosis/
│   │   ├── page.tsx                  진단 허브
│   │   ├── finance/page.tsx          금융상품 진단
│   │   ├── vehicle/page.tsx          차종 추천
│   │   ├── vehicle/option/page.tsx   옵션 추천
│   │   └── calculator/page.tsx       계산기
│   ├── api/ai-comment/route.ts       박대표 AI
│   └── admin/diagnosis/page.tsx      진단 관리
├── components/
│   └── diagnosis/
│       ├── QuizModule.tsx            범용 설문 엔진
│       ├── ModeSelect.tsx            간편/상세 선택
│       ├── QuestionCard.tsx          질문 카드
│       ├── FinanceResult.tsx
│       ├── VehicleResult.tsx
│       ├── OptionResult.tsx
│       ├── CostCalculator.tsx
│       ├── ParkAI.tsx                AI 코멘트 카드
│       ├── ConsultCTA.tsx
│       ├── ShareButtons.tsx
│       └── ScoreRing.tsx
├── data/
│   ├── diagnosis-finance.ts          금융 질문 데이터
│   ├── diagnosis-vehicle.ts          차종 질문 데이터
│   ├── diagnosis-option.ts           옵션 질문 데이터
│   ├── diagnosis-products.ts         금융상품 정보
│   ├── diagnosis-trims.ts            트림 데이터
│   └── diagnosis-ai.ts              AI 설정 기본값
├── types/
│   └── diagnosis.ts                  진단 모듈 타입 (기존 index.ts와 별도)
├── lib/
│   └── flow-engine.ts               스킵/분기 엔진
└── store/
    └── diagnosisStore.ts             진단 상태 (Zustand)
```

---

## 13. 구현 순서

| 순서 | 작업 | 의존성 |
|------|------|--------|
| 1 | types/diagnosis.ts + lib/flow-engine.ts | 없음 |
| 2 | data/ 전체 6개 파일 | types |
| 3 | globals.css 색상 추가 | 없음 |
| 4 | components/diagnosis/QuizModule.tsx | types + lib |
| 5 | /diagnosis 허브 페이지 | components |
| 6 | /diagnosis/finance | QuizModule + data |
| 7 | /diagnosis/vehicle + option | QuizModule + data |
| 8 | /diagnosis/calculator | data |
| 9 | /api/ai-comment | Anthropic API |
| 10 | ParkAI.tsx 연동 | API route |
| 11 | /admin/diagnosis | Supabase |
| 12 | 메인 페이지에 진단 CTA 추가 | 라우팅 |
| 13 | Supabase 마이그레이션 | SQL |
