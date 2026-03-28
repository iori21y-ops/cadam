# n8n 프롬프트 정렬 (Supabase 단일 정본)

대시보드 BFF는 `ai_prompt_slots`의 `source_type`에 따라 저장 시 다음을 갱신합니다.

| source_type | 동작 |
|-------------|------|
| `prompt_versions_active` | `prompt_versions`에서 활성 행 비활성화 후 새 행 INSERT |
| `review_prompt_versions_active` | 동일 패턴으로 `review_prompt_versions` |
| `prompt_templates_key` | `prompt_templates.template_key` 일치 행의 `template_content` + `version` 증가 |
| `n8n_http_jsonbody` / `n8n_code_jscode` | n8n REST `GET/PUT /api/v1/workflows/:id`로 노드 파라미터 직접 갱신 |

## 인라인 폴백 줄이기

워크플로의 **HTTP Request** 노드에 긴 문자열을 두지 말고:

1. `prompt_templates`에 행을 추가하고 `template_key`를 부여합니다.
2. n8n에서 **Supabase → Get row(s)** 로 `template_content`를 읽습니다.
3. HTTP 노드의 `messages[0].content`는 `{{ $json.template_content }}`처럼 참조만 남깁니다.

이렇게 하면 대시보드에서 `pt:<template_key>` 슬롯만 편집해도 실행에 반영됩니다.

## 신규 워크플로에 AI 프롬프트를 넣을 때

1. 배포 후 BFF `POST /api/prompt-slots/sync-n8n`을 실행해 스캔 슬롯을 등록합니다.
2. 검토 후 Supabase `ai_prompt_slots`에서 해당 행의 `status`를 `active`로 바꾸거나, `prompt_templates_key`로 마이그레이션합니다.
