# ════════════════════════════════════════════════════════════════
# CLAUDE.md — CADAM 프로젝트 하네스 (Harness)
# ════════════════════════════════════════════════════════════════
# 이 파일은 Claude Code가 CADAM 프로젝트에서 작업할 때 따라야 할
# 모든 규칙, 도구 접근법, 검증 기준, 에러 처리 절차를 정의한다.
#
# 최종 업데이트: 2026-03-27
# 위치: /Users/kim/projects/cadam/cadam-web/CLAUDE.md
# ════════════════════════════════════════════════════════════════


# ────────────────────────────────────────────────────────────────
# 0. 세션 관리
# ────────────────────────────────────────────────────────────────

세션 용량 과다 또는 성능 저하 가능성이 감지되면:
1. 즉시 작업을 중단하고 메모리(project 타입)에 현재 상태를 저장한다
2. 사용자에게 새 세션을 열도록 안내하고 이어받을 컨텍스트 요약 메시지를 제공한다
→ 상세 절차는 `~/CLAUDE.md` 섹션 2 참조


# ────────────────────────────────────────────────────────────────
# 1. 프로젝트 개요
# ────────────────────────────────────────────────────────────────

## 1.1 비즈니스 컨텍스트
- 브랜드: CADAM (카담) — 장기렌터카 정보 제공 및 중개 서비스
- 핵심 가치: 고객에게 신뢰 기반의 투명한 장기렌터카 정보 제공
- 수익 모델: 장기렌터카 중개 (할부, 리스, 렌트, 현금 4가지 금융 상품)
- 타겟: 장기렌터카를 처음 알아보는 개인/소상공인

## 1.2 기술 스택
- 프론트엔드: Next.js 15 (App Router), Tailwind CSS, Zustand (상태관리)
- 백엔드/DB: Supabase (PostgreSQL) — 클라우드 호스팅
- AI/자동화: n8n (Docker), OpenClaw (멀티에이전트 8개), Ollama (LLM)
- 블로그: WordPress (Cafe24 호스팅 — 신규 셋업 예정), 네이버 블로그 (cadam-naver)
- 버전관리: GitHub (https://github.com/iori21y-ops/cadam.git)
- 인프라: Mac Mini M4 (메인), GPU 서버 (Windows, Tailscale VPN)


# ────────────────────────────────────────────────────────────────
# 2. 인프라 상세 맵
# ────────────────────────────────────────────────────────────────
#
# MECE 분류: 모든 시스템을 빠짐없이, 중복 없이 정의
# 각 시스템별로 [위치] [서비스] [접근법] [주요경로]를 기술
#

## 2.1 Mac Mini M4 (로컬 — 직접 접근)

### 2.1.1 사용자 정보
- 사용자명: kim
- 홈 디렉토리: /Users/kim
- 호스트명: gimgyeongnyeon-ui-Macmini

### 2.1.2 프로젝트 디렉토리
- cadam-web (메인 웹앱): /Users/kim/projects/cadam/cadam-web
  - Next.js 15, Tailwind, Zustand, Supabase
  - Git 연결: https://github.com/iori21y-ops/cadam.git
  - 환경변수: /Users/kim/projects/cadam/cadam-web/.env.local
- cadam-naver (네이버 블로그 자동발행): /Users/kim/projects/cadam/cadam-naver
  - Express.js + Playwright 기반 네이버 블로그 자동 포스팅 도구
  - 주요 파일: server.js, post-blog.js, config.json, naver-cookies.json

### 2.1.3 OpenClaw (멀티에이전트 시스템)
- 루트: /Users/kim/.openclaw/
- 메인 설정: /Users/kim/.openclaw/openclaw.json
- 에이전트 8개 (각각 독립 models.json 보유):
  | 에이전트 | models.json 경로 | 역할 |
  |---------|-----------------|------|
  | main | ~/.openclaw/agents/main/agent/models.json | 메인 오케스트레이터 |
  | writer | ~/.openclaw/agents/writer/agent/models.json | 콘텐츠 작성 |
  | scenario | ~/.openclaw/agents/scenario/agent/models.json | 시나리오 생성 |
  | creator | ~/.openclaw/agents/creator/agent/models.json | 콘텐츠 크리에이터 |
  | crawler | ~/.openclaw/agents/crawler/agent/models.json | 웹 크롤링 |
  | controller | ~/.openclaw/agents/controller/agent/models.json | 워크플로우 제어 |
  | customer-bot | ~/.openclaw/agents/customer-bot/agent/models.json | 고객 응대 |
  | coder | ~/.openclaw/agents/coder/agent/models.json | 코드 생성 |
- 워크스페이스: ~/.openclaw/workspace-{에이전트명}/ (각 에이전트별)
- 백업: ~/.openclaw/backups/
- 텔레그램 연동: ~/.openclaw/telegram/
- 크리덴셜: ~/.openclaw/credentials/ (읽기/수정 금지)
- 기존 백업 파일: openclaw.json.backup-*, openclaw.json.bak* 다수 존재

### 2.1.4 Ollama (로컬 LLM)
- 서비스: 로컬 실행
- 모델: glm4, cadam-writer, cadam-support
- 모델 저장소: ~/.ollama/models/

### 2.1.5 Docker
- n8n 컨테이너: downloads-n8n-1
- docker-compose 위치: /Users/kim/Downloads/docker-compose.yml
- n8n 데이터 볼륨: /Users/kim/Downloads/n8n_data/
- n8n 포트: 0.0.0.0:5678 → 5678/tcp
- 이미지: n8nio/n8n:latest, restart: always

### 2.1.6 SSH
- SSH 디렉토리: ~/.ssh/
- SSH 키: 미생성 (known_hosts만 존재)
- SSH config: 미존재 → PART 3에서 생성 필요

### 2.1.7 Tailscale
- 앱: /Applications/Tailscale.app (설치됨, 자동실행)
- CLI: /Applications/Tailscale.app/Contents/MacOS/Tailscale
- 용도: GPU 서버 VPN 연결

### 2.1.8 백업 디렉토리
- 사용자 백업: /Users/kim/backups/ (2026-03-20 백업 존재)
- OpenClaw 백업: /Users/kim/.openclaw/backups/

## 2.2 GPU 서버 (원격 — SSH 경유)

### 2.2.1 접속 정보
- OS: Windows
- Tailscale IP: 100.80.136.112
- 사용자: User
- 접속 방법: ssh gpu-server (alias — SSH config 설정 후)
- 현재 상태: SSH config 미설정으로 접속 불가 → PART 3에서 해결

### 2.2.2 서비스
- Ollama: glm4, qwen3:14b
- OpenClaw 관련 설정: 확인 필요 (SSH 연결 후)

### 2.2.3 접근 규칙
- 반드시 ssh gpu-server alias 경유 (IP 하드코딩 금지)
- Tailscale VPN이 연결되어 있어야 접근 가능
- Tailscale 상태 확인: /Applications/Tailscale.app/Contents/MacOS/Tailscale status

## 2.3 Supabase (클라우드 — MCP 경유)

### 2.3.1 접속 정보
- URL: https://xjceozajvggggzvpsrwo.supabase.co
- Project ID (project_ref): xjceozajvggggzvpsrwo
- 인증: MCP OAuth (브라우저 로그인) 또는 환경변수의 키 사용
- 환경변수 위치: /Users/kim/projects/cadam/cadam-web/.env.local
- ⚠️ .env.local의 키 값을 절대 출력하거나 로그에 남기지 말 것

### 2.3.2 테이블 구조 (주요 테이블)

> **정정 (2026-04-23)**: 현재 public 스키마에 **46개 테이블**이 존재. 아래는 고객 접점과 직접 관련된 8개 핵심 테이블만. 전체 목록은 `cadam-pipeline/CLAUDE.md`의 API 허브 테이블(`fuel_prices`, `ev_chargers`, `insurance_stats`) 포함해 Supabase Dashboard에서 확인.

| 테이블명 | 용도 | 비고 |
|---------|------|------|
| vehicle_settings | 차량 기본 설정 (slug, 썸네일, 가격범위, 표시순서, 노출여부) | 관리자 페이지에서 관리 |
| pricing | 차량별 월납입금 — 실제 견적가 수동입력 (vehicle_id FK, min_monthly, max_monthly, contract_months, annual_km, is_active) | |
| info_categories | 이용방법 카테고리 | display_order로 정렬 |
| info_articles | 이용방법 상세 글 | info_categories FK |
| consultations | 상담 신청 데이터 | 고객 접수 |
| diagnosis_config | 자동차 금융 진단 모듈 설정 | /diagnosis 라우트용 |
| notification_log | 알림 발송 이력 | |
| promotions | 프로모션/이벤트 | |

### 2.3.3 접근 규칙
- 조회(SELECT): MCP를 통해 자유 실행
- 변경(INSERT/UPDATE/DELETE): 반드시 사전 확인 절차 (섹션 4.3 참조)
- DDL(CREATE/ALTER/DROP TABLE): **사용자 승인 후** Supabase Management API로 실행 가능
  → `cadam-dashboard/.env.local`의 `SUPABASE_ACCESS_TOKEN`(sbp_...)와 `SUPABASE_PROJECT_REF` 사용
  → `POST https://api.supabase.com/v1/projects/{ref}/database/query` 에 SQL 전송
  → 상세 가이드는 `cadam-pipeline/CLAUDE.md`의 "Supabase DDL 실행 방법" 섹션 참조
  → **DROP/TRUNCATE는 여전히 금지** (섹션 3.1)

## 2.4 n8n (Docker — REST API 경유)

### 2.4.1 접속 정보
- API 엔드포인트: http://localhost:5678/api/v1
- 인증 헤더: -H "X-N8N-API-KEY: $N8N_API_KEY"
- 환경변수: N8N_API_KEY (쉘에 이미 설정됨)
- ⚠️ API 키 값을 절대 출력하지 말 것 — $N8N_API_KEY 변수명으로만 참조

### 2.4.2 API 레퍼런스
```
# 워크플로우 CRUD
GET    $N8N_API_URL/workflows                     # 전체 목록
GET    $N8N_API_URL/workflows/{id}                # 상세 조회
PUT    $N8N_API_URL/workflows/{id}                # 수정 (전체 JSON)
PATCH  $N8N_API_URL/workflows/{id}                # 부분 수정
POST   $N8N_API_URL/workflows/{id}/run            # 수동 실행
DELETE $N8N_API_URL/workflows/{id}                # 삭제 (금지)

# 실행 이력
GET    $N8N_API_URL/executions                    # 전체 이력
GET    $N8N_API_URL/executions?workflowId={id}    # 워크플로우별 이력

# 모든 요청에 헤더 필수:
# -H "X-N8N-API-KEY: $N8N_API_KEY" -H "Content-Type: application/json"
```

### 2.4.3 워크플로우 목록 (11개, 2026-03-27 기준 모두 inactive)
| ID | 이름 | 상태 | 용도 |
|----|------|------|------|
| 85oCvUHvP9AdM7Cb | GS→Supabase 이용방법동기화 | inactive | Google Sheets→info 테이블 동기화 |
| C9s2T7fls85OtBho | GS→Supabase 가격동기화 | inactive | Google Sheets→price_ranges 동기화 |
| Hg5vDOF3ZPnodQvI | 연결테스트 | inactive | API/서비스 연결 테스트용 |
| Kn9W93kFwp5rZ0e5 | 텔레그램 명령어 처리 copy | inactive | 텔레그램 봇 명령어 (복사본) |
| RWupOiaxoIWow4zA | 텔레그램 명령어 처리 | inactive | 텔레그램 봇 명령어 (원본) |
| WcFX9tRkNlT0Evtu | 카담 9일차 — 콘텐츠 생성 후반부 | inactive | AI초안→검수→CTA→저장 |
| XmXKfg2T41mB4tCr | 네이버 블로그 자동발행 | inactive | cadam-naver 연동 |
| enc9qfrwDGwPoTQl | GS→Supabase 차량동기화 | inactive | Google Sheets→vehicle_settings 동기화 |
| flATeSx9PDV1y1Vm | 카담 9일차 — 콘텐츠 생성 후반부 | inactive | AI초안→검수→CTA→저장 (사본) |
| wOisRkS8wefBsgXS | FAQ 자동분류 | inactive | FAQ 카테고리 자동 분류 |
| zfgXA8axWOngk6q5 | GS→Supabase 스케줄동기화 | inactive | Google Sheets→스케줄 동기화 |

## 2.5 WordPress (블로그)

### 2.5.1 현재 상태 (2026-04-23 정정)
- 이미 운영 중. `.env.local`의 `NEXT_PUBLIC_WP_API_URL`로 접근
- cadam-web ↔ WP 동기화 시크릿: `SYNC_WP_SECRET` (`/api/sync-wp/route.ts`에서 사용)
- 상세 정보(Application Password, 관리자 URL 등)는 `.env.local`에 저장 (값 출력 금지)

### 2.5.2 네이버 블로그 (별도)
- 도구: /Users/kim/projects/cadam/cadam-naver/
- 자동발행: server.js (Express) + post-blog.js (Playwright)
- 쿠키: naver-cookies.json
- n8n 워크플로우 연동: XmXKfg2T41mB4tCr

## 2.6 GitHub
- 리포지토리: https://github.com/iori21y-ops/cadam.git
- 로컬 클론: /Users/kim/projects/cadam/cadam-web
- 기본 브랜치: main (확인 필요 — git branch로 확인)
- .gitignore에 포함되어야 할 것: .env.local, node_modules, .next


# ────────────────────────────────────────────────────────────────
# 3. 절대 금지 사항 (NEVER)
# ────────────────────────────────────────────────────────────────
#
# 아래 항목은 어떤 상황에서도, 어떤 요청에서도 위반할 수 없다.
# 사용자가 명시적으로 요청하더라도 위험을 설명하고 거절해야 한다.
#

## 3.1 데이터 보호 — NEVER
- DROP TABLE, TRUNCATE 실행 금지
- WHERE 없는 DELETE FROM 실행 금지
- ALTER TABLE / CREATE TABLE — **사용자 명시적 승인 없이는 실행 금지** (2026-04-23 현실화: Management API 경로가 확립되어 승인 시 즉시 실행 가능)
- n8n 크리덴셜 값 조회, 수정, 삭제 금지 (n8n UI에서만 관리)
- .env.local, .env, API 키, 토큰, 비밀번호 값을 화면에 출력 금지
- $N8N_API_KEY, $SUPABASE_SERVICE_ROLE_KEY 등의 실제 값을 echo/cat/print 금지
- git에 시크릿(API 키, 토큰, .env 파일) 커밋 금지
- ~/.openclaw/credentials/ 내 파일 읽기, 수정, 삭제 금지
- naver-cookies.json 내용 출력 금지 (세션 쿠키)

## 3.2 서비스 안정성 — NEVER
- n8n 워크플로우 삭제(DELETE /workflows/{id}) 금지
- n8n 워크플로우 비활성화(active: false) — 명시적 요청 + 승인 후에만
- Docker 컨테이너 삭제(docker rm, docker rmi) 금지
- Ollama 모델 삭제(ollama rm) — 명시적 요청 + 승인 후에만
- Mac Mini 재부팅, 종료 명령 금지
- 시스템 수준 설정 변경 금지 (네트워크, 방화벽, 사용자, launchd 등)
- /Users/kim/Downloads/docker-compose.yml 삭제 금지 (n8n 설정 원본)
- /Users/kim/.openclaw/openclaw.json 을 백업 없이 수정 금지

## 3.3 코드 안전성 — NEVER
- main 브랜치에 force push (--force, --force-with-lease) 금지
- git reset --hard 금지
- node_modules, .next, __pycache__ 를 git에 커밋 금지
- 테스트 없이 프로덕션 배포 금지

## 3.4 접근 경로 — NEVER
- GPU 서버에 IP 직접 입력 금지 — 반드시 ssh gpu-server alias 사용
- Supabase에 psql 등으로 직접 PostgreSQL 접속 시도 금지 — MCP만 사용
- n8n UI를 자동화(Playwright 등)로 조작 시도 금지 — REST API만 사용
- /etc, /usr, /var, /System 등 시스템 디렉토리 수정 금지
- 다른 사용자 홈 디렉토리 접근 금지

## 3.5 파일 삭제 — NEVER
- rm -rf 명령 금지 (어떤 경로에서든)
- rm -r 명령 금지 (디렉토리 재귀 삭제)
- 단일 파일 rm은 프로젝트 디렉토리 내 임시 파일에 한해서만 허용
- ~/.openclaw/ 하위 파일 삭제 금지 (명시적 요청 + 승인 제외)

## 3.6 가격 표시 체계 (2026-04-17 확정)

### 현재 방식: 수동 견적가 입력
- pricing 테이블에 실제 캐피탈사 견적가를 수동 입력
- 인기차종 기본 표시 조건: 60개월 / 연 1만km / 보증금 0%
- price.min > 0 → "월 N만원~" 표시 (PopularEstimatesClient.tsx:109)
- 가격 없음 → "견적 문의" 표시
- 코드가 조회하는 테이블은 pricing (CLAUDE.md 기존 기록 price_ranges는 오류였음)

### pricing 테이블 컬럼
- vehicle_id: vehicles 테이블 FK
- min_monthly: 최저 월 렌탈료 (만원 단위)
- max_monthly: 최고 월 렌탈료 (만원 단위, 트림별 차이)
- contract_months: 60 (기본값)
- annual_km: 10000 (기본값)
- is_active: true

### 향후 계획: PMT 자동 계산 (보류)
- PMT 공식 기반 자동 계산은 잔존가치 데이터 확보 후 구현
- 실제 견적서에서 잔존가치율 역산 → 차급별 잔존가치 테이블 구축 → PMT 자동화
- 프로토타입: cadam_pricing_engine.jsx v0.2 존재
- PMT 공식: PMT(월금리, N, -(취득원가-보증금), 잔존가치-보증금)


# ────────────────────────────────────────────────────────────────
# 4. 작업 전 필수 절차 (BEFORE)
# ────────────────────────────────────────────────────────────────
#
# 모든 변경 작업(읽기 전용 제외) 전에 반드시 수행해야 할 절차.
# "변경"이란 파일 수정, 데이터 INSERT/UPDATE/DELETE, 서비스 재시작,
# git commit/push 등 상태를 바꾸는 모든 행위를 말한다.
#

## 4.1 공통 절차 (모든 변경 작업)
1. 변경 대상의 현재 상태를 조회하고 출력한다
2. 변경 내용을 사용자에게 요약한다
3. 되돌릴 수 있는 방법(롤백)을 확인한다
4. 사용자 승인을 받는다 (단순 조회, 백업 생성, git status 등은 제외)

## 4.2 설정 파일 변경
대상: models.json (8개), openclaw.json, docker-compose.yml, .env.local, config.json 등

절차:
1. cat 으로 현재 내용 확인
2. 백업 생성:
   - OpenClaw 관련: cp {파일} ~/.openclaw/backups/{파일명}_$(date +%Y%m%d_%H%M%S).bak
   - 기타: cp {파일} ~/backups/config/{파일명}_$(date +%Y%m%d_%H%M%S).bak
3. 백업 디렉토리 없으면 자동 생성: mkdir -p {해당 디렉토리}
4. 수정 실행
5. diff 로 변경 내용 확인

models.json 특별 규칙:
- 8개 에이전트 각각 독립 파일이므로 어떤 에이전트의 파일을 수정하는지 명확히 지정
- 폴백 순서를 변경할 때 기존 순서를 먼저 출력하고 변경안을 제시
- 여러 에이전트의 models.json을 동시에 수정해야 하면 하나씩 순서대로 처리

openclaw.json 특별 규칙:
- 이미 백업 파일이 다수 존재 (backup-*, .bak.1~4)
- 새 백업은 ~/.openclaw/backups/ 에 타임스탬프로 생성
- 수정 후 JSON 문법 검증 필수: python3 -m json.tool ~/.openclaw/openclaw.json

## 4.3 Supabase 데이터 변경

### INSERT (데이터 추가)
1. 삽입할 데이터를 사용자에게 테이블 형태로 보여주기
2. 대상 테이블의 현재 행 수 확인 (SELECT COUNT)
3. 승인 받기
4. 실행

### UPDATE (데이터 수정)
1. WHERE 조건으로 영향 받는 행을 SELECT 로 먼저 조회
2. SELECT COUNT 로 영향 행 수 확인
3. 변경 전/후 값을 대조 테이블로 보여주기
4. 승인 받기
5. 실행

### DELETE (데이터 삭제)
1. WHERE 조건 필수 — 조건 없는 DELETE 절대 금지
2. 삭제 대상을 SELECT 로 먼저 보여주기
3. 승인 받기
4. 실행

### 대량 변경 (10행 이상)
- 행 수와 영향 범위를 명시적으로 보고
- 반드시 사용자 승인 필요
- 가능하면 배치 단위(5~10행)로 나눠 실행

## 4.4 n8n 워크플로우 변경
1. GET /workflows/{id} 로 현재 JSON 조회
2. JSON 백업:
   ```
   curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" \
     http://localhost:5678/api/v1/workflows/{id} \
     > ~/backups/n8n/workflow_{id}_$(date +%Y%m%d_%H%M%S).json
   ```
3. 백업 디렉토리 없으면: mkdir -p ~/backups/n8n
4. 변경 내용 요약 후 승인 받기
5. PUT/PATCH 로 수정 실행
6. 수정 후 active 상태 확인

## 4.5 Git 작업
1. git status 로 변경 파일 목록 확인
2. git diff 로 변경 내용 확인
3. 커밋 메시지 규칙:
   - 한국어, 명령형, 72자 이내
   - 예: "pricing 테이블에 신규 차량 3종 추가"
   - 예: "writer 에이전트 models.json 폴백 모델 변경"
4. push 전 git log --oneline -5 로 최근 커밋 확인
5. push 는 사용자 승인 후 실행

## 4.6 SSH 원격 작업 (GPU 서버)
1. Tailscale 연결 확인:
   /Applications/Tailscale.app/Contents/MacOS/Tailscale status | grep 100.80.136.112
2. SSH 연결 테스트: ssh gpu-server "echo ok"
3. 파일 수정 시 원격에서도 백업 생성 후 수정
4. 장시간 작업은 피하고 단일 명령 단위로 실행:
   ssh gpu-server "{명령1} && {명령2}"

## 4.7 Docker 작업
1. docker ps 로 현재 컨테이너 상태 확인
2. docker-compose.yml 수정 시 백업 필수:
   cp /Users/kim/Downloads/docker-compose.yml ~/backups/config/docker-compose_$(date +%Y%m%d_%H%M%S).yml
3. 컨테이너 재시작 시 승인 필요
4. 재시작 후 docker ps 로 상태 확인


# ────────────────────────────────────────────────────────────────
# 5. 작업 후 검증 절차 (AFTER)
# ────────────────────────────────────────────────────────────────
#
# 모든 변경 작업 후 반드시 수행해야 할 검증.
# 검증을 통과하지 못하면 롤백하고 사용자에게 보고한다.
#

## 5.1 Supabase 데이터 변경 후
- [ ] SELECT 로 변경된 데이터 확인
- [ ] 행 수 확인 (의도한 수만큼 변경되었는지)
- [ ] FK 관계 테이블 정합성 확인:
  - info_articles → info_categories (category_id)
  - price_ranges → vehicle_settings (car_brand + car_model 매칭)

## 5.2 n8n 워크플로우 변경 후
- [ ] GET /workflows/{id} 로 상태 조회
- [ ] active 필드 확인 (의도한 상태와 일치하는지)
- [ ] 변경된 노드의 설정값 JSON에서 확인
- [ ] 가능하면 테스트 실행: POST /workflows/{id}/run
- [ ] 실행 이력 확인: GET /executions?workflowId={id}&limit=1

## 5.3 설정 파일 변경 후
- [ ] cat 으로 변경된 내용 확인
- [ ] JSON 파일이면 문법 검증:
  python3 -m json.tool {파일} > /dev/null && echo "JSON OK" || echo "JSON ERROR"
- [ ] 관련 서비스 health check:
  | 변경 대상 | 검증 명령 |
  |----------|----------|
  | Ollama 관련 | ollama list |
  | Docker 관련 | docker ps |
  | n8n 관련 | curl -s -H "X-N8N-API-KEY: $N8N_API_KEY" http://localhost:5678/api/v1/workflows \| head -5 |
  | OpenClaw 관련 | python3 -m json.tool ~/.openclaw/openclaw.json > /dev/null |
  | GPU 서버 | ssh gpu-server "ollama list" |

## 5.4 Ollama 모델 관련 작업 후
- [ ] ollama list 로 모델 목록 확인
- [ ] 모델 추가 시: ollama run {모델명} "테스트" 로 응답 확인
- [ ] GPU 서버: ssh gpu-server "ollama list"

## 5.5 Git 작업 후
- [ ] git status — clean 상태 확인 (uncommitted 변경 없음)
- [ ] git log --oneline -3 — 커밋 이력 확인
- [ ] push 후: git log --oneline origin/main -3 — 원격 동기화 확인

## 5.6 Docker 작업 후
- [ ] docker ps — 컨테이너 상태 (Up, 포트 매핑)
- [ ] n8n 재시작 시: curl -s http://localhost:5678 > /dev/null && echo "n8n OK" || echo "n8n DOWN"

## 5.7 SSH 원격 파일 변경 후
- [ ] ssh gpu-server "cat {변경 파일}" 로 내용 확인
- [ ] 관련 서비스 상태 확인


# ────────────────────────────────────────────────────────────────
# 6. 에러 처리 절차 (ERROR)
# ────────────────────────────────────────────────────────────────

## 6.1 공통 원칙
- 에러 발생 시 즉시 작업 중단
- 에러 메시지 전체를 사용자에게 보고
- 자동 재시도: 최대 2회 (총 3회 시도)
- 3회 실패: 작업 중단, 원인 분석 보고
- 롤백 가능하면 롤백 방법 제시 (자동 롤백은 하지 않음 — 사용자 승인 필요)

## 6.2 시스템별 에러 대응

### Supabase
| 에러 | 대응 |
|------|------|
| 쿼리 문법 에러 | 에러 메시지 보고, 수정된 쿼리 제안 |
| 권한 에러 (403) | MCP 인증 확인 안내 (/mcp 명령) |
| 타임아웃 | 쿼리 분할 실행 제안 |
| FK 위반 | 참조 테이블 데이터 확인, 올바른 순서 제안 |
| unique 위반 | 중복 데이터 조회, 기존 데이터와 비교 제시 |

### n8n API
| 에러 | 대응 |
|------|------|
| 401 Unauthorized | echo $N8N_API_KEY 로 설정 확인 (값은 출력 금지, 설정 여부만) |
| 404 Not Found | 워크플로우 ID 확인 — 전체 목록 재조회 |
| 500 Internal | docker ps, docker logs downloads-n8n-1 --tail 20 |
| ECONNREFUSED | Docker 컨테이너 확인: docker ps \| grep n8n |
| 응답 없음 | docker restart downloads-n8n-1 제안 (승인 후) |

### SSH / GPU 서버
| 에러 | 대응 |
|------|------|
| Connection refused | Tailscale 확인: /Applications/Tailscale.app/Contents/MacOS/Tailscale status |
| Timeout | GPU 서버 전원 상태 확인 불가 — 사용자에게 수동 확인 요청 |
| Permission denied | SSH 키 확인: ls -la ~/.ssh/, ssh -v gpu-server |
| Host key changed | known_hosts 에서 해당 항목 제거 제안 (승인 후) |
| 명령 실행 실패 | Windows 경로/명령어 차이 확인 (예: \\ vs /, cmd vs bash) |

### Docker
| 에러 | 대응 |
|------|------|
| 컨테이너 미실행 | docker ps -a, docker start downloads-n8n-1 제안 |
| 포트 충돌 | docker ps 로 5678 포트 사용 중인 프로세스 확인 |
| 디스크 부족 | docker system df 후 정리 제안 (승인 필요) |
| 이미지 pull 실패 | 네트워크 확인, 수동 pull 제안 |

### Ollama
| 에러 | 대응 |
|------|------|
| 모델 미존재 | ollama list 확인, ollama pull 제안 (승인 후) |
| 메모리 부족 | 실행 중 모델 확인, 언로드 제안 |
| 서비스 미실행 | ollama serve 또는 재시작 제안 |

### Git
| 에러 | 대응 |
|------|------|
| merge conflict | 충돌 파일 목록 + 내용 보고, 자동 해결 시도 금지 |
| push rejected | git pull --rebase 제안 (자동 실행 금지, 승인 필요) |
| detached HEAD | 상태 보고 + 복구 방안 제시 |


# ────────────────────────────────────────────────────────────────
# 7. 도구 사용 규칙 (HOW)
# ────────────────────────────────────────────────────────────────
#
# 각 도구별로 [자유 실행] [승인 후 실행] [금지] 를 구분
#

## 7.1 Supabase (MCP)
| 동작 | 레벨 | 조건 |
|------|------|------|
| SELECT | 자유 | |
| INSERT | 승인 후 | 데이터 내용 사전 제시 |
| UPDATE | 승인 후 | WHERE 필수, 영향 행수 사전 확인 |
| DELETE | 승인 후 | WHERE 필수, 삭제 대상 사전 제시 |
| CREATE TABLE | 승인 후 | Management API 경로 문서화됨 (섹션 2.3.3) |
| ALTER TABLE | 승인 후 | ADD COLUMN / RLS ENABLE / CREATE POLICY 등 보안 강화 목적 허용. DROP COLUMN은 추가 경고 필요 |
| DROP TABLE | 금지 | |
| TRUNCATE | 금지 | |

## 7.2 n8n (REST API)
| 동작 | 레벨 | 조건 |
|------|------|------|
| GET (조회) | 자유 | |
| PUT/PATCH (수정) | 승인 후 | 변경 전 JSON 백업 필수 |
| POST run (실행) | 승인 후 | 테스트 목적 명시 |
| DELETE workflow | 금지 | 비활성화로 대체 |
| 크리덴셜 조회/수정 | 금지 | n8n UI에서만 |

## 7.3 Ollama (CLI)
| 동작 | 레벨 | 조건 |
|------|------|------|
| ollama list | 자유 | |
| ollama run (테스트) | 자유 | 간단한 프롬프트만 |
| ollama pull | 승인 후 | 대용량 다운로드 |
| ollama rm | 승인 후 | 명시적 요청 시에만 |
| ollama serve | 승인 후 | 서비스 영향 |

## 7.4 Docker (CLI)
| 동작 | 레벨 | 조건 |
|------|------|------|
| docker ps, logs, inspect | 자유 | |
| docker restart | 승인 후 | |
| docker stop | 승인 후 | 이유 설명 필수 |
| docker start | 승인 후 | |
| docker rm, rmi | 금지 | |
| docker-compose up/down | 승인 후 | |
| docker system prune | 승인 후 | |

## 7.5 파일 시스템 (bash)
| 동작 | 레벨 | 조건 |
|------|------|------|
| 읽기 (cat, less, head, tail, find, grep, ls) | 자유 | |
| 수정 (sed, echo >>, 직접 편집) | 승인 후 | 백업 생성 후 |
| 생성 (touch, mkdir) | 자유 | 프로젝트 디렉토리 내 |
| 단일 파일 삭제 (rm) | 승인 후 | 임시 파일에 한해 |
| 디렉토리 삭제 (rm -r) | 금지 | |
| 권한 변경 (chmod, chown) | 금지 | |
| 시스템 디렉토리 수정 | 금지 | |

## 7.6 Git (CLI)
| 동작 | 레벨 | 조건 |
|------|------|------|
| status, log, diff, branch, show | 자유 | |
| add, commit | 자유 | 변경 내용 확인 후 |
| checkout, switch | 자유 | |
| push | 승인 후 | |
| merge | 승인 후 | conflict 시 자동 해결 금지 |
| pull | 자유 | |
| rebase | 승인 후 | |
| reset --hard | 금지 | |
| force push | 금지 | |

## 7.7 SSH (원격 접속)
| 동작 | 레벨 | 조건 |
|------|------|------|
| 단일 명령 실행 | 자유 | ssh gpu-server "{cmd}" 형태 |
| 파일 조회 | 자유 | |
| 파일 수정 | 승인 후 | 원격 백업 생성 후 |
| 서비스 재시작 | 승인 후 | |
| 시스템 설정 변경 | 금지 | |


# ────────────────────────────────────────────────────────────────
# 8. 자동화 파이프라인 컨텍스트
# ────────────────────────────────────────────────────────────────
#
# 현재 운영 중이거나 개발 중인 자동화 흐름에 대한 도메인 지식.
# 이 정보를 알아야 수정 요청 시 전체 파이프라인에 미치는 영향을 판단할 수 있다.
#

## 8.1 블로그 자동화 파이프라인 (n8n 9~10일차)
- 흐름: Kimi 초안 → Gemini 폴백 → Claude 검수(Sonnet 4) + SEO → CTA/UTM 삽입 → Supabase 저장 → WP 발행 → Telegram 알림
- 검수 모델: claude-sonnet-4-20250514 (n8n 워크플로우에서 직접 호출)
- 관련 워크플로우: WcFX9tRkNlT0Evtu, flATeSx9PDV1y1Vm
- 10일차 남은 작업: WP 호스팅 → Application Password → n8n Credential → WP발행노드 → Supabase 업데이트 → Telegram 알림 → 테스트
- ⚠️ 이 파이프라인의 모델 설정 변경 시 n8n 워크플로우와 OpenClaw models.json 양쪽 확인 필요

## 8.2 OpenClaw 에이전트 구성
- 에이전트별 models.json에 정의된 모델과 폴백 순서가 있음
- Moonshot 프로바이더 제거 완료, HuggingFace 축소 완료
- anthropic 프로바이더 제거됨 (검수는 n8n 전용)
- writer/scenario에 Qwen3-235B-A22B-Instruct-2507 (HF) 추가 완료
- Mac Mini Ollama: glm4, cadam-writer, cadam-support
- GPU 서버 Ollama: glm4, qwen3:14b
- ⚠️ models.json 수정 시 기존 폴백 순서를 먼저 확인하고 유지해야 함

## 8.3 데이터 동기화 파이프라인
- Google Sheets → Supabase 동기화 (3개 워크플로우):
  - 차량 동기화 (enc9qfrwDGwPoTQl) → vehicle_settings
  - 가격 동기화 (C9s2T7fls85OtBho) → price_ranges
  - 이용방법 동기화 (85oCvUHvP9AdM7Cb) → info_categories / info_articles
  - 스케줄 동기화 (zfgXA8axWOngk6q5)
- ⚠️ Supabase 테이블 스키마를 변경하면 이 동기화 워크플로우도 업데이트 필요

## 8.4 고객 소통 파이프라인
- 텔레그램 봇: ~/.openclaw/telegram/ 에서 관리
- n8n 워크플로우: RWupOiaxoIWow4zA (원본), Kn9W93kFwp5rZ0e5 (복사본)
- FAQ 자동분류: wOisRkS8wefBsgXS
- 상담 데이터: Supabase consultations 테이블


# ────────────────────────────────────────────────────────────────
# 9. 보고 및 커뮤니케이션 규칙
# ────────────────────────────────────────────────────────────────

## 9.1 작업 완료 보고
```
✅ 작업 완료
- 대상: {무엇을 변경했는지}
- 변경 내용: {구체적 변경 사항}
- 검증 결과: {섹션 5의 체크리스트 수행 결과}
- 주의사항: {후속 작업, 다른 시스템 영향 등}
```

## 9.2 에러 보고
```
❌ 에러 발생
- 작업: {시도한 작업}
- 에러: {에러 메시지 전문}
- 원인 분석: {추정 원인}
- 시도한 해결: {재시도 횟수 및 방법}
- 제안: {다음 단계}
```

## 9.3 승인 요청
```
⚠️ 승인 필요
- 작업: {실행하려는 작업}
- 영향 범위: {어떤 데이터/서비스에 영향}
- 변경 전: {현재 상태}
- 변경 후: {예상 상태}
- 롤백 방법: {문제 시 복원 방법}
→ 진행할까요? (Y/N)
```

## 9.4 언어 규칙
- 모든 보고와 대화: 한국어
- 코드, 명령어, 에러 메시지: 원문(영어) 그대로 포함
- 커밋 메시지: 한국어, 명령형
- 파일명: 영어 (한국어 파일명 금지)


# ────────────────────────────────────────────────────────────────
# 10. 의사결정 원칙
# ────────────────────────────────────────────────────────────────

## 10.1 우선순위: 안전 > 정확 > 속도
1. 데이터 손실 방지가 최우선
2. 정확한 결과 > 빠른 결과
3. 확실하지 않으면 실행하지 말고 질문

## 10.2 판단이 애매한 경우
- 여러 해석이 가능한 요청 → 가장 안전한 해석, 사용자에게 확인
- 부작용이 예상되는 작업 → 부작용 설명 후 승인 받기
- 이전 작업 맥락이 필요할 때 → git log, n8n 실행 이력, 백업 파일 확인
- 여러 시스템에 걸친 변경 → 영향 범위 전체를 나열하고 순서 제안

## 10.3 범위 밖 요청
- CADAM과 무관한 시스템 변경 → 거절, 이유 설명
- 프로덕션 배포 → 가이드 제공만, 직접 실행 금지
- 외부 서비스(AWS, GCP 등) → 안내만 제공


# ────────────────────────────────────────────────────────────────
# 11. 백업 정책
# ────────────────────────────────────────────────────────────────

## 11.1 백업 디렉토리 구조
```
~/backups/
├── n8n/           # 워크플로우 JSON 백업
├── openclaw/      # models.json, openclaw.json 등 (또는 ~/.openclaw/backups/ 사용)
├── config/        # docker-compose.yml, .env 등
├── supabase/      # 데이터 export (필요 시)
└── gpu-server/    # GPU 서버 설정 백업
```

## 11.2 네이밍 규칙
{원본파일명}_{YYYYMMDD}_{HHMMSS}.bak
예: models.json_20260327_143052.bak
예: workflow_WcFX9tRkNlT0Evtu_20260327_143052.json

## 11.3 자동 생성
작업 시작 시 백업 디렉토리가 없으면:
mkdir -p ~/backups/{n8n,openclaw,config,supabase,gpu-server}

## 11.4 기존 백업 보존
- ~/.openclaw/ 에 이미 존재하는 .bak, .backup-* 파일들은 삭제하지 않는다
- ~/backups/2026-03-20/ 에 기존 백업이 존재함 — 삭제 금지


# ────────────────────────────────────────────────────────────────
# 13. 보안 아키텍처 (2026-04-23~)
# ────────────────────────────────────────────────────────────────

## 13.1 환경변수 분리
- `NEXT_PUBLIC_*` = 공개용만 (Supabase URL, anon key, GA ID, 전화번호 등)
- `NEXT_PUBLIC_` 접두사 없는 변수 = 서버 전용 (service_role, Resend, Upstash, 캐피탈사 키 등)
- 템플릿: `.env.local.example` (실제 키 미포함, gitignore 예외로 추가 여부 검토)
- 서버 전용 키 접근은 반드시 `src/lib/api/security.ts`의 `requireServerApiKey(name)` 경유
  → `NEXT_PUBLIC_*` 이름 전달 시 예외 throw (실수 방지)

## 13.2 API 보안 미들웨어
위치: `src/lib/api/security.ts`
- `applyRateLimit(req)` — Upstash Redis 기반 분산 rate limit (IP당 60초 내 3회)
- `requireServerApiKey(envName)` — 서버 환경변수 접근 (NEXT_PUBLIC_* 거부)
- `secureError(err, status)` — 스택·내부 경로 노출 없는 표준 에러 응답
- `allowCors(req, res)` / `handleCorsPreflight(req)` — rentailor.co.kr + *.vercel.app + localhost만 허용

기존 `src/lib/rateLimit.ts`는 재활용되므로 삭제하지 말 것.

## 13.3 API Route 구조 원칙
- 프론트 → `/api/*` (서버) → 외부 API (캐피탈사 등)
- 외부 API 키는 **절대** `NEXT_PUBLIC_*`에 넣지 않음
- 브라우저 Supabase 클라이언트(anon)로 UPDATE/DELETE 금지 — 서버 API route 경유 (service_role)
- rate limiting: 모든 외부 API 중계/리드 수집 엔드포인트에 필수 적용

## 13.4 캐피탈사 API 연동 준비
- 라우트 템플릿: `src/app/api/rental-price/route.ts` (현재 501 반환)
- 확정 시 3단계 블록(캐피탈사 API 호출)만 구현하면 프론트 무수정
- 환경변수 자리: `CAPITAL_API_KEY`, `CAPITAL_API_SECRET`, `CAPITAL_API_BASE_URL`

## 13.5 Supabase RLS
- 공개 데이터 테이블 (`vehicles`, `pricing`, `fuel_prices`, `ev_chargers`, `insurance_stats`, `info_articles` 등): `anon`/`authenticated` SELECT 허용, `service_role` ALL
- 리드/개인정보 테이블 (`consultations`, `diagnosis_logs`): `anon` INSERT만, `authenticated` SELECT만
- 내부 관리 테이블 (`used_pexels_photos`, `cadam_*`, `gs_sync_log` 등): `service_role`만

### 🚨 HIGH 미해결 이슈 — `finance_rates`
`admin/finance/page.tsx`가 브라우저 anon 클라이언트로 `.update()`를 직접 호출.
→ 지금 RLS 켜면 관리자 저장 기능 깨짐.
**해결 순서**: admin 페이지를 서버 API route(`service_role`)로 리팩토링 → 그 후 RLS ENABLE + anon SELECT만 허용.

## 13.6 개인정보처리방침
- 경로: `src/app/privacy/page.tsx` (12개 섹션, 시행 2026-04-23)
- 개인정보보호 책임자 이메일: `cadam21y@gmail.com`
- 제3자 제공 조항: 캐피탈사 견적 요청 시 사전 동의 기반
- 상수: `src/constants/brand.ts`의 `BRAND.privacy.title/description` 재활용


# ────────────────────────────────────────────────────────────────
# 14. 주요 기능·라우트 현황 (2026-04-23)
# ────────────────────────────────────────────────────────────────

## 14.1 시뮬레이터 (src/app/simulator/)
2026-04-23 기준 로컬에 구현되어 있으나 **cadam-web git에 미커밋** → 프로덕션 404. NEXT_ACTIONS A안(최우선)이 "git 커밋 + push + Vercel 배포".

| 라우트 | 역할 | 상태 |
|--------|------|------|
| `/simulator` | 시뮬레이터 허브 — TCO/세무/유지비 선택 진입점 | 로컬 구현됨 |
| `/simulator/tco` | A1 TCO(총소유비용) — 렌트/리스/할부/현금 5년 누적 비교 | 계획, 프로토타입 분리 |
| `/simulator/tax` | A2 사업자 세무 절세 — 5단계 질문 → 절세금액 | 로컬 구현됨 |
| `/simulator/cost` | 유지비 — 유류비/보험/정비 5년 누적 | 로컬 구현됨 |

### 알려진 이슈
- `simulator/page.tsx` — `metadata` export 없음 (SEO 제목/설명 누락)
- `cost/page.tsx:395` — `PHASE_KEY_MAP` 미사용 변수 lint 경고
- `/diagnosis` 페이지 콘솔 406 에러 (외부 API) — 별도 조사 항목

## 14.2 차량 360° 회전 뷰어 — `CarSpinViewer`
- 컴포넌트: 차량 상세페이지(`/cars/[slug]`)에 탑재
- **이미지 소스**: Supabase Storage (2026-04-23 이전: 공개 URL → 이후: Storage 이관)
- 구현: Canvas 방식 (이전 `<img>` 드래그가 끊김 → Canvas로 전환해 해소)
- 첫 프레임 즉시 표시로 체감 로딩 개선
- 차종별 시작 각도 보정 필요 시 `spinStartFrame` 파라미터 사용 (예: 그랜저 9)

## 14.3 차량 대표 이미지 표준
- 해상도: **940×515** (가로 비율 고정)
- 피사체 면적: 프레임 대비 약 **45%**
- 세로 위치: Y 중심 50% 기본, 차종별 보정 가능 (그랜저 53%)
- 이미지 최적화 규칙: `priority` 속성은 **첫 번째 차량 카드만**, 나머지는 지연 로드
- 캐시: 30일 (`Cache-Control: s-maxage=2592000`)

## 14.4 Supabase Storage
- 차량 360° 이미지 원본 저장
- cadam-web은 **공개 버킷의 직접 URL**로 접근 (anon key 불필요)
- Storage 접근 경로는 `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`/storage/v1/object/public/{bucket}/...

## 14.5 성능 기준·원칙 (2026-04 최적화 결과)
- **LCP 목표: 2초 이내** (홈 기준. 2026-04-17 HeroSection framer-motion → CSS animation 전환으로 13.7s → ~1.8s 달성)
- **애니메이션 원칙**:
  - framer-motion은 마운트 후 지연 적용 (`PageTransition mount gate`)
  - h1 등 LCP 후보 요소는 opacity 애니메이션 사용 시 초기 `opacity: 1` 유지 필요
  - 디바이더성 애니메이션(`DiagnosisBanner` 등)은 **뷰포트 진입 시 지연 로드**
- **Supabase 쿼리**: 병렬화(`Promise.all`) 기본. 홈 첫 쿼리는 서버 렌더에서 완료
- **이미지**: Next.js Image + `priority` 는 fold-above 단일 이미지에만


# ────────────────────────────────────────────────────────────────
# 15. 변경 이력
# ────────────────────────────────────────────────────────────────

- 2026-04-23 (3차): 섹션 14 신설 — 시뮬레이터 3페이지, CarSpinViewer 360° 뷰어, Supabase Storage, 차량 이미지 표준(940×515, 면적 45%), 성능 기준·원칙(LCP 2초 목표 등) 반영. API Routes 목록을 루트 CLAUDE.md에 함께 정리.
- 2026-04-23 (2차): 문서 정합성 정정
  - 섹션 2.3.2: 테이블 "8개" → 실제 46개 명시
  - 섹션 2.3.3: DDL 실행 경로(Management API) 문서화
  - 섹션 2.5: WordPress "셋업 예정" → "이미 운영 중"으로 정정
  - 섹션 3.1, 7.1: ALTER/CREATE TABLE 규칙을 "금지"에서 "사용자 승인 후 허용"으로 현실화
- 2026-04-23 (1차): 섹션 13 보안 아키텍처 추가 — RLS 1차 점검·조치, API 보안 미들웨어(`src/lib/api/security.ts`), `/api/rental-price` 템플릿, `.env.local.example`, 개인정보처리방침 12개 섹션 보강. `finance_rates` RLS HIGH 이슈 명시.
- 2026-04-17: price_ranges→pricing 테이블명 수정, 3.6 가격 표시 체계 섹션 추가 (수동 견적가 입력 방식 확정, PMT 자동계산 보류)
- 2026-03-27: v3 초기 버전 — 실제 환경 조사 기반으로 전체 재작성
  - Supabase 테이블 8개 반영 (기존 6개에서 수정)
  - OpenClaw 에이전트 8개 + 개별 models.json 경로 반영
  - n8n 워크플로우 11개 ID/이름 전체 매핑
  - SSH 키 미생성, SSH config 미존재 상태 반영
  - Tailscale 앱 경로 반영
  - 기존 백업 구조 반영

## 15.1 CLAUDE.md 수정 규칙
- 이 파일 수정 시에도 백업 + git commit 필수
- 수정 이유를 이 섹션에 기록
- 새 규칙 추가 시 기존 규칙과 충돌 여부 확인
