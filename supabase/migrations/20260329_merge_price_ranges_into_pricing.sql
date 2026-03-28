-- ============================================================
-- CADAM 마이그레이션: price_ranges → pricing 통합
-- 날짜: 2026-03-29
-- 목적: pricing 테이블에 price_ranges 컬럼 추가하여 단일 테이블로 통합
-- ============================================================

-- STEP 1: 기존 NOT NULL 제약 완화 (price_ranges 행은 이 컬럼 불필요)
ALTER TABLE pricing ALTER COLUMN vehicle_name DROP NOT NULL;
ALTER TABLE pricing ALTER COLUMN method DROP NOT NULL;
ALTER TABLE pricing ALTER COLUMN trim DROP NOT NULL;

-- STEP 2: pricing 테이블에 price_ranges 컬럼 추가
ALTER TABLE pricing ADD COLUMN IF NOT EXISTS car_brand TEXT;
ALTER TABLE pricing ADD COLUMN IF NOT EXISTS car_model TEXT;
ALTER TABLE pricing ADD COLUMN IF NOT EXISTS contract_months INT;
ALTER TABLE pricing ADD COLUMN IF NOT EXISTS annual_km INT;
ALTER TABLE pricing ADD COLUMN IF NOT EXISTS min_monthly INT;
ALTER TABLE pricing ADD COLUMN IF NOT EXISTS max_monthly INT;
ALTER TABLE pricing ADD COLUMN IF NOT EXISTS conditions JSONB;
ALTER TABLE pricing ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- STEP 3: price_ranges 데이터를 pricing에 이관
INSERT INTO pricing (car_brand, car_model, contract_months, annual_km, min_monthly, max_monthly, conditions, is_active, updated_at)
SELECT car_brand, car_model, contract_months, annual_km, min_monthly, max_monthly, conditions, is_active, updated_at
FROM price_ranges;

-- STEP 4: 기존 pricing 행(n8n 파이프라인 데이터)에도 is_active 설정
UPDATE pricing SET is_active = true WHERE is_active IS NULL;

-- STEP 5: price_ranges DEPRECATED 코멘트
COMMENT ON TABLE price_ranges IS '⚠️ DEPRECATED 2026-03-29: pricing 테이블로 통합 완료. 2주 후 삭제 예정.';
