-- CADAM: AI prompt slots + revision history for dashboard BFF
-- Apply in project xjceozajvggggzvpsrwo (SQL editor or supabase db push)

create extension if not exists pgcrypto;

create table if not exists public.ai_prompt_slots (
  id uuid primary key default gen_random_uuid(),
  stable_key text not null unique,
  workflow_id text,
  workflow_name text,
  node_id text,
  node_name text,
  slot_label text,
  source_type text not null check (source_type in (
    'prompt_versions_active',
    'review_prompt_versions_active',
    'prompt_templates_key',
    'n8n_http_jsonbody',
    'n8n_code_jscode',
    'composite'
  )),
  template_key text,
  content_column text default 'prompt_content',
  scan_meta jsonb not null default '{}',
  status text not null default 'active' check (status in ('active', 'pending_review', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_prompt_revisions (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.ai_prompt_slots (id) on delete cascade,
  content text not null,
  note text,
  created_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_ai_prompt_revisions_slot_created
  on public.ai_prompt_revisions (slot_id, created_at desc);

create index if not exists idx_ai_prompt_slots_workflow
  on public.ai_prompt_slots (workflow_id, status);

alter table public.ai_prompt_slots enable row level security;
alter table public.ai_prompt_revisions enable row level security;

-- No anon policies: dashboard uses BFF with service role only.

comment on table public.ai_prompt_slots is 'Registry of editable AI prompts (Supabase rows or n8n inline); synced by BFF scanner';
comment on table public.ai_prompt_revisions is 'Append-only history for rollback; one row per save';

-- Seed canonical slots (idempotent)
insert into public.ai_prompt_slots (stable_key, workflow_id, workflow_name, slot_label, source_type, template_key, status)
values
  ('pv:writer_active', 'flATeSx9PDV1y1Vm', 'WP-2: 콘텐츠 생성', 'Writer 시스템 프롬프트 (prompt_versions 활성)', 'prompt_versions_active', null, 'active'),
  ('rpv:review_active', 'flATeSx9PDV1y1Vm', 'WP-2: 콘텐츠 생성', '검수 프롬프트 (review_prompt_versions 활성)', 'review_prompt_versions_active', null, 'active'),
  ('pt:writer_optimizer_analysis', '29F0FFBF', 'WF-4: Writer 프롬프트 옵티마이저', '분석 템플릿', 'prompt_templates_key', 'writer_optimizer_analysis', 'active'),
  ('pt:review_optimizer_analysis', '0FCC36D8', 'WF-6: 메타 옵티마이저', '메타 분석 템플릿', 'prompt_templates_key', 'review_optimizer_analysis', 'active'),
  ('pt:brief_generation', 'flATeSx9PDV1y1Vm', 'WP-2: 콘텐츠 생성', '브리프 생성 템플릿', 'prompt_templates_key', 'brief_generation', 'active'),
  ('pt:blog_writing_structure', 'flATeSx9PDV1y1Vm', 'WP-2: 콘텐츠 생성', '글 구조/스타일', 'prompt_templates_key', 'blog_writing_structure', 'active'),
  ('pt:rewrite_instruction', '638CB597', 'WF-3: 재작성 루프', '재작성 수정지시 JSON', 'prompt_templates_key', 'rewrite_instruction', 'active')
on conflict (stable_key) do update set
  workflow_name = excluded.workflow_name,
  slot_label = excluded.slot_label,
  source_type = excluded.source_type,
  template_key = excluded.template_key,
  updated_at = now();
