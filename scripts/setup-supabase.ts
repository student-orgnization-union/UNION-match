#!/usr/bin/env tsx
/**
 * Supabaseリモートプロジェクトの設定スクリプト
 * 
 * このスクリプトは以下を実行します：
 * 1. データベーススキーマの適用（organizationsテーブル追加など）
 * 2. 認証設定の確認
 * 3. RLS（Row Level Security）の設定
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { join } from 'path'

// .env.localを読み込む
dotenv.config({ path: join(process.cwd(), '.env.local') })

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ 環境変数が設定されていません')
  console.error('以下を.env.localに設定してください:')
  console.error('  - SUPABASE_URL または NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

// 拡張されたデータベーススキーマ（organizationsテーブル含む）
const SCHEMA_SQL = `
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
  user_id uuid references auth.users(id) on delete cascade unique,
  name text not null,
  description text,
  contact_email text not null,
  contact_phone text,
  website text,
  logo_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
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
end $$;

-- MVP: RLS無効（運用時に有効化）
alter table companies disable row level security;
alter table organizations disable row level security;
alter table projects disable row level security;
alter table applications disable row level security;
alter table waiting_list disable row level security;
`

async function applySchema() {
  console.log('📦 データベーススキーマを適用しています...')
  
  try {
    // SupabaseのREST API経由でSQLを実行
    const { error } = await supabase.rpc('exec_sql', { sql_query: SCHEMA_SQL })
    
    // RPCが存在しない場合は、直接Postgres APIを使用
    if (error) {
      console.log('⚠️  RPC経由での実行に失敗。Postgres APIを試行します...')
      
      const origin = SUPABASE_URL.replace(/\/rest\/v1.*$/, '')
      const response = await fetch(`${origin}/postgres/v1/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({ query: SCHEMA_SQL }),
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`HTTP ${response.status}: ${text}`)
      }

      console.log('✅ データベーススキーマが適用されました')
    } else {
      console.log('✅ データベーススキーマが適用されました')
    }
  } catch (error: any) {
    console.error('❌ スキーマ適用エラー:', error.message)
    console.error('\n手動でSupabase StudioのSQL Editorから以下を実行してください:')
    console.error(SCHEMA_SQL)
    throw error
  }
}

async function checkAuthSettings() {
  console.log('\n🔐 認証設定を確認しています...')
  
  // 認証設定の確認はSupabase Dashboardで行う必要があります
  console.log('✅ 認証設定は以下の手順で確認・設定してください:')
  console.log('   1. Supabase Dashboard (https://supabase.com/dashboard) にログイン')
  console.log('   2. プロジェクトを選択')
  console.log('   3. Authentication → Settings を開く')
  console.log('   4. "Enable Email Signup" がONになっているか確認')
  console.log('   5. "Confirm email" は開発中はOFFでも問題ありません')
  console.log('   6. Email Templates でメール認証設定を確認')
}

async function verifyTables() {
  console.log('\n🔍 テーブルの存在を確認しています...')
  
  const tables = ['companies', 'organizations', 'projects', 'applications', 'waiting_list']
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1)
      if (error) {
        console.error(`❌ ${table} テーブル: エラー - ${error.message}`)
      } else {
        console.log(`✅ ${table} テーブル: 存在確認`)
      }
    } catch (error: any) {
      console.error(`❌ ${table} テーブル: ${error.message}`)
    }
  }
}

async function main() {
  console.log('🚀 Supabase セットアップを開始します...\n')
  console.log(`📡 接続先: ${SUPABASE_URL}\n`)

  try {
    await applySchema()
    await verifyTables()
    await checkAuthSettings()
    
    console.log('\n✨ セットアップが完了しました！')
    console.log('\n次のステップ:')
    console.log('  1. Supabase Dashboardで認証設定を確認')
    console.log('  2. npm run dev で開発サーバーを起動')
    console.log('  3. http://localhost:3000 にアクセスして動作確認')
  } catch (error: any) {
    console.error('\n❌ セットアップエラー:', error.message)
    process.exit(1)
  }
}

main()
