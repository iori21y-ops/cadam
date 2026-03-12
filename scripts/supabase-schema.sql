-- ============================================================
-- 카담(CADAM) 장기렌터카 — Supabase 스키마
-- PRD 3. Database & Security 기반
-- ============================================================

-- ------------------------------------------------------------
-- 1. consultations (고객 상담 신청 + CRM)
-- ------------------------------------------------------------
CREATE TABLE consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(50) NOT NULL,
  phone varchar(20) NOT NULL,
  car_brand varchar(20),
  car_model varchar(50),
  trim varchar(50),
  contract_months int,
  annual_km int,
  deposit int,
  prepayment_pct int,
  monthly_budget int,
  estimated_min int,
  estimated_max int,
  status varchar(20) DEFAULT 'pending',
  assigned_to varchar(50),
  step_completed int DEFAULT 0,
  privacy_agreed boolean NOT NULL,
  device_type varchar(20),
  utm_source varchar(100),
  referrer varchar(200),
  inflow_page varchar(50),
  lead_score int DEFAULT 0,
  ip_hash varchar(64),
  memo text,
  callback_time timestamptz,
  consult_result varchar(20),
  kakao_sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE consultations IS '고객 상담 신청 + CRM';
COMMENT ON COLUMN consultations.status IS 'pending, consulting, completed';
COMMENT ON COLUMN consultations.consult_result IS 'contracted, competitor, hold, no_answer, cancelled';

-- ------------------------------------------------------------
-- 2. price_ranges (차종별 렌트료 범위)
-- ------------------------------------------------------------
CREATE TABLE price_ranges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  car_brand varchar(20) NOT NULL,
  car_model varchar(50) NOT NULL,
  contract_months int NOT NULL,
  annual_km int NOT NULL,
  min_monthly int NOT NULL,
  max_monthly int NOT NULL,
  conditions jsonb,
  is_active boolean DEFAULT true,
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE price_ranges IS '차종별 렌트료 범위';
COMMENT ON COLUMN price_ranges.conditions IS '보증금/선납금별 하드코딩 원화 금액. JSON 파싱만 허용.';

-- ------------------------------------------------------------
-- 3. promotions (프로모션 배너)
-- ------------------------------------------------------------
CREATE TABLE promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(100) NOT NULL,
  description text,
  image_url varchar(500),
  link_url varchar(500),
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  start_date date,
  end_date date
);

COMMENT ON TABLE promotions IS '프로모션 배너';

-- ------------------------------------------------------------
-- 4. info_articles (정보 페이지 블로그/유튜브 포스팅)
-- ------------------------------------------------------------
CREATE TABLE info_articles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar(200) NOT NULL,
  excerpt text,
  link_url varchar(500) NOT NULL,
  thumbnail_url varchar(500),
  source_type varchar(20) DEFAULT 'blog',
  published_at timestamptz,
  is_active boolean DEFAULT true,
  display_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE info_articles IS '정보 페이지 블로그/유튜브 포스팅';
COMMENT ON COLUMN info_articles.source_type IS 'blog, youtube, internal';

-- ------------------------------------------------------------
-- 5. notification_log (알림 발송 이력)
-- ------------------------------------------------------------
CREATE TABLE notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  consultation_id uuid REFERENCES consultations(id) ON DELETE SET NULL,
  channel varchar(20),
  status varchar(20),
  sent_at timestamptz DEFAULT now(),
  error_message text
);

COMMENT ON TABLE notification_log IS '알림 발송 이력';
COMMENT ON COLUMN notification_log.channel IS 'email, kakao, sms';
COMMENT ON COLUMN notification_log.status IS 'sent, failed, pending';

-- ------------------------------------------------------------
-- 6. Row Level Security (RLS)
-- ------------------------------------------------------------
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_ranges ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE info_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

-- consultations: anon INSERT만, authenticated SELECT/UPDATE
CREATE POLICY "consultations_anon_insert" ON consultations
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "consultations_authenticated_select" ON consultations
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "consultations_authenticated_update" ON consultations
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- price_ranges: anon SELECT (is_active=true만), authenticated 전체
CREATE POLICY "price_ranges_anon_select" ON price_ranges
  FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "price_ranges_authenticated_all" ON price_ranges
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- promotions: anon SELECT (is_active=true만), authenticated 전체
CREATE POLICY "promotions_anon_select" ON promotions
  FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "promotions_authenticated_all" ON promotions
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- info_articles: anon SELECT (is_active=true만), authenticated 전체
CREATE POLICY "info_articles_anon_select" ON info_articles
  FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "info_articles_authenticated_all" ON info_articles
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- notification_log: anon 접근 불가, authenticated SELECT/INSERT/UPDATE
CREATE POLICY "notification_log_authenticated_select" ON notification_log
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "notification_log_authenticated_insert" ON notification_log
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "notification_log_authenticated_update" ON notification_log
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- ------------------------------------------------------------
-- 7. Indexes
-- ------------------------------------------------------------
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_created ON consultations(created_at DESC);
CREATE INDEX idx_consultations_lead_score ON consultations(lead_score DESC);
CREATE INDEX idx_consultations_callback ON consultations(callback_time) WHERE callback_time IS NOT NULL;
CREATE INDEX idx_consultations_ip_hash ON consultations(ip_hash);
CREATE INDEX idx_price_ranges_lookup ON price_ranges(car_brand, car_model, contract_months, annual_km);
CREATE INDEX idx_promotions_active ON promotions(is_active, display_order);
CREATE INDEX idx_info_articles_active ON info_articles(is_active, display_order);
CREATE INDEX idx_notification_log_consult ON notification_log(consultation_id);
