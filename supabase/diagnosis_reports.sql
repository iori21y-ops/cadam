-- diagnosis_reports: 감가상각 진단 리포트 실행 이력
-- 사용: 진단 완료 후 저장 (익명 집계 → 인기 차종/트림 파악)
-- Phase 3 이후 상담 전환율 분석에 활용

CREATE TABLE IF NOT EXISTS diagnosis_reports (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 차량 정보
  brand           text          NOT NULL,              -- '현대', '기아'
  model           text          NOT NULL,              -- '아반떼'
  trim_name       text,                                -- '스마트'
  model_year      integer,                             -- 2022
  fuel_type       text,                                -- 'gasoline' | 'hybrid' | 'ev' | 'diesel' | 'lpg'
  msrp_price      integer,                             -- 신차가 (만원)
  mileage_group   text,                                -- 'low' | 'mid' | 'high'

  -- 계산 결과 핵심값
  current_value   integer,                             -- 현재 시세 추정 (만원)
  retention_rate  numeric(4,3),                        -- 잔존가치율 (0~1)
  vehicle_age     integer,                             -- 차령 (년)
  annual_auto_tax integer,                             -- 연간 자동차세 (만원)
  acquisition_tax integer,                             -- 취득세 (만원)

  -- API 연동 결과 (비동기 로딩 값)
  annual_insurance_mk integer,                         -- 연간 보험료 추정 (만원)
  monthly_fuel_mk     integer,                         -- 월 유류비 추정 (만원)

  -- 전환 여부
  quote_clicked   boolean       NOT NULL DEFAULT false, -- 견적 신청 버튼 클릭 여부
  consultation_id uuid,                                -- consultations.id FK (선택적)

  -- 메타
  ip_hash         text,                                -- IP 해시 (개인 식별 불가)
  user_agent      text,
  created_at      timestamptz   NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_diag_reports_brand_model ON diagnosis_reports(brand, model);
CREATE INDEX IF NOT EXISTS idx_diag_reports_fuel_type   ON diagnosis_reports(fuel_type);
CREATE INDEX IF NOT EXISTS idx_diag_reports_created_at  ON diagnosis_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_diag_reports_quote       ON diagnosis_reports(quote_clicked) WHERE quote_clicked = true;

-- 외래키 (consultations 존재 시)
-- ALTER TABLE diagnosis_reports
--   ADD CONSTRAINT fk_diag_reports_consultation
--   FOREIGN KEY (consultation_id) REFERENCES consultations(id) ON DELETE SET NULL;

-- RLS: anon INSERT 허용, SELECT는 service_role만
ALTER TABLE diagnosis_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon insert diagnosis_reports" ON diagnosis_reports
  FOR INSERT TO anon WITH CHECK (true);

-- 서비스 롤은 모든 작업 허용 (정책 없이 기본 허용)
