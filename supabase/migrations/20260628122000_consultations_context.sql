-- ============================================================
-- Migration 004 — consultations.context (jsonb) (§3.4C)
-- 목적: 정규 33컬럼에 안 맞는 진입점별 맥락(차급 cls 라벨·vehicleAnswers/financeAnswers
--       요약·비교/계산 결과 등)을 단일 jsonb 한 컬럼에 보존. 정규 컬럼 난립 방지.
-- 불변: 기존 lead_dimensions(점수)·monthly_budget(고유 컬럼)은 그대로.
-- 안전: additive · nullable · 멱등(add column if not exists). 기존 insert 호환 유지.
-- ============================================================

alter table consultations add column if not exists context jsonb;

-- 롤백(필요 시): alter table consultations drop column context;
