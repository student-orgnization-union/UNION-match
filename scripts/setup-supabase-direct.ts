#!/usr/bin/env node
/**
 * Supabaseリモートプロジェクトの設定スクリプト（直接実行版）
 * 
 * 使用方法:
 *   node scripts/setup-supabase-direct.ts
 * 
 * または
 *   npx tsx scripts/setup-supabase-direct.ts
 */

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ 環境変数が設定されていません')
  console.error('以下を.env.localに設定してください:')
  console.error('  - SUPABASE_URL または NEXT_PUBLIC_SUPABASE_URL (https://xxx.supabase.co)')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// SUPABASE_URLから正しい形式を抽出
function extractSupabaseUrl(url: string): string {
  // vercel.appのURLの場合は警告
  if (url.includes('vercel.app')) {
    console.warn('⚠️  NEXT_PUBLIC_SUPABASE_URLがVercel URLになっています')
    console.warn('   SupabaseプロジェクトのURL (https://xxx.supabase.co) を設定してください')
    // refから正しいURLを推測
    const refMatch = SERVICE_ROLE_KEY.match(/"ref":"([^"]+)"/)
    if (refMatch) {
      const ref = refMatch[1]
      return `https://${ref}.supabase.co`
    }
  }
  
  // 既に正しい形式の場合
  if (url.includes('.supabase.co')) {
    return url.replace(/\/rest\/v1.*$/, '').replace(/\/$/, '')
  }
  
  return url
}

const correctUrl = extractSupabaseUrl(SUPABASE_URL)

// 拡張されたデータベーススキーマ
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
  console.log(`📡 接続先: ${correctUrl}\n`)
  
  // SupabaseのPostgres APIエンドポイント（Management API経由）
  // pg-metaエンドポイントを使用
  const endpoint = `${correctUrl}/pg-meta/v1/query`
  
  try {
    // lib/db/bootstrap.tsと同じ方法を使用
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'apikey': SERVICE_ROLE_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Prefer': 'tx=commit',
      },
      body: JSON.stringify({ query: SCHEMA_SQL }),
    })

    if (!response.ok) {
      const text = await response.text()
      throw new Error(`HTTP ${response.status}: ${text}`)
    }

    const result = await response.json()
    console.log('✅ データベーススキーマが適用されました\n')
    return result
  } catch (error: any) {
    console.error('❌ スキーマ適用エラー:', error.message)
    console.error('\n手動でSupabase StudioのSQL Editorから以下を実行してください:')
    console.error('  1. https://supabase.com/dashboard にログイン')
    console.error('  2. プロジェクトを選択')
    console.error('  3. SQL Editor を開く')
    console.error('  4. 以下のSQLを実行:\n')
    console.error(SCHEMA_SQL)
    throw error
  }
}

async function verifyTables() {
  console.log('🔍 テーブルの存在を確認しています...\n')
  
  const { createClient } = await import('@supabase/supabase-js')
  const supabase = createClient(correctUrl, SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  const tables = [
    { name: 'companies', required: true },
    { name: 'organizations', required: true },
    { name: 'projects', required: true },
    { name: 'applications', required: true },
    { name: 'waiting_list', required: false },
  ]
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table.name).select('*').limit(1)
      if (error) {
        console.error(`❌ ${table.name} テーブル: ${error.message}`)
        if (table.required) {
          console.error(`   ⚠️  このテーブルは必須です`)
        }
      } else {
        console.log(`✅ ${table.name} テーブル: 存在確認`)
      }
    } catch (error: any) {
      console.error(`❌ ${table.name} テーブル: ${error.message}`)
    }
  }
}

async function checkAuthSettings() {
  console.log('\n🔐 認証設定の確認:')
  console.log('   以下の手順でSupabase Dashboardで確認・設定してください:')
  console.log('   1. https://supabase.com/dashboard にログイン')
  console.log('   2. プロジェクトを選択')
  console.log('   3. Authentication → Settings を開く')
  console.log('   4. "Enable Email Signup" がONになっているか確認')
  console.log('   5. "Confirm email" は開発中はOFFでも問題ありません')
  console.log('   6. Site URL が正しく設定されているか確認\n')
}

async function main() {
  console.log('🚀 Supabase セットアップを開始します...\n')
  
  if (SUPABASE_URL.includes('vercel.app')) {
    console.warn('⚠️  警告: NEXT_PUBLIC_SUPABASE_URLがVercel URLになっています')
    console.warn(`   正しいURL: ${correctUrl}`)
    console.warn('   .env.localを更新してください\n')
  }

  try {
    await applySchema()
    await verifyTables()
    await checkAuthSettings()
    
    console.log('✨ セットアップが完了しました！')
    console.log('\n次のステップ:')
    console.log('  1. .env.localのNEXT_PUBLIC_SUPABASE_URLを確認（https://xxx.supabase.co形式）')
    console.log('  2. Supabase Dashboardで認証設定を確認')
    console.log('  3. npm run dev で開発サーバーを起動')
    console.log('  4. http://localhost:3000 にアクセスして動作確認')
  } catch (error: any) {
    console.error('\n❌ セットアップエラー:', error.message)
    process.exit(1)
  }
}

main().catch(console.error)
