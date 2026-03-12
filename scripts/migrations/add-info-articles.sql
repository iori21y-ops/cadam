-- 기존 DB에 info_articles 테이블 추가 (이미 supabase-schema.sql을 처음부터 실행한 경우 불필요)

CREATE TABLE IF NOT EXISTS info_articles (
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

ALTER TABLE info_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "info_articles_anon_select" ON info_articles
  FOR SELECT TO anon
  USING (is_active = true);

CREATE POLICY "info_articles_authenticated_all" ON info_articles
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_info_articles_active ON info_articles(is_active, display_order);
