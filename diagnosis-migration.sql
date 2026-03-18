-- ============================================================
-- 카담(CADAM) 진단 모듈 — Supabase 추가 테이블
-- 기존 스키마에 추가 실행
-- ============================================================

-- 진단 설정 (질문/상품/AI 설정 JSON 저장)
CREATE TABLE IF NOT EXISTS diagnosis_config (
  id varchar(50) PRIMARY KEY,
  data jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE diagnosis_config IS '진단 모듈 설정 (질문/상품/AI)';
COMMENT ON COLUMN diagnosis_config.id IS 'finance_basic, finance_detail, vehicle_basic, vehicle_detail, products, ai_config';

-- 진단 결과 로그 (통계용)
CREATE TABLE IF NOT EXISTS diagnosis_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type varchar(20) NOT NULL,
  mode varchar(10),
  answers jsonb,
  result jsonb,
  ip_hash varchar(64),
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE diagnosis_logs IS '진단 결과 로그 (통계)';
COMMENT ON COLUMN diagnosis_logs.type IS 'finance, vehicle, option';
COMMENT ON COLUMN diagnosis_logs.mode IS 'quick, detail';

-- RLS
ALTER TABLE diagnosis_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_logs ENABLE ROW LEVEL SECURITY;

-- diagnosis_config: anon SELECT, authenticated 전체
CREATE POLICY "diagnosis_config_anon_select" ON diagnosis_config
  FOR SELECT TO anon USING (true);

CREATE POLICY "diagnosis_config_authenticated_all" ON diagnosis_config
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- diagnosis_logs: anon INSERT만, authenticated SELECT
CREATE POLICY "diagnosis_logs_anon_insert" ON diagnosis_logs
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "diagnosis_logs_authenticated_select" ON diagnosis_logs
  FOR SELECT TO authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_diagnosis_logs_type ON diagnosis_logs(type);
CREATE INDEX IF NOT EXISTS idx_diagnosis_logs_created ON diagnosis_logs(created_at DESC);
