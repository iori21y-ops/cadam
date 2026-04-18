import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
const envVars = {};
readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length) envVars[key.trim()] = rest.join('=').trim();
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY'] || envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL 또는 KEY 없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 쿼리 1: pricing 테이블 구조 (첫 행 키로 컬럼 유추)
console.log('\n=== 쿼리 1: pricing 테이블 컬럼 구조 ===');
const { data: sampleRow, error: e1 } = await supabase.from('pricing').select('*').limit(1);
if (e1) {
  console.log('pricing 테이블 오류:', e1.message);
} else if (sampleRow && sampleRow.length > 0) {
  console.log('컬럼:', Object.keys(sampleRow[0]).join(', '));
  console.log('첫 행 예시:', JSON.stringify(sampleRow[0], null, 2));
} else {
  console.log('pricing 테이블 존재하나 데이터 0건');
}

// 쿼리 2: vehicles 테이블 샘플
console.log('\n=== 쿼리 2: vehicles 테이블 (slug, is_active, display_order) ===');
const { data: vehicles, error: e2 } = await supabase
  .from('vehicles')
  .select('id, slug, is_active, display_order')
  .order('display_order', { ascending: true })
  .limit(10);
if (e2) {
  console.log('vehicles 오류:', e2.message);
} else {
  console.table(vehicles);
}

// 쿼리 3: pricing 전체 데이터 (최대 10건)
console.log('\n=== 쿼리 3: pricing 현재 데이터 (최대 10건) ===');
const { data: pricing, error: e3 } = await supabase.from('pricing').select('*').limit(10);
if (e3) {
  console.log('pricing 오류:', e3.message);
} else if (!pricing || pricing.length === 0) {
  console.log('데이터 없음 (0건)');
} else {
  console.log(`총 ${pricing.length}건`);
  console.table(pricing);
}
