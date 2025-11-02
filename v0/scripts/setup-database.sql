-- 事前登録者テーブル
CREATE TABLE waiting_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  type TEXT, -- 'student' | 'company'
  name TEXT,
  interest_score INT,
  referrer TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 案件テーブル
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  budget TEXT,
  deadline DATE,
  description TEXT,
  contact_info TEXT NOT NULL, -- 企業連絡先（非公開）
  status TEXT DEFAULT 'review', -- 'review', 'public', 'rejected', 'closed'
  rating_avg DOUBLE PRECISION,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 応募テーブル
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  appeal TEXT NOT NULL,
  organization_name TEXT,
  contact_info TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at);
CREATE INDEX idx_applications_project_id ON applications(project_id);
CREATE INDEX idx_applications_created_at ON applications(created_at);

-- Row Level Security を無効化（MVP段階）
ALTER TABLE waiting_list DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE applications DISABLE ROW LEVEL SECURITY;
