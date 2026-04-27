-- ev_subsidies: 전기차 구매 국비보조금
-- 출처: 환경부 전기자동차 보급사업 보조금 업무처리지침 (2026년)
-- ev.or.kr 서버 이관 중으로 정적 데이터 사용. 복구 후 크롤러 교체 예정.
-- ⚠️ 실제 지급 보조금은 지자체 보조금 포함, 구매 시점·조건에 따라 다름

CREATE TABLE IF NOT EXISTS ev_subsidies (
  id             serial       PRIMARY KEY,
  brand          text         NOT NULL,              -- 브랜드 (현대, 기아)
  model          text         NOT NULL,              -- 차종명 (vehicle_msrp.model 기준)
  trim_keyword   text,                               -- 트림 키워드 (null=전 트림 동일)
  year           integer      NOT NULL DEFAULT 2026, -- 보조금 기준 연도
  subsidy_national integer    NOT NULL,              -- 국비 보조금 (만원)
  subsidy_note   text,                               -- 비고 (조건·출처)
  source_url     text,                               -- 공시 URL
  updated_at     timestamptz  NOT NULL DEFAULT now()
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_ev_subsidies_brand_model ON ev_subsidies(brand, model);
CREATE INDEX IF NOT EXISTS idx_ev_subsidies_year ON ev_subsidies(year);

-- RLS (읽기 공개)
ALTER TABLE ev_subsidies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon read ev_subsidies" ON ev_subsidies
  FOR SELECT TO anon USING (true);

-- 2026년 환경부 국비보조금 기준 데이터 (차종별 대표값)
-- 출처: 환경부 전기자동차 보급사업 보조금 업무처리지침 2026년 고시
INSERT INTO ev_subsidies (brand, model, trim_keyword, year, subsidy_national, subsidy_note) VALUES
  -- 현대
  ('현대', '캐스퍼 일렉트릭', NULL,          2026, 600, '소형·경형 EV 우대. 실제 지급액은 지자체 보조금 별도.'),
  ('현대', '코나 일렉트릭',   '스탠다드',     2026, 540, '스탠다드 배터리 기준'),
  ('현대', '코나 일렉트릭',   '롱레인지',     2026, 500, '롱레인지 기준'),
  ('현대', '아이오닉 5 (NE1)', '스탠다드',    2026, 530, '스탠다드 배터리 기준'),
  ('현대', '아이오닉 5 (NE1)', '롱레인지',    2026, 500, '롱레인지 기준'),
  ('현대', '아이오닉 6 (CE1)', '스탠다드',    2026, 530, '스탠다드 배터리 기준'),
  ('현대', '아이오닉 6 (CE1)', '롱레인지',    2026, 500, '롱레인지 기준'),
  ('현대', '아이오닉9',        NULL,          2026, 400, '대형 고가 차량 보조금 감액 적용'),
  -- 기아
  ('기아', 'EV3',              '스탠다드',    2026, 580, '소형 SUV EV, 스탠다드 기준'),
  ('기아', 'EV3',              '롱레인지',    2026, 570, '롱레인지 기준'),
  ('기아', 'EV6',              '스탠다드',    2026, 530, '스탠다드 배터리 기준'),
  ('기아', 'EV6',              '롱레인지',    2026, 500, '롱레인지 기준'),
  ('기아', 'EV9',              NULL,          2026, 400, '대형 SUV EV, 고가 감액 적용')
ON CONFLICT DO NOTHING;
