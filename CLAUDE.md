# CLAUDE.md — CADAM 프로젝트 하네스
> 최종 업데이트: 2026-03-27
> 이 파일은 Claude Code가 프로젝트 컨텍스트를 이해하기 위한 메타 문서입니다.

---

## 1. 프로젝트 개요

**CADAM (카담)** — 장기렌터카 중개 플랫폼
- 사업자: 김경년
- 핵심 가치: 고객에게 투명한 금융 정보 제공, 신뢰 기반 중개

---

## 2. 디렉토리 구조 (Mac Mini M4)

```
/Users/kim/
├── cadam/                    # 에이전트 운영관리 (OpenClaw 연동)
│   ├── config/               #   에이전트 설정
│   ├── data/                 #   데이터 저장
│   ├── logs/                 #   로그
│   ├── models/               #   모델 설정
│   ├── output/               #   출력물
│   ├── scripts/              #   운영 스크립트
│   └── temp/                 #   임시 파일
│
├── cadam-web/                # 웹사이트 (이 저장소)
│   ├── .env.local            #   Supabase 키 (절대 커밋 금지)
│   ├── CLAUDE.md             #   이 파일
│   ├── harness-rules.json    #   자동 검증 규칙
│   └── .git → github.com/iori21y-ops/cadam.git
│
├── cadam-naver/              # 네이버 블로그 자동발행
│   └── server.js             #   publish-server (LaunchAgent로 실행)
│
├── cadam-n8n/                # n8n 자동화 플랫폼
│   ├── docker-compose.yml    #   Docker 설정
│   └── n8n_data/             #   워크플로우 + 크레덴셜 데이터
│
├── cadam-backups/            # 통합 백업
│   ├── n8n/                  #   n8n 워크플로우 백업
│   ├── openclaw/             #   OpenClaw 설정 백업
│   ├── config/               #   기타 설정 백업
│   └── gpu-server/           #   GPU 서버 설정 백업
│
├── .openclaw/                # ⛔ 이동 금지 (절대경로 7곳 하드코딩)
│   ├── openclaw.json         #   메인 설정
│   └── agents/               #   8개 에이전트
│       ├── main/
│       ├── writer/
│       ├── scenario/
│       ├── creator/
│       ├── crawler/
│       ├── controller/
│       ├── customer-bot/
│       └── coder/
│
├── .ollama/                  # ⛔ 이동 금지 (Ollama 모델 저장소)
├── .ssh/                     # ⛔ 이동 금지 (SSH 키)
└── .docker/                  # ⛔ 이동 금지 (Docker 설정)
```

---

## 3. 기술 스택

### cadam-web (이 저장소)
| 구분 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 스타일링 | Tailwind CSS |
| 상태관리 | Zustand |
| 백엔드 | Supabase (PostgreSQL) |
| 배포 | Vercel |
| 레이트 리미팅 | Upstash Redis |
| SEO | ISR (Incremental Static Regeneration) |

### 인프라
| 구분 | 기술 |
|------|------|
| 자동화 | n8n (Docker, localhost:5678) |
| AI 에이전트 | OpenClaw + Ollama (로컬) |
| GPU 서버 | Windows (Tailscale: 100.80.136.112) |
| 로컬 모델 | glm4, cadam-writer, cadam-support (Mac) / glm4, qwen3:14b (GPU) |
| 봇 | Telegram (OpenClaw customer-bot) |

---

## 4. Supabase 테이블 (8개)

| 테이블 | 용도 |
|--------|------|
| vehicle_settings | 차량 설정 |
| price_ranges | 가격 범위 |
| info_articles | 정보 콘텐츠 |
| info_categories | 콘텐츠 분류 |
| consultations | 상담 요청 |
| diagnosis_config | 금융 진단 설정 |
| notification_log | 알림 로그 |
| promotions | 프로모션 |

---

## 5. n8n 워크플로우 (11개)

| ID | 이름 | 상태 |
|----|------|------|
| 85oCvUHvP9AdM7Cb | GS→Supabase 이용방법동기화 | 활성 |
| C9s2T7fls85OtBho | GS→Supabase 가격동기화 | 활성 |
| Hg5vDOF3ZPnodQvI | 연결테스트 | 테스트용 |
| Kn9W93kFwp5rZ0e5 | 텔레그램 명령어 처리 (사본) | 백업 |
| RWupOiaxoIWow4zA | 텔레그램 명령어 처리 | 활성 |
| WcFX9tRkNlT0Evtu | 카담 9일차 — 콘텐츠 생성 후반부 | 개발중 |
| XmXKfg2T41mB4tCr | 네이버 블로그 자동발행 | 활성 |
| enc9qfrwDGwPoTQl | GS→Supabase 차량동기화 | 활성 |
| flATeSx9PDV1y1Vm | 카담 9일차 사본 | 백업 |
| wOisRkS8wefBsgXS | FAQ 자동분류 | 활성 |
| zfgXA8axWOngk6q5 | GS→Supabase 스케줄동기화 | 활성 |

---

## 6. OpenClaw 에이전트 (8개)

| 에이전트 | 역할 | 주요 모델 |
|----------|------|-----------|
| main | 메인 오케스트레이터 | glm4 |
| writer | 콘텐츠 작성 | cadam-writer |
| scenario | 시나리오 생성 | glm4 + HF 폴백 |
| creator | 크리에이티브 | glm4 |
| crawler | 데이터 수집 | glm4 |
| controller | 작업 제어 | glm4 |
| customer-bot | 고객 응대 (Telegram) | cadam-support |
| coder | 코드 생성 | glm4 |

---

## 7. 환경 변수

### .env.local (cadam-web) — ⚠️ 절대 커밋 금지
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### .zshrc 전역 변수
- `N8N_EDITOR_BASE_URL=http://localhost:5678`
- `WEBHOOK_URL=http://localhost:5678/`
- `N8N_API_KEY` (설정됨)
- `N8N_API_URL=http://localhost:5678/api/v1`
- `OLLAMA_HOST=127.0.0.1`

---

## 8. 서비스 관리

### n8n
```bash
cadam-n8n         # 시작 (docker compose up -d)
cadam-n8n-stop    # 정지
cadam-n8n-logs    # 로그 확인
```

### 상태 확인
```bash
cadam-status      # Docker + LaunchAgent + n8n 헬스체크
```

### LaunchAgents
| 이름 | 상태 | 대상 |
|------|------|------|
| com.cadam.publish-server | ✅ 실행중 | cadam-naver/server.js |

### 백업
```bash
~/cadam-backups/backup-n8n.sh       # n8n 워크플로우 백업
~/cadam-backups/backup-openclaw.sh  # OpenClaw 설정 백업
```

---

## 9. Git 규칙

### 커밋 컨벤션
- `feat:` 새 기능
- `fix:` 버그 수정
- `docs:` 문서 변경
- `style:` 포맷팅 (코드 변경 없음)
- `refactor:` 리팩토링
- `chore:` 빌드/설정 변경

### 절대 커밋 금지 파일
- `.env.local`, `.env`
- `node_modules/`
- `.next/`
- 모든 API 키, 시크릿

---

## 10. Claude Code 작업 규칙

1. **파일 수정 전 반드시 백업** — 특히 `.env.local`, `docker-compose.yml`
2. **이동 금지 디렉토리 절대 건드리지 않기** — `.openclaw/`, `.ollama/`, `.ssh/`, `.docker/`
3. **n8n 워크플로우 수정 시** — API를 통해 수정, 직접 DB 파일 조작 금지
4. **Supabase 스키마 변경 시** — 마이그레이션 SQL 파일 먼저 생성
5. **GPU 서버 작업 시** — SSH 키 경로: `~/.ssh/` (Tailscale IP: 100.80.136.112)
6. **harness-rules.json 준수** — 커밋 전 자동 검증 통과 필수

---

## 11. 주요 URL

| 서비스 | URL |
|--------|-----|
| n8n | http://localhost:5678 |
| Supabase | 대시보드에서 확인 |
| GitHub | https://github.com/iori21y-ops/cadam |
| Vercel | 대시보드에서 확인 |
| GPU 서버 | ssh User@100.80.136.112 |
