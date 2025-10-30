function extractOrigin(raw: string): string {
  try {
    const u = new URL(raw)
    return `${u.protocol}//${u.host}`
  } catch {
    const u2 = new URL(`https://${raw}`)
    return `${u2.protocol}//${u2.host}`
  }
}

function diagnoseUrlProblem(supabaseUrl: string): string | null {
  const hasRestPath = /\/rest\/v1\b/.test(supabaseUrl)
  const hasAnyPath = /^https?:\/\/[^/]+\/.+/.test(supabaseUrl)
  if (hasRestPath)
    return "SUPABASE_URL に /rest/v1 を含めないでください。https://{ref}.supabase.co のみを設定してください。"
  if (hasAnyPath) return "SUPABASE_URL はドメイン（オリジン）のみを設定してください。パスは含めないでください。"
  return null
}

async function run(): Promise<void> {
  const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""

  const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || ""

  if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error("❌ 環境変数が未設定です。SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください。")
    process.exit(1)
  }

  const hint = diagnoseUrlProblem(SUPABASE_URL)
  if (hint) {
    console.error(`❌ requested path is invalid: ${hint}`)
    console.error("例: SUPABASE_URL=https://yqnluaxuhbgtndmdmciv.supabase.co")
    process.exit(1)
  }

  const origin = extractOrigin(SUPABASE_URL)
  const endpoint = `${origin}/postgres/v1/query`

  // Read SQL from repository file
  const sqlContent = `
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
`

  const sql = sqlContent

  console.log("➡️  Posting SQL to:", endpoint)
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_ROLE}`,
      apikey: SERVICE_ROLE,
      "Content-Type": "application/json",
      Accept: "application/json",
      Prefer: "tx=commit",
    },
    body: JSON.stringify({ query: sql }),
  })

  const text = await res.text().catch(() => "")

  if (!res.ok) {
    const msg = text || `HTTP ${res.status}`
    console.error("❌ 初期化に失敗しました")
    console.error("Status:", res.status)
    console.error("Body  :", msg)
    if (/requested path is invalid/i.test(msg)) {
      console.error("\nヒント: SUPABASE_URL に /rest/v1 などのパスが含まれている可能性があります。")
      console.error("https://{ref}.supabase.co のみを設定してください（末尾スラッシュ不要）。")
    }
    process.exit(1)
  }

  console.log("✅ 初期化に成功しました。必要なら 5〜10 秒後にアプリを再読込してください。")
}

run().catch((e) => {
  console.error("❌ 予期せぬエラー:", e?.message || e)
  process.exit(1)
})

export {}
