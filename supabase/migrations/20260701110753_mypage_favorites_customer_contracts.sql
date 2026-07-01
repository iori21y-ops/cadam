-- =============================================================
-- Migration: 마이페이지 개편 - 신규 테이블 2개
--   ① favorites            : 회원 찜(관심 차량)
--   ② customer_contracts   : 회원별 계약 + 금융조건 (B안: 신설)
-- =============================================================
-- 전제(확정사실):
--   - members 존재 (grade·points 컬럼 없음, 컬럼 추가 금지)
--   - members.id 는 auth.users FK 아님. auth_user_id(nullable uuid)가 Auth 연결
--   - vehicle_slug / car_slug 는 FK 없이 text
--     (slug 원천이 코드상수 @/constants/vehicles → DB에 없는 slug 가능)
--   - 포인트 잔액은 point_transactions 합산 (여기서 다루지 않음)
--   - 회원 등급 grade 는 members 컬럼 추가 미결정 (여기서 다루지 않음)
--   - capital_directory PK 는 capital_id(text) — 'id' 컬럼/uuid 아님(module12_tables.sql:8)
-- 결정: 계약 금융조건 = (B) customer_contracts 신설
-- 파일명 규칙: 20260701HHMMSS_*.sql (직전 최신 20260630120000)
-- =============================================================


-- =============================================================
-- ① favorites : 회원 찜(관심 차량)
-- =============================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     uuid        NOT NULL
                  REFERENCES public.members(id) ON DELETE CASCADE,
  vehicle_slug  text        NOT NULL,          -- FK 없음: slug 원천이 코드상수
  created_at    timestamptz NOT NULL DEFAULT now(),

  -- 같은 회원이 같은 차량을 중복 찜 방지
  CONSTRAINT favorites_member_slug_unique UNIQUE (member_id, vehicle_slug)
);

COMMENT ON TABLE  public.favorites               IS '회원 찜(관심 차량). vehicle_slug는 코드상수 @/constants/vehicles 원천이라 FK 없음';
COMMENT ON COLUMN public.favorites.vehicle_slug  IS 'DB에 없는 slug도 저장 가능 (FK 미설정 의도적)';

CREATE INDEX IF NOT EXISTS idx_favorites_member_id
  ON public.favorites (member_id);
CREATE INDEX IF NOT EXISTS idx_favorites_member_created
  ON public.favorites (member_id, created_at DESC);


-- =============================================================
-- ② customer_contracts : 회원별 계약 + 금융조건 (B안)
-- =============================================================
-- 설계 의도:
--   contract_vehicles(상품 카탈로그)와 분리.
--   회원 1명이 특정 car_slug로 맺은 "계약 인스턴스"를 표현.
--   금융조건(월납입·기간·보증금 등)을 이 행에 귀속.
--   capital_directory 참조는 nullable FK로 연결(어느 캐피탈사 상품인지).
-- =============================================================
CREATE TABLE IF NOT EXISTS public.customer_contracts (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id           uuid        NOT NULL
                        REFERENCES public.members(id) ON DELETE CASCADE,

  -- 차량 식별 (FK 없이 text: favorites와 동일 원칙)
  car_slug            text        NOT NULL,
  car_name            text,                       -- 표시용 스냅샷(차량명 변경 대비)

  -- 계약 형태 / 상태
  contract_type       text        NOT NULL DEFAULT 'rental',
                        -- 'rental'(장기렌트) | 'lease'(리스) | 'installment'(할부)
  status              text        NOT NULL DEFAULT 'active',
                        -- 'active' | 'pending' | 'completed' | 'cancelled'

  -- 금융조건 (핵심)
  -- capital_directory PK 는 capital_id(text) 이므로 참조 컬럼·타입을 맞춤(초안의 id/uuid 오류 수정)
  capital_id          text        REFERENCES public.capital_directory(capital_id) ON DELETE SET NULL,
  monthly_payment     integer,                    -- 월 납입금 (원)
  term_months         integer,                    -- 계약 기간 (개월)
  deposit             integer,                    -- 보증금 (원)
  prepayment          integer,                    -- 선수금/선납금 (원)
  residual_value      integer,                    -- 인수/잔존가치 (원)
  annual_km_limit     integer,                    -- 연간 약정 주행거리 (km)

  -- 계약 케어용 날짜
  contract_start_date date,
  contract_end_date   date,

  note                text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT customer_contracts_type_chk
    CHECK (contract_type IN ('rental','lease','installment')),
  CONSTRAINT customer_contracts_status_chk
    CHECK (status IN ('active','pending','completed','cancelled'))
);

COMMENT ON TABLE  public.customer_contracts                  IS '회원별 계약 인스턴스 + 금융조건 (B안: contract_vehicles 카탈로그와 분리 신설)';
COMMENT ON COLUMN public.customer_contracts.car_slug         IS 'FK 없음: slug 원천이 코드상수. DB에 없는 slug 가능';
COMMENT ON COLUMN public.customer_contracts.capital_id       IS 'capital_directory(capital_id text) 참조. 캐피탈사 삭제 시 SET NULL(계약 이력 보존)';
COMMENT ON COLUMN public.customer_contracts.monthly_payment  IS '단위: 원';

CREATE INDEX IF NOT EXISTS idx_customer_contracts_member_id
  ON public.customer_contracts (member_id);
CREATE INDEX IF NOT EXISTS idx_customer_contracts_member_status
  ON public.customer_contracts (member_id, status);
CREATE INDEX IF NOT EXISTS idx_customer_contracts_capital_id
  ON public.customer_contracts (capital_id);


-- updated_at 자동 갱신 트리거
-- (프로젝트에 공용 set_updated_at() 함수가 없을 수 있어 안전하게 생성)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customer_contracts_updated_at ON public.customer_contracts;
CREATE TRIGGER trg_customer_contracts_updated_at
  BEFORE UPDATE ON public.customer_contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- =============================================================
-- RLS : 회원 본인 데이터만 접근
-- =============================================================
-- 본인 판별 표준 패턴 (선례: contract_vehicles=module12_tables.sql:90,
--   member_community=member_community.sql:129):
--     member_id in (select id from members where auth_user_id = auth.uid())
--   (members.id 는 auth.users FK 아님. auth_user_id 컬럼이 Auth 연결)
--
-- 쓰기 정책:
--   members 자체에도 아직 auth.uid() 본인행 쓰기 정책 미적용 상태이고
--   (OTP 라이브 전, auth_user_id 비어있음), 회원 쓰기는 service_role BFF 경유.
--   → SELECT(본인 조회) 정책만 만들고, INSERT/DELETE/UPDATE 는
--     service_role(RLS 우회) 경유로 처리. anon/authenticated 직접 쓰기 불가.
--   → OTP 라이브 후 auth_user_id 가 채워지면 별도 migration 에서
--     회원 self-service 쓰기 정책 추가.
-- =============================================================
ALTER TABLE public.favorites          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_contracts ENABLE ROW LEVEL SECURITY;

-- favorites : 본인 조회만
DROP POLICY IF EXISTS favorites_select_own ON public.favorites;
CREATE POLICY favorites_select_own ON public.favorites
  FOR SELECT USING (
    member_id in (select id from public.members where auth_user_id = auth.uid())
  );

-- customer_contracts : 본인 조회만
DROP POLICY IF EXISTS customer_contracts_select_own ON public.customer_contracts;
CREATE POLICY customer_contracts_select_own ON public.customer_contracts
  FOR SELECT USING (
    member_id in (select id from public.members where auth_user_id = auth.uid())
  );

-- INSERT/UPDATE/DELETE 정책 없음(의도적).
-- service_role 은 RLS 우회하므로 BFF 서버 삽입/수정/삭제는 정상 동작.
-- 찜 추가/삭제, 계약 생성 모두 현재는 service_role BFF 경유 전제.

-- =============================================================
-- END
-- =============================================================
