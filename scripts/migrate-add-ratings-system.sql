-- Union Match MVP - 評価システムとレコメンド機能の追加
-- このファイルをSupabase DashboardのSQL Editorで実行してください
-- https://supabase.com/dashboard → プロジェクト選択 → SQL Editor

-- ratings テーブルの作成（相互評価用）
create table if not exists ratings (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  application_id uuid references applications(id) on delete cascade,
  
  -- 評価者（企業、学生団体、学生個人のいずれか）
  rater_type text not null, -- 'company' | 'organization' | 'student'
  rater_id uuid not null, -- companies.id, organizations.id, students.id のいずれか
  
  -- 被評価者（企業、学生団体、学生個人のいずれか）
  ratee_type text not null, -- 'company' | 'organization' | 'student'
  ratee_id uuid not null, -- companies.id, organizations.id, students.id のいずれか
  
  -- 評価内容
  score integer not null check (score >= 1 and score <= 5), -- 1-5の評価
  comment text, -- 評価コメント
  
  -- 評価カテゴリ（オプション）
  communication_rating integer check (communication_rating >= 1 and communication_rating <= 5),
  quality_rating integer check (quality_rating >= 1 and quality_rating <= 5),
  punctuality_rating integer check (punctuality_rating >= 1 and punctuality_rating <= 5),
  professionalism_rating integer check (professionalism_rating >= 1 and professionalism_rating <= 5),
  
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  
  -- 同じ案件・応募に対して同じ評価者が複数回評価できないようにする
  constraint unique_rating unique (application_id, rater_type, rater_id)
);

-- companies テーブルに評価関連カラムを追加
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'companies' and column_name = 'rating_avg'
  ) then
    alter table companies add column rating_avg double precision default 0.0;
    alter table companies add column rating_count integer default 0;
  end if;
end $$;

-- organizations テーブルに評価関連カラムを追加
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'organizations' and column_name = 'rating_avg'
  ) then
    alter table organizations add column rating_avg double precision default 0.0;
    alter table organizations add column rating_count integer default 0;
  end if;
end $$;

-- students テーブルに評価関連カラムを追加
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'students' and column_name = 'rating_avg'
  ) then
    alter table students add column rating_avg double precision default 0.0;
    alter table students add column rating_count integer default 0;
  end if;
end $$;

-- projects テーブルに案件ステータスを追加（完了状態）
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'projects' and column_name = 'completed_at'
  ) then
    alter table projects add column completed_at timestamptz;
  end if;
end $$;

-- applications テーブルに応募ステータスを追加
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'applications' and column_name = 'status'
  ) then
    alter table applications add column status text default 'pending'; -- 'pending' | 'accepted' | 'rejected' | 'completed'
    alter table applications add column accepted_at timestamptz;
    alter table applications add column completed_at timestamptz;
  end if;
end $$;

-- インデックスの作成
create index if not exists idx_ratings_project_id on ratings(project_id);
create index if not exists idx_ratings_application_id on ratings(application_id);
create index if not exists idx_ratings_rater on ratings(rater_type, rater_id);
create index if not exists idx_ratings_ratee on ratings(ratee_type, ratee_id);
create index if not exists idx_ratings_created_at on ratings(created_at);
create index if not exists idx_applications_status on applications(status);
create index if not exists idx_companies_rating_avg on companies(rating_avg);
create index if not exists idx_organizations_rating_avg on organizations(rating_avg);
create index if not exists idx_students_rating_avg on students(rating_avg);

-- 評価平均値を自動更新する関数
create or replace function update_rating_avg()
returns trigger as $$
begin
  if TG_TABLE_NAME = 'ratings' then
    -- 被評価者の評価平均を更新
    if NEW.ratee_type = 'company' then
      update companies
      set 
        rating_avg = (
          select coalesce(avg(score), 0.0)
          from ratings
          where ratee_type = 'company' and ratee_id = NEW.ratee_id
        ),
        rating_count = (
          select count(*)
          from ratings
          where ratee_type = 'company' and ratee_id = NEW.ratee_id
        )
      where id = NEW.ratee_id;
    elsif NEW.ratee_type = 'organization' then
      update organizations
      set 
        rating_avg = (
          select coalesce(avg(score), 0.0)
          from ratings
          where ratee_type = 'organization' and ratee_id = NEW.ratee_id
        ),
        rating_count = (
          select count(*)
          from ratings
          where ratee_type = 'organization' and ratee_id = NEW.ratee_id
        )
      where id = NEW.ratee_id;
    elsif NEW.ratee_type = 'student' then
      update students
      set 
        rating_avg = (
          select coalesce(avg(score), 0.0)
          from ratings
          where ratee_type = 'student' and ratee_id = NEW.ratee_id
        ),
        rating_count = (
          select count(*)
          from ratings
          where ratee_type = 'student' and ratee_id = NEW.ratee_id
        )
      where id = NEW.ratee_id;
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql;

-- 評価挿入時に自動的に評価平均を更新するトリガー
drop trigger if exists trigger_update_rating_avg on ratings;
create trigger trigger_update_rating_avg
  after insert or update on ratings
  for each row
  execute function update_rating_avg();

-- RLS無効（MVP段階）
alter table ratings disable row level security;

