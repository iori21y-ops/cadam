# 카담(CADAM) 보안 점검 결과

> **점검일:** 2026-03-12  
> **점검 항목:** 8개

---

## 1. SUPABASE_SERVICE_ROLE_KEY 클라이언트 노출 여부

### 결과: ✅ 양호

| 위치 | 사용처 | 비고 |
|------|--------|------|
| `src/lib/supabase-server.ts` | `createServiceRoleSupabaseClient()` | 서버 전용 모듈 |
| `src/app/api/consultation/route.ts` | `createServiceRoleSupabaseClient()` | API Route (서버) |

- `supabase-server.ts`는 **서버 전용** (`cookies()`, `createServerClient` 등 사용)
- `createServerSupabaseClient` / `createServiceRoleSupabaseClient`를 import하는 파일은 모두 **API Route** 또는 **Server Component** (`cars/[slug]/page.tsx`)
- 클라이언트 컴포넌트에서 `supabase-server` import 없음

**클라이언트에서 사용하는 환경변수:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`만 사용 (`supabase-client.ts`)

---

## 2. leadScore 서버사이드 전용 호출

### 결과: ✅ 양호

| 위치 | 내용 |
|------|------|
| `src/lib/leadScore.ts` | `calculateLeadScore()` 함수 정의 |
| `src/app/api/consultation/route.ts` | `calculateLeadScore()` **유일한 호출처** |

- API Route에서만 호출됨
- 프론트엔드(Step6Contact, quoteStore 등)에서 `calculateLeadScore` import 없음
- `gtag.formSubmitSuccess`의 `leadScore` 파라미터는 **API 응답에서 받은 값**을 전달하는 것으로, 클라이언트 계산 아님

---

## 3. localStorage 직접 접근

### 결과: ✅ 양호

- `localStorage.getItem`, `localStorage.setItem`, `localStorage.removeItem`, `localStorage.clear` **사용처 없음**
- `useHydrated.ts`에는 주석으로만 "Zustand persist는 클라이언트(localStorage)에서만 작동" 언급
- Zustand `persist` 미들웨어를 통한 저장만 사용

---

## 4. console.log 프로덕션 코드

### 결과: ⚠️ 수정 필요

**console.log (규칙 위반 — 1건):**

| 파일 | 라인 | 내용 |
|------|------|------|
| `src/app/api/consultation/route.ts` | 221 | `console.log('[Consultation] Email sent to', process.env.ADMIN_EMAIL)` |

**console.error (에러 로깅 — 13건):**

| 파일 | 용도 |
|------|------|
| `api/consultation/route.ts` | INSERT 실패, 이메일 실패, 전체 catch |
| `api/price-range/route.ts` | 쿼리/API 에러 |
| `api/promotions/route.ts` | 쿼리/API 에러 |
| `api/info-articles/route.ts` | 쿼리/API 에러 |
| `api/admin/revalidate/route.ts` | API 에러 |
| `api/admin/callbacks/route.ts` | 쿼리/API 에러 |
| `api/admin/dashboard/route.ts` | API 에러 |
| `api/revalidate/route.ts` | API 에러 |

**권장 조치:**
- **`console.log` 1건 제거** (규칙: "console.log를 프로덕션 코드에 남기지 말 것")
- `console.error`는 에러 추적용으로 허용 가능. 필요 시 환경변수 기반 조건부 로깅 또는 전용 로깅 서비스로 전환

---

## 5. any 타입 사용

### 결과: ✅ 양호

- `: any` 또는 `as any` 패턴 **사용처 없음**
- TypeScript 명시적 타입 또는 인터페이스 사용 준수

---

## 6. 인라인 style={{}} 사용

### 결과: ⚠️ 2건 (규칙 위반)

| 파일 | 라인 | 내용 |
|------|------|------|
| `src/components/Toast.tsx` | 40 | `style={{ bottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}` |
| `src/components/steps/ProgressBar.tsx` | 41 | `style={{ width: `${pct}%` }}` |

**규칙:** `.cursorrules` — "인라인 style 금지, CSS 파일 별도 생성 금지"

**비고:**
- **Toast:** `env(safe-area-inset-bottom)`은 CSS 함수로, Tailwind arbitrary value로 대체 가능: `bottom-[calc(80px+env(safe-area-inset-bottom,0px))]`
- **ProgressBar:** `width: ${pct}%`는 동적 값. Tailwind `w-[${pct}%]`는 JIT에서 동적 클래스 생성이 제한될 수 있음. `style` 사용이 불가피한 경우 규칙 예외 검토 필요

---

## 7. kakao_sent 관련 로직

### 결과: ✅ 양호

| 위치 | 내용 |
|------|------|
| `scripts/supabase-schema.sql` | `kakao_sent` 컬럼 정의 (DB 스키마) |
| `src/lib/kakao.ts` | "kakao_sent 컬럼 로직 작성 금지" 주석만 |
| PRD, .cursorrules | Phase 2 전용 규칙 문서화 |

- **애플리케이션 코드에 `kakao_sent` 로직 없음**
- DB 스키마는 Phase 2 대비 컬럼 정의만 존재

---

## 8. .env.local .gitignore 포함

### 결과: ✅ 양호

```gitignore
# env files (can opt-in for committing if needed)
.env*
```

- `.env*` 패턴으로 `.env.local`, `.env.development`, `.env.production` 등 **모든 env 파일** 무시
- `.env.local` 포함됨

---

## 요약

| # | 항목 | 결과 | 조치 |
|---|------|------|------|
| 1 | SUPABASE_SERVICE_ROLE_KEY 클라이언트 노출 | ✅ 양호 | — |
| 2 | leadScore 서버사이드 전용 | ✅ 양호 | — |
| 3 | localStorage 직접 접근 | ✅ 양호 | — |
| 4 | console.log 프로덕션 | ⚠️ 수정 필요 | console.log 제거 |
| 5 | any 타입 | ✅ 양호 | — |
| 6 | 인라인 style | ⚠️ 2건 | Toast: Tailwind로 대체 가능 |
| 7 | kakao_sent 로직 | ✅ 양호 | — |
| 8 | .env.local gitignore | ✅ 양호 | — |

---

## 권장 수정 사항

1. **consultation/route.ts** — `console.log` 제거 (라인 221)
2. **Toast.tsx** — `style={{ bottom: ... }}` → `className="bottom-[calc(80px+env(safe-area-inset-bottom,0px))]"` 등 Tailwind로 대체
3. **ProgressBar.tsx** — 동적 width는 Tailwind `arbitrary value` 또는 CSS 변수로 대체 검토 (규칙 준수 시)
