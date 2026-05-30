# CADAM-WEB 코드베이스 감사 보고서

> 감사 일시: 2026-05-30 | 대상: `~/projects/cadam/cadam-web` | 도구: Claude Code 멀티에이전트

---

## 요약 (Executive Summary)

| 카테고리 | Critical | Warning | Info | 합계 |
|---------|---------|---------|------|------|
| 보안 (Security) | 5 | 5 | 3 | 13 |
| 데드 코드 (Dead Code) | 0 | 12 | 7 | 19 |
| 성능 (Performance) | 0 | 5 | 5 | 10 |
| 코드 품질 (Code Quality) | 0 | 2 | 2 | 4 |
| **합계** | **5** | **24** | **17** | **46** |

> 검증 통계: raw 발견 48건 → 독립 검증 통과 46건 (54개 서브에이전트, 447개 툴 호출)

**핵심 요약:** 가장 심각한 문제는 인증 없이 외부에 공개된 API 엔드포인트 3개(`/api/status`, `/api/commands`, `/api/switch-model`)로, 서버 내부 파일 시스템 경로와 운영 데이터를 누구나 읽고 쓸 수 있는 상태입니다. 보안 취약점을 즉시 패치한 후, 사용되지 않는 컴포넌트 19건을 정리하고, 반복적인 DB 쿼리 패턴을 개선하는 순서로 작업을 진행할 것을 권고합니다.

---

## 즉시 조치 필요 항목 (Critical Issues)

> 아래 5건은 현재 프로덕션 서버에서 인증 없이 누구나 접근 가능한 상태입니다. 즉시 수정이 필요합니다.

### [CRITICAL-1] `/api/status` — 인증 없이 시스템 전체 내부 정보 노출
**파일:** `src/app/api/status/route.ts:1-400`

서버의 디스크 사용량, RAM, 실행 중인 n8n 워크플로우 목록, cron 스케줄, OpenClaw 세션 파일 내용, Ollama 모델명 및 메모리, 블로그 발행 로그, 네이버 쿠키 신선도, Telegram 봇 명령 목록, CPU 사용률, 내부 포트 스캔 결과가 인증 없이 JSON으로 반환됩니다. `execSync()`로 `df`, `vm_stat`, `lsof`, `crontab -l`, `ollama list` 등 셸 명령을 실행하고, `/Users/kim/.openclaw/` 하위의 민감한 파일들을 직접 읽어 응답에 포함합니다.

**수정 방법:** GET 핸들러 최상단에 서버 측 인증 체크를 추가합니다.
```typescript
const { data: { user } } = await (await createServerSupabaseClient()).auth.getUser();
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```
또는 `/admin` 경로 하위로 이동하여 기존 어드민 인증 미들웨어의 보호를 받도록 합니다.

---

### [CRITICAL-2] `/api/commands` — 인증 없이 서버 파일 시스템에 임의 쓰기 가능
**파일:** `src/app/api/commands/route.ts:1-42`

POST 핸들러는 요청 본문의 `{ key, desc }` 값을 그대로 `/Users/kim/.openclaw/workspace/custom-commands.json`에 기록하고, DELETE 핸들러는 해당 파일의 항목을 삭제합니다. 세션 확인, 토큰 검증, 속도 제한이 전혀 없습니다. 인터넷에서 이 엔드포인트를 발견한 누구든 custom-commands 저장소를 오염시키거나 삭제할 수 있습니다.

**수정 방법:** 두 핸들러 모두 최상단에 동일한 getUser 인증 체크를 추가합니다. 이 엔드포인트가 로컬 개발 도구 전용이라면, `Host` 헤더가 `localhost`인 경우에만 허용하거나 프로덕션 빌드에서 라우트 자체를 제거하는 것을 권장합니다.

---

### [CRITICAL-3] `/api/switch-model` — 인증 없이 AI 모델 설정 파일 덮어쓰기 가능
**파일:** `src/app/api/switch-model/route.ts:1-23`

POST 핸들러가 호출자가 제공한 임의의 모델 문자열을 `/Users/kim/.openclaw/workspace/preferred-model.json`에 씁니다. 세션 확인이 전혀 없으며, 공격자가 OpenClaw 에이전트가 사용하는 AI 모델을 임의로 변경할 수 있습니다.

**수정 방법:** CRITICAL-1, CRITICAL-2와 동일하게 getUser 인증 체크를 추가합니다. 로컬 전용 도구라면 `cadam-web` 프로젝트 외부로 분리하거나 삭제를 권장합니다.

---

### [CRITICAL-4] `/api/status` — 하드코딩된 절대 경로가 공개 API 응답에 포함
**파일:** `src/app/api/status/route.ts:53, 88, 94, 99, 120, 130, 134, 170, 230, 247, 266, 290, 359`

`/Users/kim/...` 형태의 절대 경로가 `execSync()` 셸 명령 및 `fs.readFileSync()` 호출에 하드코딩되어 있습니다. `publish.log`, `backup.log`, `naver-cookies.json`, `.openclaw/cron/jobs.json`, `HEARTBEAT.md`, `TOOLS.md`, 세션 JSONL 파일 등이 읽혀 API 응답에 포함됩니다. 미들웨어(`middleware.ts`)의 matcher가 `/api/status`를 전혀 커버하지 않아 현재 인증 우회 없이도 완전히 공개된 상태입니다.

**수정 방법:** 모든 경로 상수를 파일 상단 한 곳에 모으고 `process.env.HOME`을 사용합니다.
```typescript
const HOME = process.env.HOME ?? '/Users/kim';
```
그리고 CRITICAL-1의 인증 체크를 함께 적용합니다.

---

### [CRITICAL-5] `/api/commands` — custom-commands.json 경로 하드코딩 및 미인증 파일 쓰기
**파일:** `src/app/api/commands/route.ts:4`

`const CUSTOM_CMDS_PATH = '/Users/kim/.openclaw/workspace/custom-commands.json'` 가 하드코딩되어 있습니다. CRITICAL-2와 중복되는 문제이나, 경로 하드코딩 자체가 개발자 로컬 사용자명을 소스 코드에 노출시키며, Vercel 배포 환경에서는 읽기 전용 파일 시스템으로 인해 쓰기 자체가 실패합니다.

**수정 방법:** `process.env.HOME`을 사용하도록 경로를 수정하고, CRITICAL-2의 인증 체크와 함께 적용합니다.

---

## 1. 보안 (Security)

### [WARNING] WordPress 동기화 엔드포인트에 추측 가능한 하드코딩 폴백 시크릿
**파일:** `src/app/api/sync-wp/route.ts:8`

**설명:** `const syncSecret = process.env.SYNC_WP_SECRET || 'cadam-sync-2026'` 코드에서 `SYNC_WP_SECRET` 환경변수가 없을 경우 `'cadam-sync-2026'`이라는 추측 가능한 값이 폴백으로 사용됩니다. 이 값을 알아낸 공격자는 WordPress에서 Supabase로의 전체 동기화를 임의로 트리거하여 `info_articles` 테이블에 데이터를 삽입할 수 있습니다.

**수정 방법:**
```typescript
const syncSecret = process.env.SYNC_WP_SECRET;
if (!syncSecret) {
  return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
}
```
하드코딩 폴백을 제거하고 환경변수가 반드시 설정되도록 강제합니다.

---

### [WARNING] `SafeHtml` 컴포넌트 — HTML 새니타이제이션 없이 `dangerouslySetInnerHTML` 사용
**파일:** `src/components/SafeHtml.tsx:8`

**설명:** `dangerouslySetInnerHTML={{ __html: html }}` 형태로 새니타이제이션 없이 HTML을 렌더링합니다. Supabase `info_articles` 테이블의 콘텐츠와 WordPress HTML이 이 컴포넌트를 통해 렌더링됩니다. `isomorphic-dompurify ^3.8.0`이 이미 설치되어 있고 `ConsultationDetail.tsx`에서 사용 중이지만, `SafeHtml`에서는 호출되지 않습니다. 관리자 계정이 탈취되거나 WordPress 포스트가 변조될 경우 스크립트 태그가 모든 방문자 브라우저에서 실행됩니다.

**수정 방법:**
```typescript
import DOMPurify from 'isomorphic-dompurify';
// ...
dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }}
```
이미 설치된 라이브러리를 활용하므로 추가 패키지 설치 없이 적용 가능합니다.

---

### [WARNING] 어드민 라우트 보호가 클라이언트 사이드에만 존재
**파일:** `src/app/admin/layout.tsx:36-52`

**설명:** 어드민 레이아웃이 `useEffect` 내부에서 `supabase.auth.getSession()`(브라우저 호출)으로만 인증을 수행합니다. `middleware.ts`의 matcher가 `/admin`을 포함하지 않아 서버 측 인증 가드가 없습니다. JS가 비활성화된 크롤러나 직접 `fetch` 요청을 통해 라우트 존재 여부가 노출됩니다.

**수정 방법:** `middleware.ts`의 matcher에 `/admin/:path*`를 추가하고, `@supabase/ssr`의 `createServerClient`를 사용하여 미들웨어에서 서버 측 세션 체크 후 미인증 요청을 `/admin/login`으로 리다이렉트합니다.

---

### [WARNING] 어드민 API 엔드포인트가 인증만 확인하고 어드민 역할(role)은 미확인
**파일:** `src/app/api/admin/callbacks/route.ts:20-23`

**설명:** 모든 `/api/admin/*` 라우트가 `supabase.auth.getUser()`로 세션 존재 여부만 확인합니다. 어드민 역할 검증(이메일 허용 목록, `user_roles` 테이블 조회 등)이 없습니다.

**수정 방법:**
```typescript
if (user.email !== process.env.ADMIN_EMAIL) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
}
```
더 확장성 있는 방법으로는 `admin_users` Supabase 테이블을 만들고 공유 `requireAdmin()` 헬퍼에서 조회하는 구조를 권장합니다.

---

### [WARNING] Anthropic API를 SDK 없이 `fetch`로 직접 호출하며 버전 하드코딩
**파일:** `src/app/api/ai-comment/route.ts:71, 76`

**설명:** `https://api.anthropic.com/v1/messages`를 직접 `fetch`하며 `anthropic-version: '2023-06-01'`이 하드코딩되어 있습니다. Anthropic이 구버전 API를 deprecate할 경우 에러 메시지 없이 조용히 실패할 수 있습니다.

**수정 방법:** `@anthropic-ai/sdk`를 설치하고 공식 SDK를 사용합니다.

---

### [INFO] `/api/status` — 내부 서비스 포트와 RAM 용량 하드코딩
**파일:** `src/app/api/status/route.ts:21-23`

**수정 방법:** `const OLLAMA_URL = process.env.OLLAMA_URL ?? 'http://127.0.0.1:11434'` 형태로 named 상수 추출.

---

### [INFO] `security.ts` — 프로덕션 빌드에 localhost CORS 오리진 포함
**파일:** `src/lib/api/security.ts:25-26`

**수정 방법:**
```typescript
...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000', 'http://localhost:3001'] : [])
```

---

### [INFO] 개인 이메일 주소가 소스 코드에 하드코딩
**파일:** `src/app/privacy/page.tsx:11`

**수정 방법:** `src/constants/brand.ts`로 이동하거나 `NEXT_PUBLIC_OWNER_EMAIL` 환경변수를 사용합니다.

---

## 2. 데드 코드 (Dead Code)

### [WARNING] `PriceEditor` 컴포넌트 — 미사용 (임포트 0건)
**파일:** `src/components/admin/PriceEditor.tsx:53`

`admin/prices/page.tsx`가 CSV 파싱 로직을 인라인으로 직접 구현하고 있어 대체된 것으로 보입니다. **→ 삭제 권장**

---

### [WARNING] `TrimPriceTable` 컴포넌트 — 미사용 (임포트 0건)
**파일:** `src/components/cars/TrimPriceTable.tsx:35`

전체 프로젝트에서 임포트/렌더링하는 파일 없음. **→ 삭제 권장**

---

### [WARNING] `PriceCompareTable` 컴포넌트 — JSX 렌더링 없음 (타입만 참조)
**파일:** `src/components/cars/PriceCompareTable.tsx:26`

`EstimateConfigurator.tsx`가 `import type { PriceRangeRow }`로 타입만 참조. 37~93줄의 JSX 렌더링 로직 전체가 데드 코드. **→ 타입 이전 후 삭제 권장**

---

### [WARNING] `TermsComparisonTable` 컴포넌트 — `TermsComparisonCards`로 대체됨
**파일:** `src/components/info/TermsComparisonTable.tsx:264`

318줄 전체가 사장됨. `.bak` 파일에만 참조 잔존. **→ 삭제 권장**

---

### [WARNING] 홈 컴포넌트 5종 — 미사용 (임포트 0건)
- `src/components/home/ArticleSection.tsx:99`
- `src/components/home/HeroSection.tsx:3`
- `src/components/home/PopularVehiclesSection.tsx:26`
- `src/components/home/PromotionBanner.tsx:22`
- `src/components/home/TrustSection.tsx:22`

`HomeClient.tsx`가 홈 UI를 렌더링하지만 이 컴포넌트들을 포함하지 않음. **→ 5개 파일 삭제 권장**

---

### [WARNING] `Step1Branch` 컴포넌트 — 미사용 (고아 상태)
**파일:** `src/components/steps/Step1Branch.tsx:36`

Step2~Step6은 활발히 사용되지만 Step1Branch만 고아 상태. **→ 삭제 권장**

---

### [WARNING] `src/components/ui/v5.tsx` — 폐기된 디자인 시스템 파일
**파일:** `src/components/ui/v5.tsx:7`

10개 컴포넌트 export, 임포트 0건. **→ 파일 전체 삭제 권장**

---

### [WARNING] `src/lib/utils.ts` — 전체 파일 미사용 (`phoneUtils.ts`와 기능 중복)
**파일:** `src/lib/utils.ts:10`

`@/lib/utils`를 임포트하는 파일 없음. `phoneUtils.ts`에 동일 함수 존재. **→ 삭제 권장**

---

### [WARNING] `/api/price-range` 라우트 — 프론트엔드 호출 없음
**파일:** `src/app/api/price-range/route.ts:1`

90줄 Supabase 쿼리 로직, 호출자 없음. **→ 삭제 권장**

---

### [WARNING] 프로젝트 루트 레벨 `diagnosis-*.ts` / `flow-engine.ts` 7개 파일
`diagnosis-ai.ts`, `diagnosis-finance.ts`, `diagnosis-option.ts`, `diagnosis-products.ts`, `diagnosis-vehicle.ts`, `diagnosis.ts`, `flow-engine.ts`

모두 `src/` 내부 최신 버전의 구버전 사본. **→ 루트 7개 파일 삭제 권장**

---

### [INFO] `DiagnosisBannerLazy` — 미사용 (지연 로딩 래퍼 미적용)
**파일:** `src/components/home/DiagnosisBannerLazy.tsx:12`

`DiagnosisBanner.tsx`가 직접 임포트되며 지연 로딩 래퍼는 연결되지 않음.

---

### [INFO] `/api/commands`, `/api/switch-model` — 로컬 개발 도구가 웹앱에 포함
프로덕션 배포 시 로컬 파일 경로 하드코딩으로 동작 불가. **→ cadam-web 외부로 분리 또는 삭제**

---

### [INFO] `adjustWithMarketPrice` — Phase 4 구현 전까지 영구 stub
**파일:** `src/lib/domain/depreciation-calculator.ts:916`

무조건 `null` 반환. GitHub 이슈 번호로 트래킹 권장.

---

### [INFO] `/api/rental-price` — Phase 2 캐시 미스 폴백 미구현
**파일:** `src/app/api/rental-price/route.ts:114`

GitHub 이슈 생성 후 이슈 번호를 주석에 추가 권장.

---

## 3. 성능 (Performance)

### [WARNING] `/api/accident-stats` — base_ym 조회를 위한 순차 Supabase 쿼리 (워터폴)
**파일:** `src/app/api/accident-stats/route.ts:36-54`

12월 데이터 조회 후 없을 경우 최신 월 조회를 순차 실행. 매 요청마다 추가 라운드트립.

**수정 방법:**
```typescript
.select('base_ym').eq('stat_kind','loss').order('base_ym',{ascending:false}).limit(1)
```
결과가 `'12'`로 끝나는지 JavaScript에서 판단.

---

### [WARNING] `/api/accident-stats` — trend 요청 시 Supabase 16회 라운드트립 발생
**파일:** `src/app/api/accident-stats/route.ts:118-135`

`trend=true` 시 8개 연도 × 2개 테이블 = 16회 순차 쿼리. 변경되지 않는 역사적 데이터임에도 캐시 없음.

**수정 방법:** `.in('base_ym', [...TREND_YMS])` 단일 쿼리로 병합하거나 `unstable_cache` 1시간 TTL 적용.

---

### [WARNING] `/api/consultation` — INSERT 후 2번의 추가 순차 DB 쓰기
**파일:** `src/app/api/consultation/route.ts:188-209`

상담 레코드 INSERT → `pricing` SELECT → 별도 UPDATE 순서로 2회 추가 라운드트립.

**수정 방법:** `pricing` SELECT를 INSERT 전으로 이동하여 INSERT 페이로드에 직접 포함.

---

### [WARNING] `admin/prices/page.tsx` — CSV 임포트 중 N+1 Supabase 쓰기
**파일:** `src/app/admin/prices/page.tsx:378-419`

CSV 각 행마다 UPDATE + INSERT 2회 순차 await. 30개 모델 = 60회 순차 쿼리.

**수정 방법:**
1. `.in('car_model', allModels)` 단일 UPDATE로 일괄 비활성화
2. `.insert(allRows)` 단일 호출로 일괄 삽입

---

### [WARNING] `diagnosis/compare/page.tsx` — recharts 정적 임포트로 초기 번들 비대화
**파일:** `src/app/diagnosis/compare/page.tsx:23`

`diagnosis/report/page.tsx`는 `next/dynamic + ssr:false`로 지연 로딩하지만 compare 페이지는 정적 임포트(~300kB).

**수정 방법:** `report/page.tsx`와 동일하게 `next/dynamic + ssr: false` 적용.

---

### [WARNING] 모듈 레벨 인메모리 Map 캐시가 Vercel 서버리스에서 동작하지 않음
**파일:** `src/app/api/used-prices/route.ts:44-45`

Vercel 서버리스 콜드 스타트마다 캐시가 비워짐. 1시간 TTL이 사실상 무의미.

**수정 방법:** `unstable_cache` 또는 `export const revalidate = 3600`으로 교체.

---

### [INFO] `cars/[slug]/page.tsx` — `info_articles` 쿼리를 병렬화 가능
**파일:** `src/app/cars/[slug]/page.tsx:92-148`

`info_articles`는 `vehicle.slug`(라우트 파라미터)로 조회하므로 `vehicles` DB 결과를 기다릴 필요 없음.

---

### [INFO] `ArticleSection.tsx` — Next.js `<Image>` 대신 raw `<img>` 사용
**파일:** `src/components/home/ArticleSection.tsx:148`

**수정 방법:** `<Image width={88} height={88} />` 또는 `loading="lazy"` 추가.

---

### [INFO] `admin/prices/page.tsx` — 어드민 차량 목록 `<img>` lazy loading 없음
**파일:** `src/app/admin/prices/page.tsx:614`

**수정 방법:** `loading="lazy"` 추가.

---

### [INFO] `diagnosis/vehicle/page.tsx` — 정적 차량 목록을 브라우저에서 Supabase 쿼리
**파일:** `src/app/diagnosis/vehicle/page.tsx:431-456`

**수정 방법:** 부모를 서버 컴포넌트로 전환 + `export const revalidate = 60`.

---

## 4. 코드 품질 (Code Quality)

### [WARNING] 8개 API 라우트가 중앙화된 Supabase service-role 클라이언트 팩토리를 우회
**파일:** `src/app/api/used-prices/route.ts:24, 32-35` (외 7개 파일)

`accident-stats`, `ev-charger-stats`, `fuel-prices`, `insurance-stats`, `rental-price`, `sync-wp`, `used-prices`, `victim-stats` 8개 파일이 `createClient`를 직접 임포트. `src/lib/supabase-server.ts`의 `createServiceRoleSupabaseClient()`가 이미 존재하지만 미사용.

**수정 방법:**
```typescript
import { createServiceRoleSupabaseClient } from '@/lib/supabase-server';
```
기계적이고 위험도가 낮은 리팩토링.

---

### [WARNING] `diagnosis/compare/page.tsx` — nullable 값에 대한 비null 단언(`!`)이 구조적으로 취약
**파일:** `src/app/diagnosis/compare/page.tsx:470-474`

`hasData` 중간 변수로 TypeScript narrowing 불가. `dbInsurance!.xxx` 4개.

**수정 방법:**
```tsx
{dbInsurance && Object.keys(dbInsurance.breakdown).length > 0 ? (
  <InsuranceInsightCard annualMk={Math.round(dbInsurance.amount / 10_000)} breakdown={dbInsurance.breakdown} ... />
) : null}
```

---

### [INFO] `KakaoMap.tsx` — Kakao Maps SDK 객체가 `any` 타입으로 캐스팅
**파일:** `src/components/map/KakaoMap.tsx:137-143`

`src/types/kakao-maps.d.ts`에 타입 정의가 이미 존재하지만 미사용.

---

### [INFO] `/api/status` — n8n/OpenClaw API 응답에 반복적 `any` 캐스팅
**파일:** `src/app/api/status/route.ts:115-116, 121, 146, 269, 362, 368`

최소 인터페이스 정의 권장:
```typescript
interface N8nWorkflow { id: string; name: string; active: boolean; }
```

---

## 빠른 개선 항목 (Quick Wins — Info Severity)

- **`src/app/privacy/page.tsx`**: `OWNER_EMAIL` 상수를 `src/constants/brand.ts`로 이동 (5분)
- **`src/lib/api/security.ts`**: localhost CORS 오리진을 `NODE_ENV !== 'production'` 조건으로 분기 (3줄)
- **`src/components/home/DiagnosisBannerLazy.tsx`**: 사용하지 않으면 삭제
- **`src/components/home/ArticleSection.tsx:148`**: `loading="lazy"` 추가 또는 `<Image>` 교체
- **`src/app/admin/prices/page.tsx:614`**: `loading="lazy"` 추가
- **`src/lib/domain/depreciation-calculator.ts`**: stub에 GitHub 이슈 번호 추가
- **`src/app/api/rental-price/route.ts:114`**: Phase 2 TODO에 GitHub 이슈 번호 추가

---

## 우선순위 권고

**1순위 [즉시 — 당일]** CRITICAL 보안 5건 수정
- `/api/status`, `/api/commands`, `/api/switch-model` 에 `getUser` 인증 체크 추가
- `/api/status`의 하드코딩 경로를 `process.env.HOME`으로 교체
- 이 작업 없이는 서버 내부 정보가 인터넷에 완전 노출된 상태

**2순위 [이번 주]** WARNING 보안 5건 수정
- `sync-wp` 폴백 시크릿 제거
- `SafeHtml`에 `DOMPurify.sanitize()` 적용
- 어드민 라우트에 서버 측 미들웨어 추가
- 어드민 API에 역할 체크 추가
- Anthropic API 호출을 SDK로 교체

**3순위 [다음 스프린트]** 데드 코드 정리
- 홈 컴포넌트 5종, `v5.tsx`, `TermsComparisonTable`, `utils.ts`, 루트 레벨 7개 파일, `/api/price-range` 삭제
- 번들 크기 감소 및 유지보수 부담 경감

**4순위 [다음 스프린트]** 성능 개선
- `accident-stats` 16회 쿼리를 `.in()` + `unstable_cache`로 교체
- `consultation` INSERT를 단일 쓰기로 통합
- CSV 임포트 N+1을 배치 처리로 변경
- `compare/page.tsx` recharts를 `next/dynamic`으로 교체

**5순위 [백로그]** 코드 품질
- 8개 파일 Supabase 클라이언트 팩토리 통일
- `hasData` 비null 단언 리팩토링
- Kakao Maps SDK 타입 정의 적용
