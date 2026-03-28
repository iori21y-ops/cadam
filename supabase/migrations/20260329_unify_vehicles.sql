-- ============================================================
-- CADAM 마이그레이션: vehicle_settings + vehicles 통합
-- 날짜: 2026-03-29
-- 목적: 웹앱과 n8n 파이프라인의 차량/가격 테이블 단일화
-- ============================================================

-- STEP 1: vehicles 테이블에 웹앱용 컬럼 추가
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS model_code TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS display_order INT DEFAULT 99;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS fuel_type TEXT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS min_price INT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS max_price INT;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS similar_cars TEXT[];
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
-- vehicle_settings 호환 컬럼 (is_visible, thumbnail_url, car_brand, car_model은
-- 각각 is_active, image_url, manufacturer, name으로 이미 존재하므로 추가 불필요)

-- slug unique index (이미 있으면 무시)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vehicles_slug') THEN
    CREATE UNIQUE INDEX idx_vehicles_slug ON vehicles(slug) WHERE slug IS NOT NULL;
  END IF;
END $$;

-- name unique index (n8n upsert에서 사용, 이미 있으면 무시)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_vehicles_name') THEN
    CREATE UNIQUE INDEX idx_vehicles_name ON vehicles(name);
  END IF;
END $$;

-- STEP 2: 기존 5종 차량에 웹앱용 필드 추가
UPDATE vehicles SET slug='carnival',  model_code='KA4', category='다목적', display_order=12, fuel_type='디젤' WHERE name='카니발' AND slug IS NULL;
UPDATE vehicles SET slug='tucson',    model_code='NX4', category='SUV',    display_order=3,  fuel_type='하이브리드' WHERE name='투싼' AND slug IS NULL;
UPDATE vehicles SET slug='avante',    model_code='CN7', category='세단',   display_order=1,  fuel_type='하이브리드' WHERE name='아반떼' AND slug IS NULL;
UPDATE vehicles SET slug='grandeur',  model_code='GN7', category='세단',   display_order=2,  fuel_type='하이브리드' WHERE name='그랜저' AND slug IS NULL;
UPDATE vehicles SET slug='sonata',    model_code='',    category='세단',   display_order=13, fuel_type='하이브리드' WHERE name='쏘나타' AND slug IS NULL;

-- STEP 3: 신규 8종 차량 INSERT (웹앱에만 있던 것들)
INSERT INTO vehicles (name, manufacturer, year, vehicle_type, engine, seats, price_range, competitors, target, residual_grade, memo, image_url, is_active, slug, model_code, category, display_order, fuel_type, similar_cars)
VALUES
('싼타페','현대',2026,'중형 SUV','1.6T(12.8km/L), 1.6HEV(15.3km/L)','5인승','3,600만~5,200만 원','쏘렌토, 투싼','30~40대 가장, 캠핑족','B','⚠️시세확인','/cars/hyundai-santafe.webp',true,'santafe','MX5','SUV',4,'하이브리드',ARRAY['sorento','tucson']),
('팰리세이드','현대',2026,'대형 SUV','3.8GDi(9.2km/L), 2.2D(12.0km/L)','7인승','4,200만~5,800만 원','카니발, 모하비','40~50대 임원, 대가족','B','⚠️시세확인','/cars/hyundai-palisade.webp',true,'palisade','LX2','SUV',5,'디젤',ARRAY['carnival','sorento']),
('아이오닉 5','현대',2026,'전기차 SUV','전기 모터(롱레인지 429km)','5인승','4,800만~6,200만 원','아이오닉 6, EV6','30~40대 얼리어답터','C','⚠️시세확인','/cars/hyundai-ioniq5.webp',true,'ioniq5','NE1','전기차',6,'전기',ARRAY['ioniq6']),
('아이오닉 6','현대',2026,'전기차 세단','전기 모터(롱레인지 524km)','5인승','4,600만~5,800만 원','아이오닉 5, 테슬라 모델3','30대 직장인, 디자인 중시','C','⚠️시세확인','/cars/hyundai-ioniq6.webp',true,'ioniq6','CE1','전기차',7,'전기',ARRAY['ioniq5']),
('K5','기아',2026,'중형 세단','1.6T(12.8km/L), 2.0HEV(18.0km/L)','5인승','2,900만~4,100만 원','쏘나타, 캠리','30~40대 직장인, 법인','B','⚠️시세확인','/cars/kia-k5.webp',true,'k5','','세단',8,'하이브리드',ARRAY['sonata']),
('K8','기아',2026,'준대형 세단','1.6T(11.2km/L), 1.6HEV(16.5km/L)','5인승','4,000만~5,500만 원','그랜저, 크라운','40~50대 임원, 법인','B','⚠️시세확인','/cars/kia-k8.webp',true,'k8','','세단',9,'하이브리드',ARRAY['grandeur']),
('스포티지','기아',2026,'준중형 SUV','1.6T(12.6km/L), 1.6HEV(15.8km/L)','5인승','2,800만~4,000만 원','투싼, 셀토스','30대 직장인, 신혼부부','B','⚠️시세확인','/cars/kia-sportage.webp',true,'sportage','NQ5','SUV',10,'하이브리드',ARRAY['tucson']),
('쏘렌토','기아',2026,'중형 SUV','2.2D(13.2km/L), 1.6HEV(14.8km/L)','5/7인승','3,700만~5,300만 원','싼타페, 투싼','30~40대 가장, 다자녀','B','⚠️시세확인','/cars/kia-sorento.webp',true,'sorento','MQ4','SUV',11,'하이브리드',ARRAY['santafe','tucson'])
ON CONFLICT (name) DO UPDATE SET
  slug=EXCLUDED.slug, model_code=EXCLUDED.model_code, category=EXCLUDED.category,
  display_order=EXCLUDED.display_order, fuel_type=EXCLUDED.fuel_type,
  similar_cars=EXCLUDED.similar_cars, image_url=EXCLUDED.image_url;

-- STEP 4: 기존 5종 similar_cars 업데이트
UPDATE vehicles SET similar_cars=ARRAY['sorento','tucson'] WHERE slug='carnival';
UPDATE vehicles SET similar_cars=ARRAY['sportage'] WHERE slug='tucson';
UPDATE vehicles SET similar_cars=ARRAY['k5'] WHERE slug='avante';
UPDATE vehicles SET similar_cars=ARRAY['k8'] WHERE slug='grandeur';
UPDATE vehicles SET similar_cars=ARRAY['k5'] WHERE slug='sonata';

-- STEP 5: vehicle_settings 나머지 항목을 vehicles에 삽입
-- (13종 외 34종: 하이브리드, EV, 제네시스, 트럭 등)
INSERT INTO vehicles (name, manufacturer, slug, is_active, display_order, image_url, min_price, max_price)
SELECT
  vs.car_model,
  vs.car_brand,
  vs.vehicle_slug,
  vs.is_visible,
  vs.display_order,
  vs.thumbnail_url,
  CASE WHEN vs.min_car_price IS NOT NULL THEN (vs.min_car_price / 10000)::int ELSE NULL END,
  CASE WHEN vs.max_car_price IS NOT NULL THEN (vs.max_car_price / 10000)::int ELSE NULL END
FROM vehicle_settings vs
WHERE vs.vehicle_slug NOT IN (SELECT slug FROM vehicles WHERE slug IS NOT NULL)
ON CONFLICT (name) DO NOTHING;

-- STEP 6: v_price_ranges 자동 집계 뷰
CREATE OR REPLACE VIEW v_price_ranges AS
SELECT
  p.vehicle_name,
  v.slug,
  v.category,
  LEAST(MIN(NULLIF(p.m36,0)), MIN(NULLIF(p.m48,0)), MIN(NULLIF(p.m60,0))) AS min_price,
  GREATEST(MAX(NULLIF(p.m36,0)), MAX(NULLIF(p.m48,0)), MAX(NULLIF(p.m60,0))) AS max_price,
  COUNT(*) AS trim_count,
  array_agg(DISTINCT p.method) AS available_methods
FROM pricing p
JOIN vehicles v ON v.name = p.vehicle_name
GROUP BY p.vehicle_name, v.slug, v.category;

-- STEP 7: pricing 변경 시 vehicles.min_price/max_price 자동 동기화 트리거
CREATE OR REPLACE FUNCTION sync_vehicle_prices()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE vehicles v SET
    min_price = sub.min_price,
    max_price = sub.max_price,
    updated_at = now()
  FROM (
    SELECT vehicle_name,
      LEAST(MIN(NULLIF(m36,0)),MIN(NULLIF(m48,0)),MIN(NULLIF(m60,0))) AS min_price,
      GREATEST(MAX(NULLIF(m36,0)),MAX(NULLIF(m48,0)),MAX(NULLIF(m60,0))) AS max_price
    FROM pricing
    WHERE vehicle_name = COALESCE(NEW.vehicle_name, OLD.vehicle_name)
    GROUP BY vehicle_name
  ) sub
  WHERE v.name = sub.vehicle_name;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_vehicle_prices ON pricing;
CREATE TRIGGER trg_sync_vehicle_prices
  AFTER INSERT OR UPDATE OR DELETE ON pricing
  FOR EACH ROW EXECUTE FUNCTION sync_vehicle_prices();

-- STEP 8: RLS 정책 (anon 읽기 허용 — 기존 정책과 충돌 방지)
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='vehicles' AND policyname='vehicles_anon_read') THEN
    CREATE POLICY vehicles_anon_read ON vehicles FOR SELECT TO anon USING (is_active = true);
  END IF;
END $$;

-- STEP 9: 구 테이블 DEPRECATED 표시 (삭제는 나중에)
COMMENT ON TABLE vehicle_settings IS '⚠️ DEPRECATED 2026-03-29: vehicles 테이블로 통합됨. 2주 후 삭제 예정.';
COMMENT ON TABLE price_ranges IS '⚠️ DEPRECATED 2026-03-29: v_price_ranges 뷰로 대체됨. 2주 후 삭제 예정.';
