# 카담(CADAM) 장기렌터카 랜딩페이지 — Cursor Project Rules

## 프로젝트 개요
**카담(CADAM)** — 장기렌터카 상담 유도 랜딩페이지. 헤이딜러(heydealer.com) 스타일의 풀스크린 스텝 전환 UI로 견적 선택 플로우를 구현한다. 한국 고객 대상이며, 모든 UI 텍스트와 주석은 한국어로 작성한다. 브랜드명은 "카담" 또는 "CADAM"으로 표기한다.

## 기술 스택 (반드시 준수)
- Next.js 15 (App Router) + TypeScript
- Tailwind CSS (인라인 style 금지, CSS 파일 별도 생성 금지)
- Supabase (PostgreSQL + Auth)
- Zustand + persist middleware (상태 관리)
- Framer Motion (애니메이션)
- Vercel 배포
- Upstash Redis (Rate Limiting)

## 코딩 규칙

### 파일/폴더
- 컴포넌트: `src/components/` 하위에 PascalCase (예: StepLayout.tsx)
- 유틸리티: `src/lib/` 하위에 camelCase (예: leadScore.ts)
- 상수: `src/constants/` 하위 (예: vehicles.ts)
- 훅: `src/hooks/` 하위에 use 접두사 (예: useHydrated.ts)
- 페이지: `src/app/` 하위 Next.js App Router 규칙

### TypeScript
- any 타입 사용 금지. 반드시 명시적 타입 또는 인터페이스 정의
- 컴포넌트 props는 interface로 정의 (type 대신 interface 사용)
- 서버 컴포넌트와 클라이언트 컴포넌트를 명확히 구분 ('use client' 지시어)
- Next.js 15 환경이므로 동적 라우팅 페이지(page.tsx)나 메타데이터 생성 시 params 및 searchParams는 반드시 비동기(Promise)로 처리하고 await 하여 사용할 것

### Tailwind CSS
- **Tailwind CSS v4** 사용. `tailwind.config.ts` 파일 생성 금지.
- 색상/폰트는 `src/app/globals.css`의 `@theme inline` 블록에 CSS 변수로 선언 (이미 설정 완료). 임의로 변경하지 말 것.
- 색상 변수: `--color-primary`(#1B3A5C), `--color-accent`(#2E86C1), `--color-success`(#27AE60), `--color-warning`(#F39C12), `--color-danger`(#E74C3C), `--color-kakao`(#FEE500)
- Tailwind 클래스 사용 시: `bg-primary`, `text-accent`, `border-danger` 등으로 참조
- 모바일 퍼스트: 기본 스타일은 모바일, md: 이상에서 데스크톱 대응
- 인라인 style 속성 사용 금지 (모든 스타일은 Tailwind 클래스)

### 컴포넌트
- 함수형 컴포넌트만 사용 (클래스형 금지)
- 한 파일에 하나의 export default 컴포넌트
- 컴포넌트 내부 로직이 복잡하면 커스텀 훅으로 분리

### 데이터
- 차량 데이터는 반드시 `src/constants/vehicles.ts`의 VEHICLE_LIST 상수 사용
- 가격 데이터는 Supabase price_ranges 테이블에서 조회 (프론트엔드 수학 계산 금지)
- conditions JSON은 파싱만 하고 임의 계산 절대 금지

## 금지 사항
- CSS 모듈, styled-components, Emotion 등 CSS-in-JS 라이브러리 사용 금지
- pages/ 디렉토리 사용 금지 (App Router만 사용)
- 프론트엔드에서 leadScore 계산 금지 (서버사이드 API Route에서만 계산)
- localStorage 직접 접근 금지 (Zustand persist를 통해서만)
- console.log를 프로덕션 코드에 남기지 말 것
- 본 PRD에 명시되지 않은 폴더 구조나 파일을 임의로 생성하지 말 것
- kakao_sent 관련 로직 작성 금지 (Phase 2 전용)

## 디자인 가이드
- 폰트: Pretendard (font-display: swap, preload)
- 레이아웃: min-width 360px, max-width 1024px 중앙 정렬
- 카드: border-radius 12px, shadow 0 2px 8px rgba(0,0,0,0.08)
- 버튼: border-radius 8px, 최소 높이 48px (터치 영역)
- CTA 버튼: accent 배경, 흰색 텍스트, 전체 폭
- 여백: 넓게, 풀스크린 느낌 유지

## 주요 참고 파일
- PRD: @docs/PRD.md (전체 요구사항)
- 와이어프레임: @docs/wireframe.html (프론트엔드 퍼블리싱 시 이 파일의 레이아웃 구조, 색상, 간격, 컴포넌트 배치를 참고하되, 스타일은 반드시 Tailwind CSS 유틸리티 클래스로 구현할 것. 인라인 style이나 CSS 변수를 그대로 복사하지 말 것.)
- 차량 데이터: @src/constants/vehicles.ts
- 스토어: @src/store/quoteStore.ts

**주의:** 와이어프레임 파일 내부에 하드코딩된 차량 데이터(26종)는 UI 미리보기용이므로 무시할 것. 차량 데이터는 반드시 `src/constants/vehicles.ts`의 VEHICLE_LIST(45종)만 사용한다.

## 배포 규칙
코드 수정 완료 후 반드시 아래 안내 출력:
"✅ 수정 완료! 터미널에서 cadam-prod 실행하세요."
