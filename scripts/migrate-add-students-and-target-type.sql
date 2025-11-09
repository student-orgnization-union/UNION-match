-- Union Match MVP - 学生個人テーブル追加とprojectsテーブル拡張
-- このファイルをSupabase DashboardのSQL Editorで実行してください
-- https://supabase.com/dashboard → プロジェクト選択 → SQL Editor

-- students テーブルの作成（学生個人用）
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique,
  name text not null,
  email text not null,
  university text,
  department text,
  grade text,
  contact_email text not null,
  contact_phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- projects テーブルに target_type カラムを追加
-- 'student' | 'organization' | 'both' のいずれか
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'projects' and column_name = 'target_type'
  ) then
    alter table projects add column target_type text default 'organization';
    -- 既存データは 'organization' として扱う
    update projects set target_type = 'organization' where target_type is null;
    -- デフォルト値を設定
    alter table projects alter column target_type set default 'organization';
  end if;
end $$;

-- applications テーブルに student_id カラムを追加（学生個人の応募用）
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'applications' and column_name = 'student_id'
  ) then
    alter table applications add column student_id uuid references students(id) on delete set null;
  end if;
end $$;

-- インデックスの作成
create index if not exists idx_students_user_id on students(user_id);
create index if not exists idx_projects_target_type on projects(target_type);
create index if not exists idx_applications_student_id on applications(student_id);

-- RLS無効（MVP段階）
alter table students disable row level security;

