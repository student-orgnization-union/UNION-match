// DBスキーマのブートストラップ（サーバー専用）

declare global {
  // eslint-disable-next-line no-var
  var __um_schema_bootstrapped: boolean | undefined
}

const SQL = `
-- 必要拡張（gen_random_uuid）
create extension if not exists pgcrypto;

-- companies
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  logo_url text,
  website text,
  contact_email text,
  created_at timestamptz default now()
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

-- applications
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
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
create index if not exists idx_applications_created_at on applications(created_at);

-- MVP: RLS無効（運用時に有効化）
alter table companies disable row level security;
alter table projects disable row level security;
alter table applications disable row level security;
alter table waiting_list disable row level security;
`;

function extractOrigin(raw: string): string {
  // 常に「https://xxx.supabase.co」の形に丸める
  try {
    const u = new URL(raw);
    return `${u.protocol}//${u.host}`;
  } catch {
    // プロトコルがない場合に備えたフォールバック
    try {
      const u2 = new URL(`https://${raw}`);
      return `${u2.protocol}//${u2.host}`;
    } catch {
      // 最後の手段: 先頭から最初のスラッシュまで
      return raw.replace(/^(.+?:\/\/[^/]+).*/, '$1');
    }
  }
}

function diagnoseUrlProblem(supabaseUrl: string) {
  const hasRestPath = /\/rest\/v1\b/.test(supabaseUrl);
  const hasAnyPath = /^https?:\/\/[^/]+\/.+/.test(supabaseUrl);
  if (hasRestPath) {
    return 'SUPABASE_URL に /rest/v1 を含めないでください。https://{ref}.supabase.co のみを設定してください。';
  }
  if (hasAnyPath) {
    return 'SUPABASE_URL はドメイン（オリジン）のみを設定してください。パスは含めないでください。';
  }
  return null;
}

async function runSqlRaw(sql: string) {
  const SUPABASE_URL =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''

  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    throw new Error('環境変数が未設定です（SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）')
  }

  const origin = extractOrigin(SUPABASE_URL)
  const url = `${origin}/postgres/v1/query` // pg-meta SQL エンドポイント

  // 代表的な誤設定の診断を事前に返す
  const hint = diagnoseUrlProblem(SUPABASE_URL)
  if (hint) {
    const e = new Error(`requested path is invalid: ${hint}`)
    ;(e as any).code = 'invalid_path'
    throw e
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE}`,
      apikey: SERVICE_ROLE,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Prefer: 'tx=commit',
    },
    body: JSON.stringify({ query: sql }),
  })

  if (res.ok) {
    // レスポンス形式は環境によって異なるので捨ててもOK
    await res.text().catch(() => '')
    return { ok: true }
  }

  const body = await res.text().catch(() => '')
  const msg = body || `HTTP ${res.status}`
  // Supabase 側の「requested path is invalid」をそのまま表面化
  throw new Error(msg)
}

export async function bootstrapSchema() {
  return runSqlRaw(SQL)
}

export async function ensureSchemaOnce() {
  if (globalThis.__um_schema_bootstrapped) return
  try {
    await bootstrapSchema()
  } catch (e) {
    // 既存環境なら IF NOT EXISTS で安全なため、多くは無視で問題ない
    console.warn('ensureSchemaOnce warning:', e)
  } finally {
    globalThis.__um_schema_bootstrapped = true
  }
}

export function isMissingRelationError(err: any) {
  const msg = err?.message || ''
  const code = err?.code || ''
  return (
    code === '42P01' ||
    /relation.*does not exist/i.test(msg) ||
    /Could not find the table/i.test(msg)
  )
}
