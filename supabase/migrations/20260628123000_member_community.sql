-- ============================================================
-- Migration — 회원 위성 + 커뮤니티 테이블 + RLS (트랙 B 4조, §3.6·§6.5·§6.7·§12.2)
-- 전제: members·reviews 는 이미 존재(migration_001) → 재생성 안 함. 위성 4 + community 4 신규.
-- 멱등: create table if not exists / create policy 는 drop 후 재생성(if exists).
-- 보안 posture: 모든 신규/PII 테이블 RLS ENABLE. 쓰기·회원전용 읽기는 service_role BFF 경유.
--   anon/authenticated 브라우저엔 '공개 콘텐츠(published) 읽기'만 허용. 세밀한 auth.uid()
--   회원소유 정책은 고객 Auth 세션 확정(OTP 경로 결정) 후 확장(현재 고객 Auth 세션 없음).
-- ============================================================
create extension if not exists pgcrypto;

-- ── 회원 위성 (ERP 관리, §3.6) ───────────────────────────────
-- member_tags — CRM 태그 (localStorage erp_member_meta_<id> 이관 대상)
create table if not exists member_tags (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references members(id) on delete cascade,
  tag         text not null,                    -- VIP·재방문·가격민감·EV관심·장기렌트·법인 등
  created_by  text,
  created_at  timestamptz default now(),
  unique (member_id, tag)
);
-- member_memo — 상담 메모
create table if not exists member_memo (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references members(id) on delete cascade,
  body        text not null,
  updated_by  text,
  updated_at  timestamptz default now(),
  created_at  timestamptz default now()
);
-- member_consents — 마케팅/개인정보 동의 이력 (PIPA: 동의·철회 타임스탬프 보존)
create table if not exists member_consents (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references members(id) on delete cascade,
  purpose     text not null
                check (purpose in ('privacy_collect','marketing_recv','third_party')),  -- 개인정보수집·마케팅수신·제3자제공
  agreed      boolean not null,
  channel     text,                             -- 동의 수집 채널(web/kakao/phone)
  agreed_at   timestamptz default now(),
  withdrawn_at timestamptz,                      -- 철회 시각(NULL=유효). 철회 후 발송 대상 제외
  created_at  timestamptz default now()
);
-- marketing_sends — 일괄 발송 로그 (동의자에게만, §6.7)
create table if not exists marketing_sends (
  id          uuid primary key default gen_random_uuid(),
  segment     text,                             -- 신규/활동/휴면/동의 등
  channel     text not null check (channel in ('kakao','sms','csv')),
  member_ids  uuid[],                           -- 발송 대상(동의 재검증 후)
  template    text,
  sent_count  int default 0,
  sent_at     timestamptz default now(),
  created_by  text,
  created_at  timestamptz default now()
);

-- ── 고객 커뮤니티 (§3.6) ─────────────────────────────────────
create table if not exists community_posts (
  id          uuid primary key default gen_random_uuid(),
  member_id   uuid not null references members(id) on delete cascade,
  car         text,                             -- 차종 라벨
  topic       text check (topic in ('quote','cost','fix','end','ev')),
  title       text not null,
  body        text,
  status      text not null default 'published' check (status in ('published','hidden')),
  like_count  int default 0,
  view_count  int default 0,
  created_at  timestamptz default now()
);
create table if not exists community_answers (
  id               uuid primary key default gen_random_uuid(),
  post_id          uuid not null references community_posts(id) on delete cascade,
  author_member_id uuid references members(id) on delete set null,
  manager_id       uuid references managers(id) on delete set null,  -- 공식답변(매니저)
  is_official      boolean not null default false,
  badge            text,                         -- 차주 뱃지 라벨
  body             text not null,
  helpful_count    int default 0,
  created_at       timestamptz default now()
);
create table if not exists community_comments (
  id          uuid primary key default gen_random_uuid(),
  answer_id   uuid not null references community_answers(id) on delete cascade,
  member_id   uuid references members(id) on delete set null,
  body        text not null,
  created_at  timestamptz default now()
);
create table if not exists community_reactions (
  id          uuid primary key default gen_random_uuid(),
  target_type text not null check (target_type in ('post','answer')),
  target_id   uuid not null,
  member_id   uuid not null references members(id) on delete cascade,
  kind        text not null check (kind in ('like','helpful','curious')),
  created_at  timestamptz default now(),
  unique (target_type, target_id, member_id, kind)
);

-- 인덱스
create index if not exists idx_member_tags_member       on member_tags(member_id);
create index if not exists idx_member_memo_member        on member_memo(member_id);
create index if not exists idx_member_consents_member    on member_consents(member_id);
create index if not exists idx_community_posts_status    on community_posts(status, created_at desc);
create index if not exists idx_community_answers_post    on community_answers(post_id);
create index if not exists idx_community_comments_answer on community_comments(answer_id);
create index if not exists idx_community_reactions_target on community_reactions(target_type, target_id);

-- ── RLS ──────────────────────────────────────────────────────
-- 신규 8 테이블만 RLS ENABLE(브라우저 anon 직접접근 차단). service_role(BFF)는 우회.
-- ⚠️ 기존 members(PII)·reviews 는 별도 앱 cadam-dashboard(3101)가 anon 으로 읽을 가능성이 있어
--    교차앱 점검 전까지 RLS 미적용(후속). 신규 테이블은 현재 소비자 없음 → 안전.
alter table member_tags        enable row level security;
alter table member_memo        enable row level security;
alter table member_consents    enable row level security;
alter table marketing_sends    enable row level security;
alter table community_posts    enable row level security;
alter table community_answers  enable row level security;
alter table community_comments enable row level security;
alter table community_reactions enable row level security;

-- 공개 읽기: 게시된 커뮤니티 글 + 그 글의 답변 (비로그인 미리보기/SEO)
drop policy if exists pub_read_published on community_posts;
create policy pub_read_published on community_posts for select using (status = 'published');

drop policy if exists pub_read_answers on community_answers;
create policy pub_read_answers on community_answers for select
  using (post_id in (select id from community_posts where status = 'published'));

-- 회원 본인 동의이력 읽기(PIPA 열람권 · 고객 Auth 세션 연결 후 활성)
drop policy if exists member_self_consents on member_consents;
create policy member_self_consents on member_consents for select
  using (member_id in (select id from members where auth_user_id = auth.uid()));

-- 그 외(member_tags·member_memo·marketing_sends·community_comments·community_reactions)는
-- 정책 없음 = anon/authenticated 거부. 쓰기·집계·회원전용 열람은 전부 service_role BFF 경유.
-- ⚠️ 회원 직접 쓰기(글/답변/반응)도 BFF(service_role + 세션 검증)로 처리 — auth.uid() 쓰기 정책은
--    OTP/Auth 경로 확정 후 필요 시 추가(현재 고객 Auth 세션 부재로 미적용).

-- ── PIPA(§6.5) 운영 메모(코드/잡으로 별도 처리) ──────────────
-- · 동의 기반 수집: members.consent_marketing + member_consents(purpose별 이력).
-- · 철회: member_consents.withdrawn_at 기록 → marketing_sends 대상에서 제외(재검증).
-- · 보유기간/파기: 목적달성 후 파기(세금서류 5년). 파기 잡은 별도(여기선 스키마만).
-- · 접근/열람/파기 로그: audit_log(미생성) 또는 notification_log 확장 — 후속.
