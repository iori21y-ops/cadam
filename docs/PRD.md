# Product Requirements Document (PRD): 카담 — 장기렌터카 랜딩페이지 MVP

> **Version:** 3.5 (Cursor AI 바이브코딩용 최종 마스터본)
> **Last Updated:** 2026-03-12
> **Status:** Development Ready
> **Rule:** AI는 본 문서에 명시되지 않은 임의의 폴더 생성이나 개발 일정(Phase) 추론을 절대 금지하며, 오직 명시된 기술 스택과 구조에 맞춰 코드를 생성할 것.

### 변경 이력
**v3.4 → v3.5:**
1. **Tailwind CSS v4** 방식 확정: `tailwind.config.ts` 불필요. `globals.css`의 `@theme inline` 블록에서 색상/폰트 변수 선언
2. **라우팅 구조 변경**: `/` = 랜딩 페이지, `/quote` = 견적 스텝 플로우 (기존 `/`에서 분리)
3. **`/promotions`** 전용 페이지 추가 (기존 `/info` 내 프로모션 섹션과 별도)
4. **`info_articles` 테이블** 추가 (장기렌터카 정보 아티클 — URL + 노출 토글)
5. **`/api/info-articles`** API 추가
6. **`/api/admin/revalidate`**, **`/api/admin/dashboard`**, **`/api/admin/callbacks`** Admin 전용 API 추가 (Supabase Auth 인증 기반)
7. **`/admin/info`** 정보관리 페이지 추가 (Admin 메뉴)
8. **`/info` 페이지** InfoArticles 섹션 추가
9. **File Structure** 실제 구현 기준으로 전면 업데이트:
   - `lib/supabase.ts` → `supabase-client.ts` + `supabase-server.ts` 분리
   - `lib/phoneUtils.ts` 독립 파일 (`utils.ts`에서 분리)
   - `store/toastStore.ts`, `hooks/useToast.ts` 추가
   - `components/NavBar.tsx`, `components/GAPageView.tsx`, `components/steps/SelectionSummary.tsx` 추가
   - `components/info/InfoArticles.tsx` 추가

**v3.3 → v3.4:**
1. 브랜드명 확정: **카담(CADAM)** — 도메인 후보: cadam.co.kr
2. 관리자 이메일 확정: iori21y@gmail.com
3. 미결정 사항 정리 (확정/placeholder/외부설정 구분)
4. File Structure에 `.cursorrules`, `docs/`, `scripts/seed.ts` 추가
5. cursor rules에 와이어프레임 참조 지시 추가

**v3.2 → v3.3:**
1. Rate Limit: in-memory Map → Upstash Redis 복원
2. Development Phases 섹션 삭제

**v3.1 → v3.2:**
1. Lead Score 서버사이드 변경, SEO ISR 변경, Middleware HTTP 헤더 수정
2. 차량 45종 전체 명시, Admin 상세 스펙 복원, 개인정보 처리방침 보완

---

## 1. Project Overview

- **Brand:** 카담(CADAM) — "카(Car) + 담다", 차량을 담당하는 전문 서비스
- **Domain:** cadam.co.kr (확정 전 — 가용 여부 확인 필요)
- **Goal:** 장기렌터카 맞춤 상담 DB 확보 (목표 전환율: 5%)
- **Tech Stack:** Next.js 15 (App Router), TypeScript, **Tailwind CSS v4**, Supabase, Vercel, Upstash Redis
- **State Management:** Zustand + persist middleware
- **Rate Limiting:** Upstash Redis (무료 티어: 일 10,000 커맨드. 트래픽 증가 시 유료 전환, 월 $10 이내)
- **Admin Email:** iori21y@gmail.com (알림 수신 + Supabase Auth 로그인)
- **Admin Password:** Supabase Auth Dashboard에서 직접 설정 (보안상 문서 기재 금지)
- **Design System:**
  - Colors: Primary `#1B3A5C`, Accent `#2E86C1`, Background `#FFFFFF`, Success `#27AE60`, Warning `#F39C12`, Danger `#E74C3C`, Kakao `#FEE500`
  - Typography: Pretendard (웹폰트, `font-display: swap` + preload)
  - Layout: Mobile First (min-width: 360px, max-width: 1024px 데스크톱 컨테이너 중앙 정렬)
  - Border Radius: 12px (카드), 8px (버튼, 인풋)
  - Shadow: `0 2px 8px rgba(0,0,0,0.08)` (카드 기본)

> **[v3.5] Tailwind CSS v4 설정 방식:** `tailwind.config.ts` 파일을 생성하지 않는다. 색상·폰트는 `src/app/globals.css`의 `@theme inline` 블록에서 CSS 변수로 선언하며, 이 변수가 Tailwind 유틸리티 클래스로 자동 매핑된다.
> ```css
> @import "tailwindcss";
> @theme inline {
>   --color-primary: #1B3A5C;
>   --color-accent: #2E86C1;
>   --color-success: #27AE60;
>   --color-warning: #F39C12;
>   --color-danger: #E74C3C;
>   --color-kakao: #FEE500;
>   --font-sans: "Pretendard", -apple-system, BlinkMacSystemFont, sans-serif;
> }
> ```

---

## 2. Site Architecture

```
/                        → 랜딩 페이지 (브랜드 소개 + CTA → /quote)
/quote                   → 견적 스텝 플로우 (Step 1~6)
/info                    → 장기렌터카 정보 + 프로모션 + 아티클 페이지
/promotions              → 프로모션 전용 페이지
/result                  → 견적 결과 화면
/cars/[slug]             → SEO 차종별 상세 페이지 (ISR, revalidate=3600)
/admin                   → 관리자 대시보드 (Auth 보호)
/admin/login             → 관리자 로그인
/admin/consultations     → 상담 관리 (CRM)
/admin/promotions        → 프로모션 관리
/admin/prices            → 가격표 관리
/admin/info              → 정보관리 (info_articles URL 등록·노출 토글·삭제)
/privacy                 → 개인정보 처리방침
/api/consultation        → POST: 상담 신청
/api/price-range         → GET: 견적 조회
/api/promotions          → GET: 프로모션 조회
/api/info-articles       → GET: 장기렌터카 정보 아티클 조회
/api/revalidate          → POST: On-demand ISR 재생성 (REVALIDATION_SECRET 검증)
/api/admin/revalidate    → POST: Admin 전용 ISR 재생성 (Supabase Auth 인증)
/api/admin/dashboard     → GET: 대시보드 요약 데이터 (Auth 인증)
/api/admin/callbacks     → GET: 오늘의 콜백 리스트 (Auth 인증)
```

---

## 3. Database & Security (Supabase PostgreSQL)

### 3.1. Tables

**consultations (고객 상담 신청 + CRM)**

| Column | Type | Description |
|:---|:---|:---|
| `id` | uuid, PK, default gen_random_uuid() | 고유 식별자 |
| `name` | varchar(50), NOT NULL | 고객 이름 |
| `phone` | varchar(20), NOT NULL | 연락처 (하이픈 제거 후 숫자만 저장) |
| `car_brand` | varchar(20) | 선택 브랜드 (현대/기아/제네시스) |
| `car_model` | varchar(50) | 선택 차종 |
| `trim` | varchar(50) | 선택 트림 |
| `contract_months` | int | 계약 기간 (36/48/60) |
| `annual_km` | int | 연간 주행거리 (10000/20000/30000/40000) |
| `deposit` | int | 보증금 (원화) |
| `prepayment_pct` | int | 선납금 비율 (%) |
| `monthly_budget` | int, nullable | 월 예산 (원화, Step 1 예산 선택 시) |
| `estimated_min` | int, nullable | 예상 최소 월 납부금 |
| `estimated_max` | int, nullable | 예상 최대 월 납부금 |
| `status` | enum: 'pending','consulting','completed' | 상담 상태 (기본값: 'pending') |
| `assigned_to` | varchar(50), nullable | 배정 상담사 이름 |
| `step_completed` | int, default 0 | 마지막 완료 Step (1~6) |
| `privacy_agreed` | boolean, NOT NULL | 개인정보 수집 동의 여부 |
| `device_type` | varchar(20), nullable | 기기 정보 (Mobile/Desktop) |
| `utm_source` | varchar(100), nullable | 유입 경로 (UTM 파라미터) |
| `referrer` | varchar(200), nullable | 실제 유입 사이트 (HTTP Referer 헤더) |
| `inflow_page` | varchar(50), nullable | 유입 페이지 경로 |
| `lead_score` | int, default 0 | **[서버사이드 계산]** 리드 품질 점수 (0~100) |
| `ip_hash` | varchar(64), nullable | 중복 방지용 IP SHA-256 해시 |
| `memo` | text, nullable | [CRM] 상담사 메모 |
| `callback_time` | timestamptz, nullable | [CRM] 재연락 예약 시간 |
| `consult_result` | varchar(20), nullable | [CRM] 상담 결과: 'contracted'/'competitor'/'hold'/'no_answer'/'cancelled' |
| `kakao_sent` | boolean, default false | [Phase 2 전용] 알림톡 발송 여부 (MVP 로직 작성 금지) |
| `created_at` | timestamptz, default now() | 신청 일시 |
| `updated_at` | timestamptz, default now() | 최종 수정 일시 |

> `consult_result`는 Supabase enum 대신 varchar(20)로 구현한다. 이유: enum은 값 추가 시 마이그레이션 필요. 프론트엔드에서 허용 값 목록을 상수로 관리하여 검증한다.

**consult_result 허용 값:**

| 값 | 의미 | Admin 표시 |
|:---|:---|:---|
| `null` | 미정 (상담 결과 없음) | — |
| `contracted` | 계약 완료 | 🟢 계약완료 |
| `competitor` | 타사 계약 | 🔴 타사계약 |
| `hold` | 보류 (고민 중) | 🟡 보류 |
| `no_answer` | 부재 (연락 불가) | ⚫ 부재 |
| `cancelled` | 상담 취소 | ⚪ 취소 |

**price_ranges (차종별 렌트료 범위)**

| Column | Type | Description |
|:---|:---|:---|
| `id` | uuid, PK | 고유 식별자 |
| `car_brand` | varchar(20), NOT NULL | 브랜드 |
| `car_model` | varchar(50), NOT NULL | 차종 |
| `contract_months` | int, NOT NULL | 계약 기간 |
| `annual_km` | int, NOT NULL | 연간 주행거리 |
| `min_monthly` | int, NOT NULL | 최소 월 납부금 (원화) |
| `max_monthly` | int, NOT NULL | 최대 월 납부금 (원화) |
| `conditions` | jsonb | **[핵심]** 보증금/선납금별 하드코딩 원화 금액. 프론트엔드에서 수학적 계산 절대 금지, JSON 파싱만 허용. |
| `is_active` | boolean, default true | 활성 여부 |
| `updated_at` | timestamptz | 최종 수정일 |

**promotions (프로모션 배너)**

| Column | Type | Description |
|:---|:---|:---|
| `id` | uuid, PK | 고유 식별자 |
| `title` | varchar(100), NOT NULL | 프로모션 제목 |
| `description` | text | 프로모션 설명 |
| `image_url` | varchar(500) | 배너 이미지 URL |
| `link_url` | varchar(500) | 클릭 시 이동 URL |
| `is_active` | boolean, default true | 노출 여부 |
| `display_order` | int, default 0 | 정렬 순서 |
| `start_date` | date | 시작일 |
| `end_date` | date | 종료일 |

**info_articles (장기렌터카 정보 아티클)**

> 외부 블로그·뉴스 기사 URL을 등록하여 `/info` 페이지에 카드 형태로 노출. 관리자가 `/admin/info`에서 등록·토글·삭제.

| Column | Type | Description |
|:---|:---|:---|
| `id` | uuid, PK, default gen_random_uuid() | 고유 식별자 |
| `title` | varchar(200), NOT NULL | 아티클 제목 |
| `url` | varchar(500), NOT NULL | 외부 링크 URL |
| `description` | text, nullable | 한 줄 설명 |
| `thumbnail_url` | varchar(500), nullable | 썸네일 이미지 URL |
| `is_active` | boolean, default true | 노출 여부 |
| `display_order` | int, default 0 | 정렬 순서 |
| `created_at` | timestamptz, default now() | 등록일시 |

**RLS (info_articles):**
| 역할 | 권한 |
|:---|:---|
| anon (비인증) | SELECT만 허용 (is_active=true) |
| authenticated (관리자) | SELECT, INSERT, UPDATE, DELETE 허용 |

**인덱스:**
```sql
CREATE INDEX idx_info_articles_active ON info_articles(is_active, display_order);
```

---

**notification_log (알림 발송 이력)**

| Column | Type | Description |
|:---|:---|:---|
| `id` | uuid, PK | 고유 식별자 |
| `consultation_id` | uuid, FK → consultations.id | 관련 상담 |
| `channel` | varchar(20) | 발송 채널: 'email' / 'kakao' / 'sms' |
| `status` | varchar(20) | 발송 결과: 'sent' / 'failed' / 'pending' |
| `sent_at` | timestamptz | 발송 시각 |
| `error_message` | text, nullable | 실패 시 에러 메시지 |

### 3.2. Row Level Security (RLS)

| 테이블 | anon (비인증) | authenticated (관리자) |
|:---|:---|:---|
| consultations | INSERT만 허용 | SELECT, UPDATE 허용 |
| price_ranges | SELECT만 허용 (is_active=true) | SELECT, INSERT, UPDATE, DELETE 허용 |
| promotions | SELECT만 허용 (is_active=true) | SELECT, INSERT, UPDATE, DELETE 허용 |
| info_articles | SELECT만 허용 (is_active=true) | SELECT, INSERT, UPDATE, DELETE 허용 |
| notification_log | 접근 불가 | SELECT, INSERT, UPDATE 허용 |

### 3.3. Indexes

```sql
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_created ON consultations(created_at DESC);
CREATE INDEX idx_consultations_lead_score ON consultations(lead_score DESC);
CREATE INDEX idx_consultations_callback ON consultations(callback_time) WHERE callback_time IS NOT NULL;
CREATE INDEX idx_consultations_ip_hash ON consultations(ip_hash);
CREATE INDEX idx_price_ranges_lookup ON price_ranges(car_brand, car_model, contract_months, annual_km);
CREATE INDEX idx_promotions_active ON promotions(is_active, display_order);
CREATE INDEX idx_notification_log_consult ON notification_log(consultation_id);
```

### 3.4. Lead Score 계산 로직 [서버사이드]

> **[v3.2 변경]** `src/lib/leadScore.ts`에서 정의하되, API Route(`/api/consultation`)의 서버사이드에서만 호출할 것. 프론트엔드에서 직접 호출 금지. 이유: 클라이언트 조작 방지.

```typescript
// src/lib/leadScore.ts
// 이 함수는 반드시 서버사이드(API Route)에서만 호출할 것.

interface LeadScoreInput {
  stepCompleted: number;
  carModel: string | null;
  contractMonths: number | null;
  deposit: number | null;
  monthlyBudget: number | null;
  inflowPage: string | null;
}

export function calculateLeadScore(input: LeadScoreInput): number {
  let score = 0;
  if (input.stepCompleted >= 6) score += 40;
  else if (input.stepCompleted >= 4) score += 20;
  else if (input.stepCompleted >= 2) score += 10;
  if (input.carModel) score += 15;
  if (input.contractMonths) score += 10;
  if (input.deposit && input.deposit > 0) score += 10;
  if (input.monthlyBudget && input.monthlyBudget >= 500000) score += 10;
  if (input.inflowPage?.startsWith('/cars/')) score += 5;
  return Math.min(score, 100);
}
```

**점수 해석 (Admin 표시):**

| 점수 | 등급 | 배경색 (Tailwind) |
|:---|:---|:---|
| 80~100 | 🔴 HOT | `bg-red-50 border-l-4 border-red-500` |
| 50~79 | 🟠 WARM | `bg-orange-50` |
| 20~49 | 🟡 COOL | `bg-yellow-50` |
| 0~19 | ⚪ COLD | `bg-gray-50` |

---

## 4. Vehicle Data (프론트엔드 상수) — 전체 45종

> 파일 위치: `src/constants/vehicles.ts`

```typescript
export type Category = '세단' | 'SUV' | 'EV' | '다목적' | '트럭';
export type Brand = '현대' | '기아' | '제네시스';

export interface Vehicle {
  id: string;
  brand: Brand;
  model: string;
  slug: string;
  category: Category;
  segment: string;
  fuel: string;
  imageKey: string;       // public/cars/{imageKey}.webp
  trims: string[];
  seoTitle: string;
  seoDescription: string;
}

export const VEHICLE_LIST: Vehicle[] = [
  // ═══════════════════════════════════
  // 현대 (19종)
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

  // ═══════════════════════════════════
  // 기아 (19종)
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
];

// 유틸리티 함수
export const getVehicleBySlug = (slug: string) => VEHICLE_LIST.find(v => v.slug === slug);
export const getVehiclesByBrand = (brand: Brand) => VEHICLE_LIST.filter(v => v.brand === brand);
export const getVehiclesByCategory = (category: Category) => VEHICLE_LIST.filter(v => v.category === category);
export const getAllSlugs = () => VEHICLE_LIST.map(v => v.slug);
```

---

## 5. Frontend: 메인 랜딩 페이지 (`/`) + 견적 스텝 플로우 (`/quote`)

> **[v3.5 변경]** 기존 `/`에 있던 Step 플로우가 `/quote`로 분리됨. `/`는 브랜드 랜딩 페이지로, 주요 CTA는 `/quote`로 연결.

### 5.1. State Management
- `src/store/quoteStore.ts` (Zustand + `persist` 미들웨어) — `/quote` Step 플로우 상태
- `src/store/toastStore.ts` (Zustand) — Toast 알림 전역 상태 (`src/hooks/useToast.ts`로 접근)
- `src/hooks/useHydrated.ts` — SSR Hydration mismatch 방지

### 5.2. Step Flow 상세

**공통 레이아웃:**
- 100vh 풀스크린, 배경 `#FFFFFF`
- 상단: ProgressBar (현재 Step / 6, Accent 색상)
- 중앙: 질문 + 선택지
- 하단: 이전/다음 버튼 (고정)
- 전환: Framer Motion slide 좌↔우

**Step 1: 선택 분기**
- "당신에게 더 중요한 선택은 무엇인가요?"
- 🚗 "차종 먼저 선택할게요" → `selectionPath: 'car'`
- 💰 "월 예산 먼저 정할게요" → `selectionPath: 'budget'`

**Step 2A: 차종 선택** (`path === 'car'`)
- 1차 탭: `현대` | `기아` | `제네시스`
- 2차 서브 필터: `세단` | `SUV` | `EV` (탭 하위 필터 칩)
- 차종 카드 그리드 (2열) — 차종명 + 세그먼트 태그
- **트림 선택:** 차종 카드 탭 시 해당 차종의 트림 목록이 바텀시트(모바일) 또는 인라인(데스크톱)으로 슬라이드 오픈. 트림 선택 완료 시 → Step 3 이동.

**Step 2B: 예산 선택** (`path === 'budget'`)
- 카드 5개: 30만원 이하 / 30~50만원 / 50~70만원 / 70~100만원 / 100만원 이상

**Step 3: 계약 기간**
- 36개월 / 48개월(`인기` 뱃지) / 60개월

**Step 4: 주행거리**
- 연 1만km "주말 위주" / 2만km "출퇴근 기본"(`인기`) / 3만km "업무 겸용" / 4만km+ "장거리"

**Step 5: 보증금 + 선납금** (같은 화면 내 스크롤)
- 보증금: 0원 / 100만원 / 200만원 / 300만원+
- 선납금: 0% / 10% / 20% / 30%

**Step 6: 연락처 + 개인정보 동의**
- 이름 입력 (필수)
- 연락처 입력: `<input type="tel">`, onChange에서 `010-XXXX-XXXX` Auto-formatting. 제출 시 하이픈 제거.
- 정규식: `^01([016789])-?(\d{3,4})-?(\d{4})$`
- 개인정보 동의 체크박스 (필수) + "[전문보기]" → `/privacy` 새 탭
- 제출 버튼: "무료 견적 받기" (비활성 조건: 미입력 or 정규식 불일치 or 미동의)
- 로딩: 버튼 내 스피너 + "견적 요청 중..."

### 5.3. 견적 결과 화면 (`/result`)
- `selectionPath === 'budget'` → API 조회 생략, "고객님 예산에 맞는 최적의 차량을 찾고 있습니다" 고정 렌더링
- `selectionPath === 'car'` → `price_ranges` 매칭 데이터 표시. 매칭 실패 시: "상담사가 정확한 견적을 안내해 드립니다"
- CTA: "카카오톡으로 상담하기" (노란색) + "전화 상담 요청" (아웃라인)
- "다른 차량도 견적 받아보기" → 스토어 리셋 후 `/`

### 5.4. 이탈 방지 시스템
- `src/components/LeaveModal.tsx` + `src/hooks/useLeaveIntent.ts`
- Desktop: 마우스 Y ≤ 0
- Mobile: `popstate` 이벤트
- 조건: Step 2 이상, 세션당 1회
- "이어서 견적 받기" (Primary) + "나중에 할게요" (텍스트 링크)

### 5.5. 에러 처리 & Toast

> 파일: `src/components/Toast.tsx` + `src/store/toastStore.ts`
> 훅: `src/hooks/useToast.ts` (`toastStore`를 래핑한 편의 훅)
> 위치: 화면 하단 중앙 (모바일 safe-area 고려, bottom: 80px)
> 애니메이션: 하단에서 슬라이드업 → 3초 유지 → 페이드아웃
> 색상: 에러(Danger 배경 흰 텍스트), 성공(Success 배경 흰 텍스트)

| 상황 | Toast 내용 |
|:---|:---|
| API 호출 중 | 버튼 스피너 + "요청 중..." (Toast 아님) |
| 네트워크 에러 | "네트워크 오류가 발생했습니다. 다시 시도해 주세요." (빨간) |
| 429 Rate Limit | "과도한 요청입니다. 1분 후 다시 시도해 주세요." (빨간) |
| 폼 유효성 실패 | 해당 필드 하단 인라인 빨간 텍스트 (Toast 아님) |
| 중복 IP 경고 | "이미 접수된 신청이 있습니다. 상담사가 곧 연락드립니다." (노란) |
| 신청 성공 | `/result` 페이지로 리다이렉트 (Toast 불필요) |

---

## 6. SEO 차종별 상세 페이지 (`/cars/[slug]`)

### 6.1. ISR + On-demand Revalidation [v3.2 변경]

> **[v3.2 핵심 변경]** SSR(`force-dynamic`)을 사용하면 방문자마다 DB 쿼리가 발생하여 Supabase 무료 티어 한도를 초과할 수 있음. 대신 ISR(revalidate=3600, 1시간)을 사용하고, 관리자가 가격을 수정할 때 On-demand Revalidation API를 호출하여 즉시 갱신.

```typescript
// src/app/cars/[slug]/page.tsx

import { VEHICLE_LIST, getVehicleBySlug } from '@/constants/vehicles';

// ISR: 1시간마다 자동 재생성 + On-demand로 즉시 갱신 가능
export const revalidate = 3600;

export async function generateStaticParams() {
  return VEHICLE_LIST.map(v => ({ slug: v.slug }));
}

// [v3.4 수정] Next.js 15에서는 params가 Promise로 변경됨. 반드시 await 처리할 것.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);
  return {
    title: vehicle?.seoTitle,
    description: vehicle?.seoDescription,
    openGraph: { title: vehicle?.seoTitle, images: [`/cars/${vehicle?.imageKey}.webp`] },
  };
}

// 페이지 컴포넌트에서도 동일하게 await 처리 필수
export default async function CarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);
  // ... Supabase에서 price_ranges 조회 후 렌더링
}
```

```typescript
// src/app/api/revalidate/route.ts
// Admin에서 가격 수정 시 호출하여 해당 차종 페이지 즉시 재생성

import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { slug, secret } = await req.json();
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  revalidatePath(`/cars/${slug}`);
  return NextResponse.json({ revalidated: true });
}
```

### 6.2. 페이지 구성

**① SEO Head**
- `<title>`, `<meta description>`, `og:title`, `og:image`, `<link rel="canonical">`
- JSON-LD Product 스키마 (구글 리치 결과용)

**② Hero 섹션**
- 차량 이미지: `<Image src="/cars/{imageKey}.webp" />` (placeholder 대체 가능)
- 차종명 + 세그먼트/연료 태그
- "월 XX만원부터~" (price_ranges 최저가 조회, 데이터 없으면 "상담 문의")
- "무료 견적 받기" CTA → `/` (해당 차종 pre-select)

**③ 계약 조건별 가격 비교표**
- Supabase에서 해당 차종의 price_ranges 전체 조회
- 테이블: 계약기간(행) × 주행거리(열) → 월 납부금 범위
- 데이터 없는 셀: "상담 문의"

**④ 장기렌트 장점** (공통 콘텐츠, 하드코딩)

**⑤ CTA 섹션** — 견적 받기 + 카카오톡 + 전화

**⑥ 관련 차종 추천**
- `VEHICLE_LIST.filter(v => v.category === current.category && v.id !== current.id).slice(0, 4)`
- DB 쿼리 없이 프론트엔드 상수에서 필터

---

## 7. Frontend: Page 2 — 정보/프로모션 (`/info`)

**① Hero 배너:** 그라디언트 배경(`#1B3A5C` → `#2E86C1`), 60~70vh, CTA → `/quote`
**② 장기렌터카 안내:** 구매 vs 렌트 비교 테이블
**③ 이달의 프로모션:** `promotions` 테이블 (is_active=true), 가로 스크롤 카드 → `/promotions`로 더보기 링크
**④ 장기렌터카 정보 아티클 (InfoArticles):** `info_articles` 테이블 (is_active=true), 카드 그리드. 각 카드: 제목 + 한 줄 설명 + 외부 링크(새 탭). 컴포넌트: `src/components/info/InfoArticles.tsx`
**⑤ 인기 차종 견적:** price_ranges 인기 6개 + `/cars/[slug]` 링크
**⑥ 간단 상담 폼:** 이름+연락처+개인정보 동의 (step_completed=0, inflow_page='/info')
**⑦ Footer:** 운영시간, 연락처(tap-to-call, 번호 확정 전 placeholder), 카카오톡 채널(개설 전 placeholder), 개인정보 처리방침 링크, 사업자 정보(등록 전 placeholder), "© 카담(CADAM)" 표기

---

## 7-A. Frontend: 프로모션 전용 페이지 (`/promotions`)

> **[v3.5 신규]** `/info` 내 프로모션 섹션과 별도로 존재하는 독립 페이지.

**① Hero:** 간단한 헤더 타이틀 "이달의 프로모션"
**② 프로모션 전체 목록:** `promotions` 테이블 (is_active=true, display_order 정렬), 카드 그리드 (이미지 + 제목 + 설명 + 링크)
**③ CTA:** "견적 받기" → `/quote`

---

## 8. API, Middleware & Notification

### 8.1. Middleware (`src/middleware.ts`) [v3.2 수정]

> **[수정]** `document.referrer`, `navigator.userAgent`는 브라우저 객체로 서버사이드 Middleware에서 접근 불가. HTTP 요청 헤더를 사용해야 함.

```typescript
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // User-Agent → device_type (HTTP 헤더에서 읽기)
  const ua = request.headers.get('user-agent') || '';
  const isMobile = /Mobile|Android|iPhone/i.test(ua);
  response.cookies.set('device_type', isMobile ? 'Mobile' : 'Desktop', {
    maxAge: 60 * 60 * 24 * 30, // 30일
  });

  // Referer → referrer (HTTP 헤더에서 읽기)
  const referer = request.headers.get('referer') || '';
  if (referer && !response.cookies.get('referrer')) {
    response.cookies.set('referrer', referer, { maxAge: 60 * 60 * 24 * 30 });
  }

  // UTM → utm_source (URL 쿼리 파라미터에서 읽기)
  const utmSource = request.nextUrl.searchParams.get('utm_source');
  if (utmSource) {
    response.cookies.set('utm_source', utmSource, { maxAge: 60 * 60 * 24 * 30 });
  }

  // 유입 페이지 (세션당)
  response.cookies.set('inflow_page', request.nextUrl.pathname, {
    maxAge: 60 * 60 * 24, // 24시간 (세션 근사)
  });

  return response;
}

export const config = {
  matcher: ['/', '/info', '/cars/:path*'],
};
```

### 8.2. Rate Limiting (Upstash Redis) [v3.3 복원]

> **[v3.3 변경]** Vercel은 Serverless 환경으로 함수 호출 시 새 인스턴스가 생성될 수 있어 in-memory Map이 인스턴스 간 공유되지 않음. Upstash Redis를 사용하여 안정적인 Rate Limiting 보장. 무료 티어(일 10,000 커맨드)로 시작, 트래픽 증가 시 유료 전환(월 $10 이내).

```typescript
// src/lib/rateLimit.ts
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// 동일 IP에서 60초 내 3회까지 허용
export const rateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '60 s'),
  analytics: true,
});

// API Route에서 사용 예시:
// const { success } = await rateLimiter.limit(ip);
// if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
```

**환경변수 (.env.local):**
```
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxxxxxxxxxxx
```

**패키지 설치:**
```bash
npm install @upstash/ratelimit @upstash/redis
```

### 8.3. POST `/api/consultation`

**처리 흐름:**
1. Upstash Rate Limit 체크 (`rateLimiter.limit(ip)`) → 실패 시 429 반환
2. zod 스키마 입력 검증
3. IP SHA-256 해시 생성 (`crypto.createHash('sha256')`)
4. 24시간 내 동일 ip_hash 존재 여부 체크 → 존재 시 경고 응답 (중복 리드)
5. **Lead Score 서버사이드 계산** (`calculateLeadScore()`)
6. Cookie에서 `device_type`, `utm_source`, `referrer`, `inflow_page` 파싱
7. Supabase `consultations` INSERT
8. price_ranges 매칭 조회 → estimated_min, estimated_max 계산
9. Resend API 관리자 이메일 발송 + notification_log INSERT
10. Response: `{ success: true, estimatedMin, estimatedMax }`

### 8.4. GET `/api/price-range`
- 쿼리: `?brand=현대&model=투싼&months=48&km=20000`
- Response: `{ minMonthly, maxMonthly, conditions }`

### 8.5-a. GET `/api/info-articles`
- **[v3.5 신규]** `info_articles` 테이블에서 `is_active=true` 레코드 조회
- `display_order` 오름차순 정렬
- Response: `{ articles: InfoArticle[] }`
- anon 접근 허용 (RLS: SELECT only)

### 8.5-b. Admin 전용 API (`/api/admin/*`) [v3.5 신규]

> 모두 Supabase Auth 세션 검증 필수. 미인증 시 401 반환.

| 엔드포인트 | 메서드 | 설명 |
|:---|:---|:---|
| `/api/admin/revalidate` | POST | ISR 재생성 — Supabase Auth 인증 기반 (기존 `/api/revalidate`는 REVALIDATION_SECRET 기반으로 병행 유지) |
| `/api/admin/dashboard` | GET | 대시보드 요약 데이터 (오늘 신청, 미처리, HOT 리드, 이번 주 신청, 전환율) |
| `/api/admin/callbacks` | GET | 오늘의 콜백 리스트 (`callback_time` = 오늘인 건) |

### 8.6. 이메일 알림 (Resend)
- Trigger: consultation INSERT 즉시
- To: `process.env.ADMIN_EMAIL` (= iori21y@gmail.com)
- Subject: `[새 상담] {이름} - {차종} (리드: {lead_score}점)`
- Body: HTML 테이블 (고객 정보 + 선택 내역 + 예상 견적 + 리드 등급)

### 8.7. 카카오 알림톡 [Phase 2]
- `src/lib/kakao.ts` — 파일 생성하되 함수 내부는 `// Phase 2 구현 예정` 주석만 작성
- `kakao_sent` 컬럼 로직 작성 금지

---

## 9. Admin Page (`/admin`) — CRM 상세 스펙

### 9.1. 인증
- Supabase Auth (Email/Password)
- 미인증 시 `/admin/login` 리다이렉트
- 세션 만료: 24시간

### 9.2. 대시보드 (`/admin`)

**요약 카드 (상단 가로 배치):**

| 카드 | 데이터 소스 | 색상 |
|:---|:---|:---|
| 오늘 신청 | COUNT(created_at = today) | Accent |
| 미처리 | COUNT(status = 'pending') | Danger |
| HOT 리드 | COUNT(lead_score ≥ 80 AND status = 'pending') | Danger (강조) |
| 이번 주 신청 | COUNT(created_at ≥ 이번 주 월요일) | Success |
| 전환율 | contracted / total * 100 (%) | Warning |

**오늘의 콜백 리스트:**
- `callback_time`이 오늘인 건들 자동 표시
- 각 행: 고객명 + 차종 + 콜백 시간 + 메모 미리보기
- 전화번호 클릭 시 `tel:` 링크

### 9.3. 상담 관리 (`/admin/consultations`)

**테이블 컬럼:**
| 순서 | 컬럼 | 설명 |
|:---|:---|:---|
| 1 | 신청일 | created_at (YYYY-MM-DD HH:mm) |
| 2 | 리드 | lead_score 기반 뱃지 (HOT/WARM/COOL/COLD) |
| 3 | 이름 | name |
| 4 | 연락처 | phone (tap-to-call) |
| 5 | 차종 | car_brand + car_model |
| 6 | 계약조건 | contract_months개월 / 연 annual_km km |
| 7 | 예상금액 | estimated_min~max 만원 |
| 8 | 상태 | status 드롭다운 토글 |
| 9 | 결과 | consult_result 드롭다운 |
| 10 | 상담사 | assigned_to 드롭다운 |
| 11 | 콜백 | callback_time 표시 (있을 경우) |

**HOT 리드 하이라이팅:**
- `lead_score >= 80`인 Row: `bg-red-50 border-l-4 border-red-500`
- `lead_score >= 50`인 Row: `bg-orange-50`

**상세 패널 (행 클릭 시 슬라이드 오픈):**
- 고객 전체 선택 내역 (Step 1~6 데이터)
- 유입 정보: utm_source, referrer, inflow_page, device_type
- 리드 점수 + 등급 뱃지
- **[CRM] 상담 메모:** textarea + 저장 버튼 (Supabase UPDATE)
- **[CRM] 재연락 시간:** datetime-local picker + 저장 (Supabase UPDATE)
- **[CRM] 상담 결과:** 드롭다운 (계약완료/타사계약/보류/부재/취소) + 저장
- 알림 발송 이력: notification_log 조회 표시
- 상태 변경: pending → consulting → completed 토글

**필터:**
- 상태별 / 리드 등급별 / 날짜 범위 / 차종별 / 상담 결과별 / 상담사별
- "콜백 예정" 필터 (callback_time NOT NULL)
- "HOT 리드" 바로가기 (lead_score ≥ 80 AND status = 'pending')

**정렬:**
- 기본: 리드 점수 높은 순
- 선택 가능: 최신순 / 콜백 시간순

### 9.4. 프로모션 관리 (`/admin/promotions`)

**목록 뷰:** 카드형 (이미지 + 제목 + 활성 토글 + 노출 기간)

**등록/수정 폼:**
| 필드 | 입력 타입 | 필수 |
|:---|:---|:---|
| 제목 | text input | ✅ |
| 설명 | textarea | |
| 이미지 URL | text input | |
| 링크 URL | text input | |
| 시작일 | date picker | ✅ |
| 종료일 | date picker | ✅ |
| 정렬 순서 | number input | |
| 활성 여부 | toggle switch | ✅ |

**삭제:** 확인 모달 ("정말 삭제하시겠습니까?") → Supabase DELETE

### 9.5. 정보관리 (`/admin/info`) [v3.5 신규]

> `info_articles` 테이블 관리 — `/info` 페이지에 노출할 장기렌터카 정보 아티클 URL 등록·관리.

**목록 뷰:** 카드형 (제목 + URL + 활성 토글 + 정렬 순서)

**등록/수정 폼:**
| 필드 | 입력 타입 | 필수 |
|:---|:---|:---|
| 제목 | text input | ✅ |
| URL | text input (외부 링크) | ✅ |
| 한 줄 설명 | textarea | |
| 썸네일 이미지 URL | text input | |
| 정렬 순서 | number input | |
| 노출 여부 | toggle switch | ✅ |

**삭제:** 확인 모달 → Supabase DELETE

### 9.6. 가격표 관리 (`/admin/prices`)

**목록 뷰:** 브랜드 > 차종 아코디언 트리 구조

**등록/수정 폼:**
| 필드 | 입력 타입 | 필수 |
|:---|:---|:---|
| 브랜드 | select (현대/기아/제네시스) | ✅ |
| 차종 | select (선택 브랜드의 차종 목록) | ✅ |
| 계약기간 | select (36/48/60) | ✅ |
| 주행거리 | select (10000/20000/30000/40000) | ✅ |
| 최소 월 납부금 | number input (원) | ✅ |
| 최대 월 납부금 | number input (원) | ✅ |
| 조건별 상세 | JSON editor | |

**가격 수정 시 자동 처리:**
- Supabase UPDATE 성공 후 → `/api/revalidate` POST 호출 (해당 차종의 slug 전달)
- SEO 페이지가 즉시 재생성되어 고객 화면에 최신 가격 반영

**CSV 업로드:** 다건 등록/수정 지원 (형식: brand, model, months, km, min, max)

---

## 10. GA4 Analytics & Event Tracking

### 10.1. 설치
- `next/script`로 gtag.js 로드
- Measurement ID: `NEXT_PUBLIC_GA_ID`
- 유틸: `src/lib/gtag.ts`

### 10.2. 이벤트 정의

| Event Name | Trigger | Parameters |
|:---|:---|:---|
| `page_view` | 페이지 진입 | `page_path`, `page_title` |
| `step_view` | Step 화면 진입 | `step_number`, `step_name` |
| `step_complete` | Step 선택 완료 | `step_number`, `selected_value` |
| `step_back` | 이전 Step 이동 | `from_step`, `to_step` |
| `leave_intent` | 이탈 모달 표시 | `current_step` |
| `leave_intent_stay` | "이어서 견적 받기" | `current_step` |
| `leave_intent_exit` | "나중에 할게요" | `current_step` |
| `form_submit` | Step 6 폼 제출 | `car_brand`, `car_model` |
| `form_submit_success` | 신청 완료 | `car_brand`, `car_model`, `lead_score` |
| `form_submit_error` | 신청 실패 | `error_type` |
| `result_kakao_click` | 결과 카카오톡 클릭 | — |
| `result_call_click` | 결과 전화 클릭 | — |
| `result_retry` | "다른 차량도" | — |
| `seo_page_view` | 차종 SEO 페이지 뷰 | `car_slug`, `car_brand` |
| `seo_cta_click` | SEO 페이지 CTA | `car_slug`, `cta_type` |
| `info_cta_click` | Page 2 CTA | `section` |
| `quick_form_submit` | Page 2 간단 폼 | — |

### 10.3. 전환 퍼널
```
1. step_view (step=1)      → 진입
2. step_complete (step=1)   → Step 1 완료
3. step_complete (step=2)   → Step 2 완료
4. step_complete (step=3)   → Step 3 완료
5. step_complete (step=4)   → Step 4 완료
6. step_complete (step=5)   → Step 5 완료
7. form_submit              → 폼 제출 시도
8. form_submit_success      → 신청 완료 (최종 전환)
```

---

## 11. Security & Performance

### 11.1. 보안

| 항목 | 구현 |
|:---|:---|
| Rate Limit | Upstash Redis, 동일 IP 60초 내 3회 초과 시 429 |
| 중복 리드 방지 | IP SHA-256 해시, 24시간 내 동일 해시 경고 |
| Lead Score | 서버사이드 API Route에서만 계산 (클라이언트 조작 방지) |
| 입력 검증 | 서버사이드 zod 스키마 |
| XSS 방지 | React 기본 이스케이프 + DOMPurify (Admin 입력) |
| Admin 보호 | Supabase Auth + Next.js middleware |
| SEO 페이지 갱신 | Revalidation API에 REVALIDATION_SECRET 검증 |
| 환경변수 | `.env.local` (Git 제외), Vercel 환경변수 |

### 11.2. 성능

| 항목 | 목표 |
|:---|:---|
| LCP | < 2.5초 |
| FID | < 100ms |
| CLS | < 0.1 |
| SEO 페이지 | ISR (revalidate=3600) + On-demand Revalidation |
| 폰트 | Pretendard `font-display: swap` + preload |
| 이미지 | Next.js `<Image>` 자동 최적화 |
| 번들 | Admin Dynamic import 분리 |

---

## 12. 개인정보 처리방침 (`/privacy`)

> 아래 내용을 기반으로 `/privacy` 페이지 렌더링. 실제 운영 시 법률 검토 후 수정 가능.

### 수집하는 개인정보 항목
- 필수: 이름, 연락처(휴대폰 번호)
- 자동 수집: 접속 기기 정보, 유입 경로, IP 해시(비식별 처리)

### 수집 및 이용 목적
- 장기렌터카 상담 견적 제공 및 상담사 연결
- 서비스 개선을 위한 통계 분석 (비식별 처리)

### 보유 및 이용 기간
- 상담 완료 후 **1년간** 보유 후 파기
- 단, 관계 법령에 의해 보존이 필요한 경우 해당 기간 동안 보존

### 동의 거부 권리
- 개인정보 수집에 대한 동의를 거부할 권리가 있습니다
- 동의 거부 시 상담 신청이 제한될 수 있습니다

### 개인정보 처리 위탁
- 이메일 발송: Resend Inc.
- 호스팅: Vercel Inc.
- 데이터베이스: Supabase Inc.

### 개인정보 보호책임자
- (사업자 정보 확정 후 기입)

---

## 13. File Structure

```
.cursorrules                        # Cursor AI 코딩 규칙 (레거시 호환)
.cursor/
└── rules                           # Cursor AI 코딩 규칙 (최신 방식)

docs/
├── PRD.md                          # 기획서 (PRD v3.5)
└── wireframe.html                  # UI/UX 와이어프레임 (퍼블리싱 참고)

scripts/
├── seed.ts                         # DB 초기 데이터 적재 (price_ranges, 관리자 계정 등)
└── scraper.ts                      # 초기 가격 데이터 스크래핑용 (Puppeteer, 필요 시 사용)

src/
├── app/
│   ├── globals.css                 # Tailwind v4 (@theme inline 색상/폰트 변수 선언)
│   ├── layout.tsx                  # 루트 레이아웃 (Pretendard 폰트, GA4)
│   ├── page.tsx                    # 랜딩 페이지 (브랜드 소개 + CTA → /quote)
│   ├── quote/page.tsx              # 견적 스텝 플로우 (Step 1~6)
│   ├── info/page.tsx               # 장기렌터카 정보 + 프로모션 + InfoArticles
│   ├── promotions/page.tsx         # 프로모션 전용 페이지
│   ├── result/page.tsx             # 견적 결과 화면
│   ├── cars/
│   │   └── [slug]/page.tsx         # SEO 차종별 페이지 (ISR revalidate=3600)
│   ├── privacy/page.tsx            # 개인정보 처리방침
│   ├── admin/
│   │   ├── layout.tsx              # Admin 레이아웃 (Auth 체크)
│   │   ├── page.tsx                # 대시보드 (요약 카드 + 콜백 리스트)
│   │   ├── login/page.tsx          # 로그인
│   │   ├── consultations/page.tsx  # 상담 관리 (CRM 테이블 + 상세 패널)
│   │   ├── promotions/page.tsx     # 프로모션 CRUD
│   │   ├── prices/page.tsx         # 가격표 CRUD + Revalidation 트리거
│   │   └── info/page.tsx           # 정보관리 (info_articles CRUD)
│   └── api/
│       ├── consultation/route.ts   # 상담 신청 (Rate Limit + Lead Score + 알림)
│       ├── price-range/route.ts    # 견적 조회
│       ├── promotions/route.ts     # 프로모션 조회
│       ├── info-articles/route.ts  # 장기렌터카 정보 아티클 조회
│       ├── revalidate/route.ts     # On-demand ISR 재생성 (REVALIDATION_SECRET 검증)
│       └── admin/
│           ├── revalidate/route.ts # Admin ISR 재생성 (Supabase Auth 인증)
│           ├── dashboard/route.ts  # 대시보드 요약 데이터
│           └── callbacks/route.ts  # 오늘의 콜백 리스트
├── components/
│   ├── NavBar.tsx                  # 공통 네비게이션 바
│   ├── Footer.tsx                  # 공통 푸터
│   ├── Toast.tsx                   # 토스트 알림 컴포넌트 (toastStore 구독)
│   ├── GAPageView.tsx              # GA4 페이지뷰 이벤트 (클라이언트 컴포넌트)
│   ├── LeaveModal.tsx              # 이탈 방지 모달
│   ├── steps/
│   │   ├── StepLayout.tsx          # 공통 풀스크린 레이아웃
│   │   ├── ProgressBar.tsx         # 프로그레스 바
│   │   ├── Step1Branch.tsx         # 차종/예산 분기
│   │   ├── Step2Car.tsx            # 차종 선택 (브랜드탭 + 카테고리필터 + 트림시트)
│   │   ├── Step2Budget.tsx         # 예산 선택
│   │   ├── Step3Period.tsx         # 계약 기간
│   │   ├── Step4Mileage.tsx        # 주행거리
│   │   ├── Step5Payment.tsx        # 보증금/선납금
│   │   ├── Step6Contact.tsx        # 연락처 + 개인정보 동의
│   │   └── SelectionSummary.tsx    # 현재까지 선택 내역 요약 표시
│   ├── cars/
│   │   ├── CarHero.tsx             # SEO 페이지 Hero
│   │   ├── CarCtaSection.tsx       # CTA 섹션 (견적 + 카카오 + 전화)
│   │   ├── CarSeoAnalytics.tsx     # SEO 페이지 GA4 이벤트 (클라이언트)
│   │   ├── PriceCompareTable.tsx   # 조건별 가격 비교표
│   │   └── RelatedCars.tsx         # 관련 차종 (프론트엔드 filter)
│   ├── info/
│   │   └── InfoArticles.tsx        # 장기렌터카 정보 아티클 카드 그리드
│   └── admin/
│       ├── ConsultationTable.tsx   # 상담 목록 (HOT 리드 하이라이팅)
│       ├── ConsultationDetail.tsx  # CRM 상세 패널 (메모, 콜백, 결과)
│       ├── CallbackList.tsx        # 오늘의 콜백 리스트
│       ├── LeadBadge.tsx           # 리드 등급 뱃지 컴포넌트
│       ├── PromotionForm.tsx       # 프로모션 등록/수정 폼
│       └── PriceEditor.tsx         # 가격표 편집 + Revalidation 호출
├── constants/
│   └── vehicles.ts                 # 차량 데이터 45종 (slug, SEO 포함)
├── store/
│   ├── quoteStore.ts               # 견적 Step 상태 (Zustand + persist)
│   └── toastStore.ts               # Toast 전역 상태 (Zustand)
├── lib/
│   ├── supabase-client.ts          # Supabase 브라우저 클라이언트 ('use client' 환경용)
│   ├── supabase-server.ts          # Supabase 서버 클라이언트 (Server Component/API Route용)
│   ├── supabase.ts                 # 공통 Supabase 타입 및 re-export
│   ├── rateLimit.ts                # Upstash Redis Rate Limiter
│   ├── gtag.ts                     # GA4 유틸리티
│   ├── leadScore.ts                # 리드 점수 계산 (서버사이드 전용)
│   ├── phoneUtils.ts               # 전화번호 포맷/검증 유틸 (010-XXXX-XXXX)
│   ├── kakao.ts                    # Phase 2 placeholder (주석만)
│   ├── notification.ts             # 이메일 발송 (Resend)
│   └── utils.ts                    # 공통 유틸 (해시 등)
├── middleware.ts                   # HTTP 헤더 기반 쿠키 수집
└── hooks/
    ├── useHydrated.ts              # SSR Hydration 훅
    ├── useLeaveIntent.ts           # 이탈 감지 훅
    └── useToast.ts                 # toastStore 래핑 훅 (컴포넌트에서 Toast 호출)

public/
└── cars/                           # 차량 이미지 (webp)
    ├── hyundai-avante.webp
    ├── hyundai-tucson.webp
    ├── ... (45종)
    └── genesis-gv80-coupe.webp
```

---

## 14. 미결정 사항

### ✅ 확정 항목
- [x] **브랜드명:** 카담(CADAM)
- [x] **관리자 이메일:** iori21y@gmail.com
- [x] **관리자 비밀번호:** Supabase Auth Dashboard에서 직접 설정

### 🔧 개발 시 설정 필요 (외부 서비스 가입 후)
- [ ] **도메인 구매 + Vercel 연결** — cadam.co.kr 가용 확인 후 구매 (gabia.com 등)
- [ ] **Supabase 프로젝트 생성** → `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` 발급
- [ ] **Upstash Redis 계정 생성** → `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` 발급
- [ ] **Resend 계정 생성** → `RESEND_API_KEY` 발급, 발신 이메일 인증
- [ ] **GA4 속성 생성** → `NEXT_PUBLIC_GA_ID` 발급
- [ ] **REVALIDATION_SECRET** — 임의 문자열 생성 (예: `openssl rand -hex 32`)

### 📝 운영 준비 (오픈 전)
- [ ] **운영 전화번호 확정** (현재 placeholder)
- [ ] **카카오톡 비즈채널 개설** → 채널 URL 확정 (현재 placeholder)
- [ ] **사업자 등록 완료** → Footer 사업자 정보 기입 (현재 placeholder)
- [ ] **개인정보 보호책임자** 정보 기입
- [ ] **price_ranges 초기 데이터** 입력 (인기 차종 5~10개)
- [ ] **차량 이미지 준비** (webp, public/cars/ 폴더, 45종)
- [ ] **카카오 알림톡 발신 프로필/템플릿 승인** (Phase 2)

### 📌 환경변수 목록 (.env.local)
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXxxx

# Resend (이메일)
RESEND_API_KEY=re_xxx
ADMIN_EMAIL=iori21y@gmail.com

# GA4
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# ISR Revalidation
REVALIDATION_SECRET=(openssl rand -hex 32 로 생성)

# 카카오톡 채널 (개설 후 입력)
NEXT_PUBLIC_KAKAO_CHANNEL_URL=https://pf.kakao.com/_xxxxx

# 운영 전화번호 (확정 후 입력)
NEXT_PUBLIC_PHONE_NUMBER=02-0000-0000
```
