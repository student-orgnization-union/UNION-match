-- Union Match MVP - データベーススキーマ設定
-- このファイルをSupabase DashboardのSQL Editorで実行してください
-- https://supabase.com/dashboard → プロジェクト選択 → SQL Editor

-- 必要拡張（gen_random_uuid）
create extension if not exists pgcrypto;

-- companies (認証連携を追加)
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  logo_url text,
  website text,
  contact_email text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- organizations (学生団体テーブル、認証連携)
create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  description text,
  contact_email text not null,
  contact_phone text,
  website text,
  logo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint organizations_user_id_key unique (user_id)
);

-- projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  budget text,
  deadline date,
  description text,
  contact_info text not null,
  status text default 'review',
  rating_avg double precision,
  created_at timestamptz default now(),
  company_id uuid
);

-- FK（なければ付与）
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'projects_company_id_fkey'
  ) then
    alter table projects
      add constraint projects_company_id_fkey
      foreign key (company_id)
      references companies(id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_projects_company_id on projects(company_id);

-- applications (organization_idを追加)
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  appeal text not null,
  organization_name text,
  contact_info text not null,
  created_at timestamptz default now()
);

-- waiting_list
create table if not exists waiting_list (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  type text,
  name text,
  interest_score int,
  referrer text,
  created_at timestamptz default now()
);

-- indexes
create index if not exists idx_projects_status on projects(status);
create index if not exists idx_projects_created_at on projects(created_at);
create index if not exists idx_applications_project_id on applications(project_id);
create index if not exists idx_applications_organization_id on applications(organization_id);
create index if not exists idx_applications_created_at on applications(created_at);
create index if not exists idx_companies_user_id on companies(user_id);
create index if not exists idx_organizations_user_id on organizations(user_id);

-- 既存テーブルの更新（user_idカラムを追加、なければ）
do $$
begin
  -- companiesテーブルにuser_idカラムを追加（存在しない場合）
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'companies' and column_name = 'user_id'
  ) then
    alter table companies add column user_id uuid references auth.users(id) on delete cascade;
    create index if not exists idx_companies_user_id on companies(user_id);
  end if;

  -- companiesテーブルにupdated_atカラムを追加（存在しない場合）
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'companies' and column_name = 'updated_at'
  ) then
    alter table companies add column updated_at timestamptz default now();
  end if;

  -- applicationsテーブルにorganization_idカラムを追加（存在しない場合）
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'applications' and column_name = 'organization_id'
  ) then
    alter table applications add column organization_id uuid references organizations(id) on delete set null;
    create index if not exists idx_applications_organization_id on applications(organization_id);
  end if;

  -- organizationsテーブルのuser_idユニーク制約を追加（存在しない場合）
  if not exists (
    select 1
    from pg_constraint c
    join pg_attribute a
      on a.attrelid = c.conrelid
     and a.attnum = any(c.conkey)
    where c.conrelid = 'organizations'::regclass
      and c.contype = 'u'
      and array_length(c.conkey, 1) = 1
      and a.attname = 'user_id'
  ) then
    alter table organizations add constraint organizations_user_id_key unique (user_id);
  end if;
end $$;

-- MVP: RLS無効（運用時に有効化）
alter table companies disable row level security;
alter table organizations disable row level security;
alter table projects disable row level security;
alter table applications disable row level security;
alter table waiting_list disable row level security;

-- 完了メッセージ
do $$
begin
  raise notice '✅ データベーススキーマの設定が完了しました';
end $$;
