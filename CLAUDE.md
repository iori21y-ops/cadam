# CLAUDE.md — cadam-web (렌테일러)

> 상위 규칙: `~/CLAUDE.md`, `~/projects/cadam/CLAUDE.md`.
> **운영·안전 규칙 전체**: `~/projects/cadam/docs/security.md` — destructive 작업 전 필독.

## ⚠️ 최우선 NEVER (상세는 docs/security.md §1)
1. **DROP TABLE / TRUNCATE 금지**
2. **WHERE 없는 DELETE / UPDATE 금지**
3. **`.env`, API 키 값 git 커밋·화면 출력 금지**

## 역할·기술스택
렌테일러(rentailor.co.kr) 메인 고객 웹앱. Next.js 15 App Router, Tailwind, Zustand, Supabase.

## Git 리포
- 로컬: `~/projects/cadam/cadam-web/.git`
- 리모트: `github.com/iori21y-ops/cadam.git`
- 커밋 메시지: 한국어 명령형 72자 이내
- push는 사용자 승인 후

## 주요 라우트
| 라우트 | 역할 |
|--------|------|
| `/` | 홈 |
| `/cars/[slug]` | 차량 상세 (`CarSpinViewer` 360° 뷰어) |
| `/quote` / `/result` | 견적 신청 |
| `/diagnosis` | 자동차 금융 진단 |
| `/simulator`, `/simulator/tco`, `/simulator/tax`, `/simulator/cost` | 시뮬레이터 (⚠️ 로컬 구현, 프로덕션 미커밋 → `docs/known-issues.md §2.2`) |
| `/privacy` | 개인정보처리방침 (12섹션) |
| `/admin` | 관리자 (⚠️ `/admin/finance` HIGH 이슈 — `docs/known-issues.md §2.1`) |
| `/api/*` | API Routes — 상세는 `docs/web-detail.md §7` |

## 핵심 규칙
- **환경변수**: `NEXT_PUBLIC_*` = 공개용만. `service_role` 같은 서버 전용 키는 반드시 `src/lib/api/security.ts`의 `requireServerApiKey()` 경유
- **성능**: LCP 2초 이내 목표, framer-motion은 `PageTransition mount gate` 이후 적용 (`docs/web-detail.md §11`)
- **차량 이미지 표준**: 940×515, 면적 45%, `priority`는 fold-above 단일 이미지만 (`docs/web-detail.md §9`)
- **브라우저 Supabase anon 클라이언트로 UPDATE/DELETE 금지** — 서버 API route(`service_role`) 경유
- **Supabase DDL은 Management API로만** — `cadam-dashboard/.env.local`의 `SUPABASE_ACCESS_TOKEN` 사용 (`docs/api-hub.md §7`)

## 상세 문서
| 주제 | 참조 |
|------|------|
| 라우트·컴포넌트·시뮬레이터·360뷰어·이미지·성능 | `docs/web-detail.md` |
| 운영·안전 규칙 전체 (NEVER/BEFORE/AFTER/ERROR/도구/RLS/보안) | `docs/security.md` |
| 알려진 이슈·폐기 명령어·HIGH 보안 이슈 | `docs/known-issues.md` |
| 인프라·n8n·OpenClaw·개발 명령어 | `docs/architecture.md` |

## 변경 이력
- 2026-04-23 (4차): CLAUDE.md 경량화 — 상세 내용을 `docs/*.md` 6개로 분리
- 이전 이력은 git log 참조 (`git log -- CLAUDE.md`)
