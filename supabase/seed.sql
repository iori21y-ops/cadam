-- ============================================================
-- ⚠️ 시드(비-마이그레이션) — supabase/migrations 대상 아님. 스키마 변경이 아니라 초기 데이터.
-- Rentailor ERP — Seed 001 (시드 데이터)
-- 20260624120000_erp_tables.sql(구 migration_001_erp.sql) 적용 후 1회 실행. 재실행해도 중복 안 생기도록 가드.
-- ============================================================

-- 1) 매니저 (내부 상담사 + 외부 제휴 매니저)
insert into managers (name, type, team, phone, status, capacity)
select v.name, v.type, v.team, v.phone, v.status, v.capacity
from (values
  ('박지훈','internal','1팀','010-1000-0001','active',30),
  ('김서연','internal','1팀','010-1000-0002','active',30),
  ('이도현','internal','2팀','010-1000-0003','active',25),
  ('최민준','internal','2팀','010-1000-0004','rest',25),
  ('정하늘','internal','3팀','010-1000-0005','active',20),
  ('강대표','partner','제휴','010-2000-0001','active',999),
  ('윤실장','partner','제휴','010-2000-0002','active',999)
) v(name,type,team,phone,status,capacity)
where not exists (select 1 from managers m where m.name = v.name and m.type = v.type);

-- 2) 제휴 매니저 지갑 초기 충전 (50만원)
insert into wallet_transactions (manager_id, type, amount, balance_after, method, status, memo)
select m.id, 'topup', 500000, 500000, 'manual', 'completed', '초기 충전(시드)'
from managers m
where m.type = 'partner'
and not exists (select 1 from wallet_transactions w where w.manager_id = m.id);

update managers set wallet_balance = 500000 where type = 'partner' and wallet_balance = 0;

-- 3) 협의 단가 (제휴 매니저, 등급별)
insert into manager_lead_pricing (manager_id, grade, agreed_price)
select m.id, g.grade, g.price
from managers m
cross join (values ('hot',42000),('warm',22000),('cold',9000),('default',20000)) g(grade,price)
where m.type = 'partner'
on conflict (manager_id, grade) do nothing;

-- 4) 비용 원장 (이번 달 고정비)
insert into expenses (category, label, amount, occurred_on, recurring)
select v.category, v.label, v.amount, current_date, 'monthly'
from (values
  ('server','로컬·클라우드 서버',       350000),
  ('llm_api','LLM API(Gemini/Ollama)',  480000),
  ('ad','네이버·구글 광고비',          2800000),
  ('infra','크롤링·데이터 인프라',       240000),
  ('tool','SaaS 도구·구독',             250000)
) v(category,label,amount)
where not exists (select 1 from expenses e where e.label = v.label);

-- 5) 회원 (최소정보 가입 예시)
insert into members (phone, name, consent_marketing, signup_source)
select v.phone, v.name, v.consent, v.src
from (values
  ('010-1234-5678','김도윤',true,'landing'),
  ('010-2345-6789','이서연',true,'diag'),
  ('010-3456-7890','박지우',false,'naver')
) v(phone,name,consent,src)
on conflict (phone) do nothing;

-- 6) 후기 (게시 예시)
insert into reviews (display_name, car, method, rating, title, body, saved_was, saved_now, status, published_at)
select v.display_name, v.car, v.method, v.rating, v.title, v.body, v.saved_was, v.saved_now, 'published', now()
from (values
  ('김O진','현대 그랜저','장기렌트 48개월',5,'법인 비용처리까지 깔끔','캐피탈 9곳 비교해줘서 직접 알아볼 필요가 없었어요.',85,72),
  ('이O우','테슬라 모델 Y','장기렌트 36개월',5,'전기차 첫 구독, 보험까지 한 번에','비대면으로 3일 만에 계약 끝났어요.',0,0),
  ('박O서','기아 쏘렌토','장기렌트 48개월',5,'7인승 패밀리카, 초기비용 0원','목돈 부담 없이 시작할 수 있어 좋았어요.',80,69)
) v(display_name,car,method,rating,title,body,saved_was,saved_now)
where not exists (select 1 from reviews r where r.display_name = v.display_name and r.car = v.car);

-- 7) 기존 consultations → 판매 원장 연결 (매출 데이터 생성)
--    assigned_to 가 있는 상담을 매니저에 라운드로빈 배정 + 판매 기록.
with assigned_consults as (
  select c.id, row_number() over (order by c.created_at) rn
  from consultations c
  where c.assigned_to is not null
    and not exists (select 1 from lead_sales s where s.consultation_id = c.id)
),
mgr as (
  select id, row_number() over (order by created_at) rn
  from managers
)
insert into lead_sales (consultation_id, manager_id, channel, sale_price, grade, status)
select ac.id,
       (select id from mgr where mgr.rn = ((ac.rn - 1) % (select count(*) from mgr)) + 1),
       'distribute', 22000, 'warm', 'sold'
from assigned_consults ac;

-- consultations.manager_id 도 채워두기(레거시 assigned_to → FK 이관 예시)
update consultations c
set manager_id = s.manager_id
from lead_sales s
where s.consultation_id = c.id and c.manager_id is null;

-- 8) 성공보수 예시 (계약된 상담 일부)
insert into success_fees (consultation_id, manager_id, fee_amount, status, confirmed_at)
select s.consultation_id, s.manager_id, 150000, 'confirmed', now()
from lead_sales s
where not exists (select 1 from success_fees f where f.consultation_id = s.consultation_id)
limit 5;

-- ============================================================
-- 확인용 쿼리(선택):
--   select * from v_pnl_monthly;
--   select type, count(*) from managers group by type;
--   select status, count(*) from reviews group by status;
-- ============================================================
