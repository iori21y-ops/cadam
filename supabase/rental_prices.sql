-- rental_prices — 캐피탈사별 월렌탈료 시세 테이블
-- 생성일: 2026-04-27
-- 용도: Phase 1 수동 시세 입력 → Phase 2 캐피탈사 API 자동 연동으로 교체 예정

CREATE TABLE IF NOT EXISTS rental_prices (
  id                   BIGSERIAL PRIMARY KEY,
  brand                TEXT NOT NULL,
  model                TEXT NOT NULL,
  trim                 TEXT,
  monthly_price        INTEGER NOT NULL,
  contract_months      INTEGER NOT NULL DEFAULT 60,
  annual_km            INTEGER NOT NULL DEFAULT 10000,
  deposit_rate         NUMERIC(3,1) NOT NULL DEFAULT 0,
  prepayment_rate      NUMERIC(3,1) NOT NULL DEFAULT 0,
  includes_insurance   BOOLEAN NOT NULL DEFAULT true,
  includes_tax         BOOLEAN NOT NULL DEFAULT true,
  includes_maintenance BOOLEAN NOT NULL DEFAULT true,
  source               TEXT,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rental_prices_brand_model ON rental_prices(brand, model);

ALTER TABLE rental_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access" ON rental_prices FOR SELECT USING (true);

-- 샘플 데이터 (월렌탈료 단위: 만원)
INSERT INTO rental_prices (brand, model, trim, monthly_price) VALUES
  ('현대', '싼타페', '가솔린 2.5 프리미엄',    62),
  ('현대', '싼타페', '디젤 2.2 프리미엄',      65),
  ('현대', '싼타페', '하이브리드 1.6 프리미엄', 68),
  ('기아', 'K5',    '가솔린 2.0 프레스티지',   45),
  ('기아', 'K5',    '하이브리드 1.6 프레스티지', 48);
