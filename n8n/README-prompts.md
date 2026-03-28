# CADAM 프롬프트 레지스트리 (대시보드 + BFF)

## 1. Supabase 마이그레이션

SQL 편집기에서 실행하거나 CLI로 적용:

[`supabase/migrations/20260329120000_ai_prompt_registry.sql`](supabase/migrations/20260329120000_ai_prompt_registry.sql)

테이블: `ai_prompt_slots`, `ai_prompt_revisions` 및 시드 슬롯 7건.

## 2. Prompt BFF 기동

```bash
cd prompt-bff
cp .env.example .env
# .env 에 SUPABASE_SERVICE_ROLE_KEY 필수 (Supabase Dashboard → Settings → service_role)
```

Docker Compose (n8n과 함께):

```bash
export SUPABASE_SERVICE_ROLE_KEY='your-service-role-key'
docker compose up -d prompt-bff
```

호스트에서만 테스트할 때는 `N8N_BASE_URL=http://127.0.0.1:5678` 로 `.env` 구성.

선택: `BFF_API_KEY` 를 설정하면 요청 헤더 `X-API-Key` 가 일치해야 합니다.

## 3. 대시보드 HTML

파일: `cadam/output/reports/cadam-dashboard.html`

- `CONFIG.SUPABASE_ANON_KEY`: Supabase **anon** 키를 브라우저에만 넣습니다. **service_role은 절대 넣지 마세요.**
- 또는 개발용으로 `localStorage.setItem('CADAM_SUPABASE_ANON', '<anon>')` 후 새로고침 — `CONFIG`가 비어 있을 때 자동으로 채워집니다.
- `CONFIG.PROMPT_BFF_PORT`: 기본 `3099` (Compose의 `prompt-bff` 포트).
- `CONFIG.PROMPT_BFF_API_KEY`: BFF에 `BFF_API_KEY`를 썼다면 동일 값.

프롬프트 섹션 **워크플로별 프롬프트** 카드에서 목록·저장·롤백·n8n 동기화를 사용합니다.

## 4. n8n 웹훅 (WF-D)

`database.sqlite`의 Dashboard Webhook 노드에 `responseMode: responseNode`가 설정되어 Respond to Webhook과 연결됩니다. n8n 재시작 후 테스트하세요.

## 5. API 요약

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/api/prompt-slots` | 슬롯 목록 + 현재 본문 + 이력 미리보기 |
| PUT | `/api/prompt-slots/:id` | 본문 저장 (이력 스냅샷 선행) |
| POST | `/api/prompt-slots/:id/rollback` | `{ "revision_id" }` 로 복원 |
| POST | `/api/prompt-slots/sync-n8n` | n8n 전체 스캔 후 인라인 HTTP/Code 슬롯 upsert |

## 6. 인라인 → Supabase 정렬

[`docs/n8n-prompt-alignment.md`](docs/n8n-prompt-alignment.md) 참고.
