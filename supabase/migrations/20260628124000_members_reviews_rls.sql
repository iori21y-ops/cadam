-- ============================================================
-- Migration — members·reviews RLS ENABLE (회원 PII 노출 차단, §6.5 PIPA)
-- 전제(감사 완료 2026-06-28): cadam-web·cadam-dashboard 모두 members/reviews 를
--   service_role(BFF)로만 접근(anon 클라이언트 없음) → RLS 켜도 미파손.
-- posture: members = deny-default(공개정책 없음 = service_role 전용, PII 보호).
--          reviews = deny-default + 게시(published) 후기만 공개읽기.
-- ============================================================

alter table members enable row level security;
alter table reviews enable row level security;

-- 게시된 후기 공개읽기(비로그인/SEO). 그 외 reviews·members 전부 service_role BFF 전용.
drop policy if exists pub_read_published on reviews;
create policy pub_read_published on reviews for select using (status = 'published');

-- ⚠️ members 는 공개/anon 정책 없음 — PII(휴대폰·이름). 회원 본인 조회는 BFF(세션) 경유.
--    고객 Auth 세션 확정 후 auth.uid() 기반 본인행 정책 추가 가능(현재 미적용).

-- 롤백: alter table members disable row level security; alter table reviews disable row level security;
