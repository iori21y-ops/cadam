# CADAM 11일차 작업 지시서 — 클로드 코드용

## 프로젝트 컨텍스트
CADAM 프로젝트, 11일차. 전체 진행률 약 55%.
장기렌터카 중개 플랫폼의 콘텐츠 자동화 시스템 구축 중.

## 현재 상태 (10일차까지 완료)
- n8n 콘텐츠 자동 생성 워크플로우 완성:
  - Schedule Trigger (매일 3AM) → Supabase 대기 스케줄 1건 조회
  - 차량+가격+FAQ+이용방법 데이터 조합 → 프롬프트 생성
  - Qwen3-235B(HuggingFace) 초안 → 실패 시 Gemini Pro 폴백
  - Claude 검수 + SEO 메타 생성
  - CTA/UTM 삽입
  - 로컬 파일 저장 (`~/cadam/output/blog/날짜/`)
  - **WordPress 발행 (draft) → Supabase 상태 업데이트 → Telegram 알림** ← 10일차 완료
- WordPress: `https://cadam21y.mycafe24.com` (카페24 호스팅)
- 대시보드: `~/cadam/output/reports/cadam-dashboard.html` 완성 (새로고침 버튼 수정 완료)
- Supabase RLS 전체 활성화 완료
- models.json에 Qwen3 235B Instruct 2507 추가 완료

## ⚠️ 주소 변경사항 (전체 작업에 적용)
```
WP_URL=https://cadam21y.mycafe24.com  (지시서/코드에 cadam.kr이 있으면 모두 교체)
WP_USER=iori21y
WP_APP_PASSWORD=af6t nNFq z8D9 NfdS zBsz RILy
```

---

## 11일차 목표

10일차까지의 "기본 파이프라인"을 **품질 자동 개선 시스템**으로 업그레이드한다.
프로젝트 지식에 있는 보완 문서(supplement_01~07)와 파이프라인 맵을 참조하여, 아래 작업을 순서대로 실행한다.

**참조해야 할 프로젝트 지식 파일:**
- `cadam_full_pipeline_map.md` — 전체 파이프라인 구조
- `cadam_full_process_after_supplements.md` — 보완 적용 후 상세 프로세스
- `supplement_01_content_brief.md` — 콘텐츠 브리프 시스템
- `supplement_02_rewrite_loop.md` — 재작성 루프 시스템
- `supplement_03_cta_in_draft.md` — 초안 CTA 포함
- `supplement_04_auto_prompt_sync.md` — 프롬프트 자동 동기화
- `supplement_05_performance_mapping.md` — 성과 역매핑 (구조만, 실구현은 4주차)
- `supplement_06_image_generation.md` — 이미지 자동 생성 (구조만, 실구현은 3주차)
- `supplement_07_review_optimizer.md` — 메타 옵티마이저
- `cadam_wf05_brief_v1.json` — WF-0.5 브리프 워크플로우 JSON
- `cadam_wf06_meta_optimizer_v1.json` — WF-6 메타 옵티마이저 워크플로우 JSON

---

## 작업 순서 총괄

| 작업 | 내용 | 참조 문서 | 필수 여부 | 예상 시간 |
|------|------|-----------|-----------|-----------|
| 1 | Supabase 테이블 추가/수정 (보완1~7 전체) | supplement_01~07 | ✅ 필수 | 15분 |
| 2 | 기존 워크플로우 에러 처리 강화 | 구현 가이드 11일차 | ✅ 필수 | 15분 |
| 3 | 초안 프롬프트에 CTA 규칙 추가 (보완3) | supplement_03 | ✅ 필수 | 10분 |
| 4 | 프롬프트 Supabase 동적 로드 (보완4A) | supplement_04 | ✅ 필수 | 15분 |
| 5 | 검수 파이프라인 강화 — 피드백 저장 + 통과/반려 분기 | supplement_02 | ✅ 필수 | 20분 |
| 6 | 재작성 루프 구축 (보완2) | supplement_02 | ✅ 필수 | 30분 |
| 7 | 콘텐츠 브리프 워크플로우 (보완1, WF-0.5) | supplement_01 + wf05 JSON | ✅ 필수 | 25분 |
| 8 | Writer 프롬프트 옵티마이저 (WF-4) | pipeline_map + supplement_04 | ✅ 필수 | 25분 |
| 9 | 메타 옵티마이저 (WF-6, 보완7) | supplement_07 + wf06 JSON | ✅ 필수 | 20분 |
| 10 | 주간 성과 리포트 워크플로우 (WF-D) | 구현 가이드 11일차 | ✅ 필수 | 10분 |
| 11 | n8n Dashboard Webhook 워크플로우 | dashboard-instruction-v2 | ✅ 필수 | 15분 |
| 12 | CTA/UTM 도메인 수정 | — | ✅ 필수 | 5분 |
| 13 | 대시보드 업데이트 (진행률 + WF 상태 반영) | dashboard-instruction-v2 | ⚪ 선택 | 10분 |

**총 예상 시간: 약 3~3.5시간**

---

## 작업 1: Supabase 테이블 추가/수정

보완1~7에서 필요한 테이블 변경을 한 번에 실행한다. 각 supplement 문서의 STEP 1(Supabase 테이블) 섹션을 참조.

### 1-1. 새 테이블 생성 (4개)

`supplement_01_content_brief.md`의 STEP 1 참조:
```sql
-- 콘텐츠 브리프 테이블 (보완1)
CREATE TABLE IF NOT EXISTS content_briefs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  keyword TEXT NOT NULL,
  article_type TEXT NOT NULL DEFAULT 'blog',
  pricing_data JSONB DEFAULT '{}',
  faq_data JSONB DEFAULT '{}',
  brief_content JSONB NOT NULL,
  brief_version INTEGER DEFAULT 1,
  used_in_article_id TEXT,
  article_pass BOOLEAN,
  status TEXT DEFAULT 'ready'
);
CREATE INDEX IF NOT EXISTS idx_content_briefs_keyword ON content_briefs (keyword);
CREATE INDEX IF NOT EXISTS idx_content_briefs_status ON content_briefs (status);
```

`supplement_02_rewrite_loop.md`의 STEP 1 참조:
```sql
-- 수동 검토 큐 테이블 (보완2)
CREATE TABLE IF NOT EXISTS rewrite_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  article_id TEXT NOT NULL,
  keyword TEXT,
  article_type TEXT,
  final_content TEXT,
  review_history JSONB DEFAULT '[]',
  total_rounds INTEGER DEFAULT 0,
  recurring_weak_patterns JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  reviewer_notes TEXT,
  resolved_at TIMESTAMPTZ
);
```

`supplement_07_review_optimizer.md`의 STEP 1 참조:
```sql
-- 메타 옵티마이저 실행 기록 (보완7)
CREATE TABLE IF NOT EXISTS review_optimizer_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  review_prompt_version INTEGER,
  analysis_summary JSONB,
  consistency_diagnosis JSONB,
  distribution_diagnosis JSONB,
  changes_made JSONB DEFAULT '[]',
  needs_update BOOLEAN DEFAULT false,
  update_urgency TEXT DEFAULT 'none',
  full_response JSONB
);

-- 일관성 테스트 기록 (보완7)
CREATE TABLE IF NOT EXISTS review_consistency_tests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  article_id TEXT,
  test_scores JSONB DEFAULT '[]',
  score_variance JSONB,
  max_deviation NUMERIC(3,1),
  review_prompt_version INTEGER
);
```

### 1-2. 기존 테이블 수정

`supplement_02_rewrite_loop.md` 참조 — review_feedback 테이블 확장:
```sql
ALTER TABLE review_feedback
  ADD COLUMN IF NOT EXISTS rewrite_round INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rewrite_model TEXT,
  ADD COLUMN IF NOT EXISTS previous_scores JSONB,
  ADD COLUMN IF NOT EXISTS score_improvement JSONB;
```

`supplement_05_performance_mapping.md` 참조 — review_feedback에 성과 컬럼 추가:
```sql
ALTER TABLE review_feedback
  ADD COLUMN IF NOT EXISTS published_url TEXT,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gsc_impressions INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gsc_clicks INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gsc_ctr NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gsc_avg_position NUMERIC(5,1),
  ADD COLUMN IF NOT EXISTS wp_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS performance_score INTEGER,
  ADD COLUMN IF NOT EXISTS performance_collected BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS performance_collected_at TIMESTAMPTZ;
```

`supplement_07_review_optimizer.md` 참조 — review_prompt_versions 확장:
```sql
ALTER TABLE review_prompt_versions
  ADD COLUMN IF NOT EXISTS change_summary TEXT,
  ADD COLUMN IF NOT EXISTS change_reason TEXT,
  ADD COLUMN IF NOT EXISTS parent_version INTEGER,
  ADD COLUMN IF NOT EXISTS avg_pass_rate NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS avg_consistency_score NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS total_reviews_with_version INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS performance_correlation JSONB;
```

`supplement_05_performance_mapping.md` 참조 — article_performance 시계열 테이블:
```sql
CREATE TABLE IF NOT EXISTS article_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  article_id TEXT NOT NULL,
  keyword TEXT,
  published_url TEXT,
  published_at TIMESTAMPTZ,
  collection_period TEXT,
  gsc_impressions INTEGER DEFAULT 0,
  gsc_clicks INTEGER DEFAULT 0,
  gsc_ctr NUMERIC(5,2) DEFAULT 0,
  gsc_avg_position NUMERIC(5,1),
  wp_views INTEGER DEFAULT 0,
  performance_score INTEGER,
  review_score_average NUMERIC(3,1),
  writer_prompt_version INTEGER,
  review_prompt_version INTEGER
);
CREATE INDEX IF NOT EXISTS idx_article_performance_article ON article_performance (article_id);
CREATE INDEX IF NOT EXISTS idx_article_performance_period ON article_performance (collection_period);
```

### 1-3. RLS 정책 추가

새로 만든 4개 테이블 + article_performance에 대해 기존 RLS 패턴과 동일하게 설정:
- anon 키로 SELECT 허용
- service_role 키로 ALL 허용

⚠️ 실행 전 반드시 기존 테이블에 이미 해당 컬럼이 없는지 확인. 이미 있으면 스킵.

---

## 작업 2: 에러 처리 분기 강화

현재 워크플로우의 각 실패 지점에 에러 분기를 추가한다.

| 실패 지점 | 현재 처리 | 추가할 처리 |
|-----------|----------|------------|
| Qwen3 초안 실패 | Gemini 폴백 있음 | Gemini도 실패 시 → Supabase status='에러' + Telegram 에러 알림 |
| Claude 검수 실패 | 없음 | → 초안만으로 draft 저장 (검수 없이 진행) + Telegram "검수 스킵" 알림 |
| WordPress 발행 실패 | 10일차에 구현됨 | → 유지 (Continue On Fail + IF 에러 분기) |
| FAQ 자동분류 AI 실패 | Gemini 폴백 있음 | → 모두 실패 시 원본 메모 보존 + Telegram 알림 |

각 에러 분기에서:
1. Supabase content_schedule의 status를 적절히 업데이트 ('에러', '검수스킵' 등)
2. Telegram으로 에러 내용 + 차량명 + 방법 알림
3. 로컬 파일은 에러 시에도 저장되도록 보장 (이미 로컬 저장 이후 WP 발행이므로 대부분 OK)

---

## 작업 3: 초안 프롬프트에 CTA 규칙 추가 (보완3)

`supplement_03_cta_in_draft.md`를 참조하여 기존 Qwen3/Gemini 초안 작성 노드의 시스템 프롬프트에 CTA 규칙 블록을 추가한다.

### 추가할 CTA 규칙 블록

supplement_03의 "STEP 1: 초안 작성 프롬프트에 CTA 규칙 추가" 섹션 전체를 참조.

핵심:
- 시스템 프롬프트에 CTA 규칙 섹션 추가
- CTA 2회 배치: 본문 중간 1회 (40~60% 지점) + 글 마지막 1회
- CTA 구조: `[구체적 행동] + [혜택] + [부담 해소]`
- UTM 링크 형식: `https://cadam21y.mycafe24.com/estimate?utm_source=wordpress&utm_medium=cta_{{위치}}&utm_campaign={{키워드}}_{{방법}}`

⚠️ 도메인은 반드시 `cadam21y.mycafe24.com`으로 설정.

### WF-3의 CTA/UTM 삽입 노드도 수정

supplement_03의 "STEP 2: WF-3 CTA/UTM 삽입 노드 수정" 참조:
- 기존: CTA를 신규 삽입하던 로직
- 변경: 이미 초안에 CTA가 있으므로, CTA 보강 + UTM 파라미터만 추가하는 로직으로 전환
- CTA가 없는 경우(폴백): 기존처럼 CTA 삽입

---

## 작업 4: 프롬프트 Supabase 동적 로드 (보완4A)

`supplement_04_auto_prompt_sync.md`의 "보완4A: 즉시 적용" 섹션을 참조.

### 현재 문제
초안 작성 노드에 Writer 프롬프트가 하드코딩되어 있어서, 옵티마이저(WF-4)가 프롬프트를 개선해도 수동 반영이 필요함.

### 수정 방법
1. 초안 작성 워크플로우(WF-1) 시작 부분에 Supabase 조회 노드 추가:
   - 테이블: `prompt_versions`
   - 필터: `is_active = true`
   - 결과: 활성 프롬프트 텍스트를 가져옴

2. 기존 초안 작성 노드의 하드코딩된 시스템 프롬프트를 제거하고, Supabase에서 가져온 프롬프트를 `{{ $json.prompt_content }}`로 동적 삽입

3. 동일하게 검수 노드(WF-2)도 `review_prompt_versions`에서 활성 검수 프롬프트를 동적 로드하도록 수정

supplement_04의 상세 코드 및 노드 설정을 그대로 따를 것.

### prompt_versions에 현재 프롬프트 등록

현재 하드코딩된 Writer 프롬프트를 prompt_versions 테이블에 INSERT:
```sql
INSERT INTO prompt_versions (version, prompt_content, is_active, created_by)
VALUES (1, '현재 하드코딩된 Writer 프롬프트 전문', true, 'initial_setup');
```

마찬가지로 review_prompt_versions에 현재 검수 프롬프트 등록:
```sql
INSERT INTO review_prompt_versions (version, prompt_content, is_active, created_by)
VALUES (1, '현재 하드코딩된 검수 프롬프트 전문', true, 'initial_setup');
```

⚠️ 하드코딩된 프롬프트를 Code 노드에서 추출하여 DB에 등록. 기존 노드에서 실제 사용 중인 프롬프트 텍스트를 그대로 가져올 것.

---

## 작업 5: 검수 파이프라인 강화

현재 검수 노드의 결과를 review_feedback 테이블에 저장하고, 통과/반려 분기를 명확히 한다.

### 5-1. 검수 결과 JSON 파싱 노드 추가

Claude 검수 노드 출력 후에 Code 노드를 추가하여:
- JSON 파싱: 8개 카테고리 점수, 피드백, 약점 태그, pass/fail 판정 추출
- `supplement_02_rewrite_loop.md`의 "STEP 2" 참조

### 5-2. review_feedback에 저장

파싱된 결과를 Supabase review_feedback 테이블에 INSERT:
- article_id, keyword, article_type
- 8개 카테고리 점수 (scores JSONB)
- 피드백 요약 (feedback_summary)
- 약점 패턴 태그 (weak_patterns JSONB)
- 통과 여부 (pass BOOLEAN)
- 재작성 라운드 (rewrite_round: 0 = 초안)
- writer_prompt_version (prompt_versions에서 가져온 현재 버전)
- review_prompt_version (review_prompt_versions에서 가져온 현재 버전)

### 5-3. 통과/반려 IF 분기

- IF pass === true → 기존 WF-3 (CTA보강+UTM+발행) 으로 진행
- IF pass === false → 작업 6(재작성 루프)으로 진행

---

## 작업 6: 재작성 루프 구축 (보완2)

`supplement_02_rewrite_loop.md` 전체를 참조하여 재작성 루프를 구축한다.

### 전체 흐름

```
검수 반려 → 재작성 카운터 확인 →
  → round < 1: 1차 재작성 (Qwen3, 무료) → 재검수
  → round < 2: 2차 재작성 (Sonnet 4, 유료) → 재검수
  → round >= 2: 수동 검토 큐 + Telegram 반려 알림
```

### 6-1. 피드백 → 구체적 수정 지시 변환 (Code 노드)

supplement_02의 "STEP 2: 피드백 → 수정 지시 변환 함수" 전체를 참조.
- 점수 3점 이하 카테고리를 추출
- 각 카테고리별 수정 지시 템플릿(fixTemplates) 적용
- 최대 3개 카테고리만 지시 (과부하 방지)

### 6-2. 1차 재작성 노드 (Qwen3/Gemini)

supplement_02의 "STEP 3: 재작성 프롬프트 - 1차 재작성 프롬프트" 참조.
- HTTP Request 노드 (OpenRouter API 또는 HuggingFace)
- 원본 글 + 수정 지시 → 수정본 생성
- Gemini 폴백 포함

### 6-3. 재검수

- 동일한 검수 프롬프트로 수정본 평가
- review_feedback에 rewrite_round=1로 저장
- 통과 → WF-3, 반려 → 6-4로

### 6-4. 2차 재작성 노드 (Sonnet 4)

supplement_02의 "STEP 3: 2차 재작성 프롬프트 (Sonnet 4용)" 참조.
- Anthropic API 직접 호출 (HTTP Request 노드)
- 1차 + 2차 검수 히스토리를 모두 포함한 프롬프트
- 반복되는 약점 패턴 분석 포함

### 6-5. 최종 재검수

- review_feedback에 rewrite_round=2로 저장
- 통과 → WF-3, 반려 → 6-6으로

### 6-6. 최종 반려 처리

- rewrite_queue 테이블에 전체 히스토리와 함께 저장
- Telegram 반려 알림: 3회 검수 히스토리 + 반복 약점 + 수동 검토 요청

### n8n 노드 추가 목록 (supplement_02의 "STEP 4" 참조)

| 번호 | 노드 이름 | 노드 타입 | 설명 |
|------|----------|----------|------|
| A1 | 결과파싱 | Code | 검수 JSON 파싱 + pass/fail 추출 |
| A2 | IF 통과? | IF | pass === true 분기 |
| A3 | IF 1차재작성? | IF | round < 1 분기 |
| A4 | 피드백→수정지시 | Code | 피드백을 구체적 수정 지시로 변환 |
| A5 | Qwen3 재작성 | HTTP Request | OpenRouter API |
| A6 | Gemini 재작성 폴백 | HTTP Request | Gemini API |
| A7 | 재작성 추출 | Code | 재작성 결과 파싱 |
| A8 | 피드백 저장 (round 1) | Supabase | review_feedback에 round=1 저장 |
| A9 | 재검수 (round 1) | HTTP Request | Anthropic API 검수 |
| B1 | IF 2차재작성? | IF | round < 2 분기 |
| B2 | 히스토리 조립 | Code | round 0+1 피드백 → Sonnet 프롬프트 |
| B3 | Sonnet 재작성 | HTTP Request | Anthropic API |
| B4 | Sonnet 결과 파싱 | Code | 수정본 추출 |
| B5 | 피드백 저장 (round 2) | Supabase | review_feedback에 round=2 저장 |
| B6 | 재검수 (round 2) | HTTP Request | Anthropic API 검수 |
| C1 | 수동 큐 저장 | Supabase | rewrite_queue에 저장 |
| C2 | 반려 알림 | Telegram | 최종 반려 알림 |

---

## 작업 7: 콘텐츠 브리프 워크플로우 (보완1, WF-0.5)

`supplement_01_content_brief.md` 전체 + `cadam_wf05_brief_v1.json`을 참조.

### 7-1. WF-0.5 워크플로우 생성 (별도 워크플로우)

JSON 파일 `cadam_wf05_brief_v1.json`을 n8n에 import하되, Credential ID와 실제 API 키를 교체.

워크플로우 흐름:
```
Manual Trigger (또는 Webhook)
→ Supabase: pricing 데이터 조회
→ Supabase: FAQ 데이터 조회
→ Code: 브리프 프롬프트 변수 조립
→ HTTP Request: Claude Sonnet 4 API 호출 (브리프 생성)
→ Code: JSON 파싱
→ Supabase: content_briefs에 저장
→ Code: 브리프 → 로컬 AI용 텍스트 변환
→ Telegram: 브리프 생성 완료 알림
```

### 7-2. 브리프 프롬프트

supplement_01의 "STEP 2: 브리프 생성 프롬프트" 전문을 사용.
핵심: 8단계 분석 (검색의도 → 페르소나 → 구조 → 도입부 → 데이터 → SEO → CTA → 차별화)

### 7-3. WF-1(초안 작성)에 브리프 연동

기존 초안 작성 워크플로우에서:
1. 스케줄 조회 후, 해당 키워드의 브리프가 content_briefs에 있는지 확인
2. 브리프가 있으면 → 초안 프롬프트에 브리프 내용을 포함
3. 브리프가 없으면 → 기존 방식(키워드만)으로 진행 (폴백)

supplement_01의 "STEP 4: WF-1 초안 작성 연동" 참조.

---

## 작업 8: Writer 프롬프트 옵티마이저 (WF-4)

`cadam_full_pipeline_map.md`의 "워크플로우 4" + `supplement_04_auto_prompt_sync.md` 참조.

### 8-1. WF-4 워크플로우 생성 (별도 워크플로우)

```
Schedule Trigger (초기: 매일 09시, 안정기 후 주 2회)
→ Supabase: 최근 7일 review_feedback 건수 확인 (5건 미만이면 스킵)
→ Supabase: 최근 피드백 30건 조회
→ Supabase: 현재 Writer 프롬프트 조회 (prompt_versions, is_active=true)
→ Supabase: 이전 프롬프트 조회 (비교용)
→ Code: 통계 계산 (통과율, 카테고리 평균, 트렌드, 약점 패턴 빈도)
→ HTTP Request: Claude Sonnet 4 API (프롬프트 분석 + 개선안 생성)
→ Code: 결과 파싱 (needs_update, 변경사항, 새 프롬프트)
→ IF needs_update?
  → True:
    → Supabase: 기존 프롬프트 비활성화 (is_active=false, 통과율 기록)
    → Supabase: 새 프롬프트 저장 (is_active=true)
    → Supabase: optimizer_runs에 실행 기록 저장
    → Telegram: 변경 리포트 (변경 내역 + 예상 효과 + 롤백 조건)
  → False:
    → Supabase: optimizer_runs에 "변경 불필요" 기록
    → Telegram: "분석 완료, 변경 불필요" 알림
```

### 8-2. 옵티마이저 프롬프트

`cadam_full_pipeline_map.md`의 워크플로우 4 상세 + supplement_04 참조.
7단계 분석: 성과 데이터 분석 → 약점 패턴 분석 → 근본 원인 특정 → 프롬프트 비교 → 수정안 생성 → 영향 예측 → 롤백 조건

### 8-3. Schedule Trigger 설정

⚠️ 초기에는 비활성 상태로 생성. 테스트 완료 후 활성화.
- 초기: 매일 09시 (`0 9 * * *`)
- 안정기(2주 후): 주 2회 (`0 9 * * 1,4`)
- 유지기(1개월 후): 주 1회 (`0 9 * * 1`)

---

## 작업 9: 메타 옵티마이저 (WF-6, 보완7)

`supplement_07_review_optimizer.md` 전체 + `cadam_wf06_meta_optimizer_v1.json` 참조.

### 9-1. WF-6 워크플로우 생성 (별도 워크플로우)

JSON 파일 `cadam_wf06_meta_optimizer_v1.json`을 n8n에 import하되, Credential ID 교체.

```
Schedule Trigger (초기: 주 1회 월요일 10시)
→ Supabase: 최근 피드백 30건 조회
→ Supabase: 현재 검수 프롬프트 조회
→ Supabase: optimizer_runs에서 Writer 옵티마이저 변경 이력
→ Code: 일관성 테스트 데이터 조립
→ HTTP Request: Sonnet 4 (일관성 테스트 — 동일 글 3회 검수)
→ Code: 점수 편차 계산
→ Code: 전체 분석 데이터 조립 (일관성 + 분포 + 옵티마이저 효과)
→ HTTP Request: Sonnet 4 (검수 프롬프트 분석 + 개선안)
→ Code: 결과 파싱
→ IF needs_update?
  → True:
    → Supabase: 기존 검수 프롬프트 비활성화
    → Supabase: 새 검수 프롬프트 저장
    → Supabase: review_optimizer_runs에 기록
    → Telegram: 변경 리포트
  → False:
    → Supabase: review_optimizer_runs에 "변경 불필요" 기록
    → Telegram: 알림
```

### 9-2. 메타 옵티마이저 프롬프트

supplement_07의 "STEP 2: 메타 옵티마이저 프롬프트" 전문을 사용.
5가지 진단: 일관성 → 분포 → Writer 옵티마이저 정합성 → 도메인 → 성과 괴리

### 9-3. Schedule Trigger 설정

⚠️ 초기에는 비활성 상태로 생성.
- 초기: 주 1회 월요일 10시 (`0 10 * * 1`)
- Writer 옵티마이저(WF-4, 매일 09시)보다 느린 주기

---

## 작업 10: 주간 성과 리포트 워크플로우 (WF-D)

별도 워크플로우로 생성.

```
Schedule Trigger: 매주 일요일 09:00 (0 9 * * 0)
→ Supabase: 이번 주 발행 글 조회 (content_schedule, 이번 주 날짜 범위)
→ Supabase: 이번 주 review_feedback 통계
→ Code: 집계 (발행 건수, 성공/실패, 통과율, 카테고리 평균)
→ Telegram: 주간 리포트 발송
```

리포트 형식:
```
📊 카담 주간 리포트 ({{시작일}}~{{종료일}})

• 발행: {{총}}편 (성공 {{성공}} / 실패 {{실패}})
• 검수 통과율: {{통과율}}%
• 평균 점수: {{평균}}/5.0
• 약점 TOP3: {{약점1}}, {{약점2}}, {{약점3}}
• 재작성: {{재작성건수}}편 (1차 {{1차}} / 2차 {{2차}} / 반려 {{반려}})
• 다음 주 예정: {{예정건수}}편

💡 옵티마이저: {{변경여부}} (v{{버전}})
```

⚠️ Schedule Trigger는 비활성 상태로 생성. 테스트 후 활성화.

---

## 작업 11: n8n Dashboard Webhook 워크플로우

대시보드가 실시간 데이터를 가져올 수 있는 Webhook 워크플로우를 생성한다.
`cadam-dashboard-instruction-v2.md`의 "계층 3: n8n Webhook" 섹션 참조.

### Webhook URL
`/webhook/cadam-dashboard-status`

### 수집 데이터

Code 노드에서 아래 정보를 수집하여 JSON 응답:

```javascript
const { execSync } = require('child_process');
const result = {};

// 1. OpenClaw 에이전트 상태
// 2. 최근 블로그 파일 목록
// 3. Docker 컨테이너 상태
// 4. LaunchAgent 상태
// 5. 디스크 사용량
// 6. n8n 워크플로우 목록
// 7. WordPress 최근 글 (선택 — WP REST API 호출)
```

dashboard-instruction-v2의 "계층 3: n8n Webhook 워크플로우" 코드 전문을 참조하여 구현.

### WordPress 글 목록 추가 (선택)

Webhook Code 노드에 아래 추가:
```javascript
// WordPress 최근 글 조회
try {
  const wpRes = execSync(`curl -s "https://cadam21y.mycafe24.com/wp-json/wp/v2/posts?per_page=5&status=draft,publish" -u "iori21y:af6t nNFq z8D9 NfdS zBsz RILy"`).toString();
  const posts = JSON.parse(wpRes);
  result.wp_posts = posts.map(p => ({
    title: p.title.rendered,
    status: p.status,
    date: p.date,
    link: p.link
  }));
} catch(e) {
  result.wp_posts = [];
  result.wp_error = e.message;
}
```

---

## 작업 12: CTA/UTM 도메인 수정

기존 워크플로우에서 `cadam.kr`이 하드코딩된 곳을 모두 찾아서 `cadam21y.mycafe24.com`으로 변경.

```bash
# 워크플로우 JSON 파일에서 cadam.kr 검색
grep -r "cadam.kr" ~/cadam/ --include="*.json" --include="*.js" --include="*.env"
```

가능하면 `.env`의 `WP_URL` 변수를 참조하도록 수정하여, 나중에 도메인 변경 시 `.env`만 수정하면 되도록 한다.

---

## 작업 13: 대시보드 업데이트 (선택)

`~/cadam/output/reports/cadam-dashboard.html`을 수정:
1. 프로젝트 진행률: 50% → 55%
2. 현재 일차: 10일차 → 11일차
3. n8n 워크플로우 현황 업데이트:
   - WF-3: ⏳ 진행중 → ✅ 완료
   - WF-0.5: ⬜ 미구축 → ✅ 완료
   - WF-2R: ⬜ 미구축 → ✅ 완료
   - WF-4: ⬜ 미구축 → ✅ 완료
   - WF-6: ⬜ 미구축 → ✅ 완료
   - WF-D: ⬜ 미구축 → ✅ 완료
4. WordPress 상태: ⏳ 테스트 → ✅ 가동 (cadam21y.mycafe24.com)

---

## 트러블슈팅

| 증상 | 원인 | 해결 |
|------|------|------|
| Supabase ALTER TABLE 실패 | 컬럼이 이미 존재 | `IF NOT EXISTS` 확인, 이미 있으면 스킵 |
| Sonnet API 401 | API 키 만료/잘못됨 | ~/.env에서 ANTHROPIC_API_KEY 확인 |
| 옵티마이저가 매일 "변경 불필요" | 피드백 데이터 부족 | 5건 이상 축적될 때까지 정상 동작 |
| 재작성 루프 무한 반복 | round 카운터 미증가 | Code 노드에서 round 값 확인 |
| 브리프 생성 시 pricing 데이터 비어있음 | Supabase 필터 조건 잘못됨 | pricing 테이블에 데이터 있는지 + 필터 확인 |
| WF-0.5 JSON import 실패 | Credential ID 불일치 | import 후 각 노드에서 Credential 재선택 |
| Dashboard Webhook 응답 없음 | Webhook URL 오타 | `/webhook/cadam-dashboard-status` 정확히 확인 |
| 검수에서 CTA 점수가 여전히 낮음 | 초안 프롬프트에 CTA 규칙 미반영 | 작업 3 재확인 |

---

## 완료 체크리스트

```
☐ Supabase: content_briefs 테이블 생성
☐ Supabase: rewrite_queue 테이블 생성
☐ Supabase: review_optimizer_runs 테이블 생성
☐ Supabase: review_consistency_tests 테이블 생성
☐ Supabase: article_performance 테이블 생성
☐ Supabase: review_feedback 확장 컬럼 추가
☐ Supabase: review_prompt_versions 확장 컬럼 추가
☐ Supabase: 새 테이블 RLS 정책 설정
☐ 에러 처리: Qwen3+Gemini 모두 실패 시 에러 분기
☐ 에러 처리: Claude 검수 실패 시 검수 스킵 분기
☐ 보완3: 초안 프롬프트에 CTA 규칙 추가
☐ 보완3: WF-3 CTA/UTM 노드를 "보강" 모드로 수정
☐ 보완4A: WF-1 초안 노드가 Supabase에서 프롬프트 동적 로드
☐ 보완4A: WF-2 검수 노드가 Supabase에서 검수 프롬프트 동적 로드
☐ 보완4A: 현재 프롬프트를 prompt_versions/review_prompt_versions에 등록
☐ 검수: review_feedback에 검수 결과 저장
☐ 검수: 통과/반려 IF 분기 정상 작동
☐ 재작성: 1차 재작성 (Qwen3) 정상 작동
☐ 재작성: 재검수 정상 작동
☐ 재작성: 2차 재작성 (Sonnet 4) 정상 작동
☐ 재작성: 최종 반려 → rewrite_queue 저장 + Telegram 알림
☐ WF-0.5: 콘텐츠 브리프 생성 워크플로우 동작
☐ WF-0.5: content_briefs에 저장 확인
☐ WF-1: 브리프 연동 (브리프 있으면 포함, 없으면 폴백)
☐ WF-4: Writer 옵티마이저 워크플로우 생성 (Schedule 비활성)
☐ WF-4: 수동 실행 테스트 성공
☐ WF-6: 메타 옵티마이저 워크플로우 생성 (Schedule 비활성)
☐ WF-6: 수동 실행 테스트 성공
☐ WF-D: 주간 리포트 워크플로우 생성 (Schedule 비활성)
☐ Dashboard Webhook: /webhook/cadam-dashboard-status 응답 확인
☐ CTA/UTM: cadam.kr → cadam21y.mycafe24.com 전체 교체
☐ 워크플로우 백업: ~/cadam-backups/n8n/ 에 JSON 저장
```

---

## 주의사항

1. **워크플로우 수정 전 반드시 JSON 백업** — `~/cadam-backups/n8n/`에 저장
2. **모든 Schedule Trigger는 테스트 완료 전까지 비활성** — 수동 실행으로 먼저 검증
3. **WordPress 글 Status는 반드시 draft** — 4주간 경년님이 직접 검토 후 발행
4. **Sonnet API 호출 시 비용 주의** — 옵티마이저+메타옵티마이저+재작성 합산 월 ~$12~15 예상
5. **.env 파일은 Git에 절대 커밋 금지**
6. **cadam.kr이 코드에 남아있으면 안 됨** — 전부 cadam21y.mycafe24.com으로 교체
7. **보완5(성과 역매핑), 보완6(이미지 생성)은 11일차에 구조만 준비** — 실구현은 GSC 연동(19일차) 이후
