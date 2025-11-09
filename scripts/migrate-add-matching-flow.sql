-- UNION Match - マッチング後フロー拡張マイグレーション
-- このファイルをSupabase DashboardのSQL Editorで実行してください
-- https://supabase.com/dashboard → プロジェクト選択 → SQL Editor
--
-- 目的: 既存の「応募→承認→完了→評価」フローを拡張し、
--       「合意シート→実行→納品・検収→完了→評価」の7段階フローを実現
--
-- 影響範囲: 新規テーブル追加のみ（既存テーブルは破壊的変更なし）
-- ロールバック: migrate-rollback-matching-flow.sql を参照

-- ============================================
-- 1. applicationsテーブルの拡張（ステータス追加）
-- ============================================
-- 既存のstatusカラムに新しいステータス値を許可
-- 既存データは影響なし（'pending', 'accepted', 'rejected', 'completed'はそのまま有効）

-- applicationsテーブルに新しいカラムを追加（存在しない場合のみ）
do $$
begin
  -- risk_flag: リスクフラグ（boolean）
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'applications' and column_name = 'risk_flag'
  ) then
    alter table applications add column risk_flag boolean default false;
  end if;

  -- change_pending: 変更リクエスト保留中フラグ（boolean）
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'applications' and column_name = 'change_pending'
  ) then
    alter table applications add column change_pending boolean default false;
  end if;

  -- kickoff_scheduled_at: キックオフ予定日時
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'applications' and column_name = 'kickoff_scheduled_at'
  ) then
    alter table applications add column kickoff_scheduled_at timestamptz;
  end if;
end $$;

-- インデックスの追加
create index if not exists idx_applications_risk_flag on applications(risk_flag);
create index if not exists idx_applications_change_pending on applications(change_pending);
create index if not exists idx_applications_status on applications(status);

-- ============================================
-- 2. agreements テーブル（合意シート）
-- ============================================
create table if not exists agreements (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  scope_text text not null, -- 目的・範囲の説明
  deliverables_json jsonb, -- 成果物のJSON配列 [{"title": "...", "description": "..."}, ...]
  due_at timestamptz not null, -- 納期
  amount numeric(12, 2), -- 金額（NULL可、後で決定する場合）
  ip_terms text, -- 知的財産権の取り決め
  communication_channel text, -- 連絡手段（メール/Slack/その他）
  agreed_at timestamptz, -- 合意日時（NULL=未合意）
  version integer default 1, -- バージョン番号（変更リクエストで増加）
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint agreements_application_id_unique unique (application_id, version)
);

-- インデックス
create index if not exists idx_agreements_application_id on agreements(application_id);
create index if not exists idx_agreements_agreed_at on agreements(agreed_at);
create index if not exists idx_agreements_due_at on agreements(due_at);

-- ============================================
-- 3. milestones テーブル（マイルストーン）
-- ============================================
create table if not exists milestones (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references agreements(id) on delete cascade,
  title text not null, -- マイルストーン名（例: "M1: 要件定義完了"）
  due_at timestamptz not null, -- 期日
  owner_user_id uuid references auth.users(id) on delete set null, -- 担当者（企業側 or 学生側）
  status text default 'pending' check (status in ('pending', 'in_progress', 'completed', 'blocked')), -- 進捗状態
  risk_flag boolean default false, -- リスクフラグ
  sort_order integer default 0, -- 並び順
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- インデックス
create index if not exists idx_milestones_agreement_id on milestones(agreement_id);
create index if not exists idx_milestones_due_at on milestones(due_at);
create index if not exists idx_milestones_status on milestones(status);
create index if not exists idx_milestones_owner_user_id on milestones(owner_user_id);
create index if not exists idx_milestones_sort_order on milestones(agreement_id, sort_order);

-- ============================================
-- 4. submissions テーブル（納品物）
-- ============================================
create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  milestone_id uuid not null references milestones(id) on delete cascade,
  files_json jsonb, -- ファイル情報のJSON配列 [{"name": "...", "url": "...", "size": 1234}, ...]
  url text, -- 提出URL（GitHub/Google Drive等）
  note text, -- 提出メモ
  submitted_at timestamptz default now(), -- 提出日時
  status text default 'submitted' check (status in ('submitted', 'under_review', 'approved', 'needs_revision', 'resubmitted')), -- 検収状態
  review_deadline timestamptz, -- 検収期限（submitted_at + 72時間）
  reviewed_at timestamptz, -- 検収日時
  review_comment text, -- 検収コメント
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- インデックス
create index if not exists idx_submissions_milestone_id on submissions(milestone_id);
create index if not exists idx_submissions_status on submissions(status);
create index if not exists idx_submissions_submitted_at on submissions(submitted_at);
create index if not exists idx_submissions_review_deadline on submissions(review_deadline);

-- ============================================
-- 5. change_requests テーブル（変更リクエスト）
-- ============================================
create table if not exists change_requests (
  id uuid primary key default gen_random_uuid(),
  agreement_id uuid not null references agreements(id) on delete cascade,
  type text not null check (type in ('scope', 'due', 'amount')), -- 変更タイプ
  diff_json jsonb not null, -- 変更差分のJSON（変更前・変更後）
  proposed_by uuid not null references auth.users(id) on delete restrict, -- 提案者
  status text default 'proposed' check (status in ('proposed', 'approved', 'rejected')), -- ステータス
  decided_at timestamptz, -- 決定日時
  decided_by uuid references auth.users(id) on delete set null, -- 決定者
  decision_comment text, -- 決定コメント
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- インデックス
create index if not exists idx_change_requests_agreement_id on change_requests(agreement_id);
create index if not exists idx_change_requests_status on change_requests(status);
create index if not exists idx_change_requests_proposed_by on change_requests(proposed_by);
create index if not exists idx_change_requests_type on change_requests(type);

-- ============================================
-- 6. audit_logs テーブル（監査ログ）
-- ============================================
create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  entity text not null, -- エンティティタイプ（'application', 'agreement', 'milestone', 'submission', 'change_request'）
  entity_id uuid not null, -- エンティティID
  action text not null, -- アクション（'created', 'updated', 'deleted', 'status_changed', etc.）
  actor_id uuid not null references auth.users(id) on delete restrict, -- 実行者
  meta_json jsonb, -- メタデータ（変更内容、IPアドレス等）
  created_at timestamptz default now()
);

-- インデックス
create index if not exists idx_audit_logs_entity on audit_logs(entity, entity_id);
create index if not exists idx_audit_logs_actor_id on audit_logs(actor_id);
create index if not exists idx_audit_logs_created_at on audit_logs(created_at);
create index if not exists idx_audit_logs_action on audit_logs(action);

-- ============================================
-- 7. 更新日時の自動更新トリガー
-- ============================================
-- agreements テーブル
create or replace function update_agreements_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_agreements_updated_at on agreements;
create trigger trigger_update_agreements_updated_at
  before update on agreements
  for each row
  execute function update_agreements_updated_at();

-- milestones テーブル
create or replace function update_milestones_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_milestones_updated_at on milestones;
create trigger trigger_update_milestones_updated_at
  before update on milestones
  for each row
  execute function update_milestones_updated_at();

-- submissions テーブル
create or replace function update_submissions_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_submissions_updated_at on submissions;
create trigger trigger_update_submissions_updated_at
  before update on submissions
  for each row
  execute function update_submissions_updated_at();

-- change_requests テーブル
create or replace function update_change_requests_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_update_change_requests_updated_at on change_requests;
create trigger trigger_update_change_requests_updated_at
  before update on change_requests
  for each row
  execute function update_change_requests_updated_at();

-- ============================================
-- 8. 検収期限の自動計算トリガー（submissions）
-- ============================================
create or replace function set_submission_review_deadline()
returns trigger as $$
begin
  -- submitted_atが設定され、review_deadlineがNULLの場合、72時間後を設定
  if new.submitted_at is not null and new.review_deadline is null then
    new.review_deadline = new.submitted_at + interval '72 hours';
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trigger_set_submission_review_deadline on submissions;
create trigger trigger_set_submission_review_deadline
  before insert or update on submissions
  for each row
  execute function set_submission_review_deadline();

-- ============================================
-- 9. 監査ログ自動記録のヘルパー関数
-- ============================================
create or replace function log_audit(
  p_entity text,
  p_entity_id uuid,
  p_action text,
  p_actor_id uuid,
  p_meta jsonb default null
)
returns uuid as $$
declare
  v_log_id uuid;
begin
  insert into audit_logs (entity, entity_id, action, actor_id, meta_json)
  values (p_entity, p_entity_id, p_action, p_actor_id, p_meta)
  returning id into v_log_id;
  return v_log_id;
end;
$$ language plpgsql security definer;

-- ============================================
-- 10. RLS（Row Level Security）の設定
-- ============================================
-- 注: 既存のRLSポリシーを継承するため、ここでは基本的なポリシーのみ設定
-- 詳細なポリシーは運用時に調整

-- agreements: 当該applicationに関係するユーザーのみアクセス可能
alter table agreements enable row level security;

create policy "agreements_select_policy" on agreements
  for select
  using (
    exists (
      select 1 from applications a
      join projects p on p.id = a.project_id
      where a.id = agreements.application_id
      and (
        -- 企業側: 案件の企業IDと一致
        (p.company_id in (select id from companies where user_id = auth.uid()))
        or
        -- 学生側: 応募のorganization_idまたはstudent_idと一致
        (a.organization_id in (select id from organizations where user_id = auth.uid()))
        or
        (a.student_id in (select id from students where user_id = auth.uid()))
      )
    )
  );

create policy "agreements_insert_policy" on agreements
  for insert
  with check (
    exists (
      select 1 from applications a
      join projects p on p.id = a.project_id
      where a.id = agreements.application_id
      and (
        (p.company_id in (select id from companies where user_id = auth.uid()))
        or
        (a.organization_id in (select id from organizations where user_id = auth.uid()))
        or
        (a.student_id in (select id from students where user_id = auth.uid()))
      )
    )
  );

create policy "agreements_update_policy" on agreements
  for update
  using (
    exists (
      select 1 from applications a
      join projects p on p.id = a.project_id
      where a.id = agreements.application_id
      and (
        (p.company_id in (select id from companies where user_id = auth.uid()))
        or
        (a.organization_id in (select id from organizations where user_id = auth.uid()))
        or
        (a.student_id in (select id from students where user_id = auth.uid()))
      )
    )
  );

-- milestones: agreements経由でアクセス制御
alter table milestones enable row level security;

create policy "milestones_select_policy" on milestones
  for select
  using (
    exists (
      select 1 from agreements ag
      join applications a on a.id = ag.application_id
      join projects p on p.id = a.project_id
      where ag.id = milestones.agreement_id
      and (
        (p.company_id in (select id from companies where user_id = auth.uid()))
        or
        (a.organization_id in (select id from organizations where user_id = auth.uid()))
        or
        (a.student_id in (select id from students where user_id = auth.uid()))
      )
    )
  );

create policy "milestones_insert_policy" on milestones
  for insert
  with check (
    exists (
      select 1 from agreements ag
      join applications a on a.id = ag.application_id
      join projects p on p.id = a.project_id
      where ag.id = milestones.agreement_id
      and (
        (p.company_id in (select id from companies where user_id = auth.uid()))
        or
        (a.organization_id in (select id from organizations where user_id = auth.uid()))
        or
        (a.student_id in (select id from students where user_id = auth.uid()))
      )
    )
  );

create policy "milestones_update_policy" on milestones
  for update
  using (
    exists (
      select 1 from agreements ag
      join applications a on a.id = ag.application_id
      join projects p on p.id = a.project_id
      where ag.id = milestones.agreement_id
      and (
        (p.company_id in (select id from companies where user_id = auth.uid()))
        or
        (a.organization_id in (select id from organizations where user_id = auth.uid()))
        or
        (a.student_id in (select id from students where user_id = auth.uid()))
      )
    )
  );

-- submissions: milestones経由でアクセス制御
alter table submissions enable row level security;

create policy "submissions_select_policy" on submissions
  for select
  using (
    exists (
      select 1 from milestones m
      join agreements ag on ag.id = m.agreement_id
      join applications a on a.id = ag.application_id
      join projects p on p.id = a.project_id
      where m.id = submissions.milestone_id
      and (
        (p.company_id in (select id from companies where user_id = auth.uid()))
        or
        (a.organization_id in (select id from organizations where user_id = auth.uid()))
        or
        (a.student_id in (select id from students where user_id = auth.uid()))
      )
    )
  );

create policy "submissions_insert_policy" on submissions
  for insert
  with check (
    exists (
      select 1 from milestones m
      join agreements ag on ag.id = m.agreement_id
      join applications a on a.id = ag.application_id
      join projects p on p.id = a.project_id
      where m.id = submissions.milestone_id
      and (
        (p.company_id in (select id from companies where user_id = auth.uid()))
        or
        (a.organization_id in (select id from organizations where user_id = auth.uid()))
        or
        (a.student_id in (select id from students where user_id = auth.uid()))
      )
    )
  );

create policy "submissions_update_policy" on submissions
  for update
  using (
    exists (
      select 1 from milestones m
      join agreements ag on ag.id = m.agreement_id
      join applications a on a.id = ag.application_id
      join projects p on p.id = a.project_id
      where m.id = submissions.milestone_id
      and (
        (p.company_id in (select id from companies where user_id = auth.uid()))
        or
        (a.organization_id in (select id from organizations where user_id = auth.uid()))
        or
        (a.student_id in (select id from students where user_id = auth.uid()))
      )
    )
  );

-- change_requests: agreements経由でアクセス制御
alter table change_requests enable row level security;

create policy "change_requests_select_policy" on change_requests
  for select
  using (
    exists (
      select 1 from agreements ag
      join applications a on a.id = ag.application_id
      join projects p on p.id = a.project_id
      where ag.id = change_requests.agreement_id
      and (
        (p.company_id in (select id from companies where user_id = auth.uid()))
        or
        (a.organization_id in (select id from organizations where user_id = auth.uid()))
        or
        (a.student_id in (select id from students where user_id = auth.uid()))
      )
    )
  );

create policy "change_requests_insert_policy" on change_requests
  for insert
  with check (
    exists (
      select 1 from agreements ag
      join applications a on a.id = ag.application_id
      join projects p on p.id = a.project_id
      where ag.id = change_requests.agreement_id
      and (
        (p.company_id in (select id from companies where user_id = auth.uid()))
        or
        (a.organization_id in (select id from organizations where user_id = auth.uid()))
        or
        (a.student_id in (select id from students where user_id = auth.uid()))
      )
    )
  );

create policy "change_requests_update_policy" on change_requests
  for update
  using (
    exists (
      select 1 from agreements ag
      join applications a on a.id = ag.application_id
      join projects p on p.id = a.project_id
      where ag.id = change_requests.agreement_id
      and (
        (p.company_id in (select id from companies where user_id = auth.uid()))
        or
        (a.organization_id in (select id from organizations where user_id = auth.uid()))
        or
        (a.student_id in (select id from students where user_id = auth.uid()))
      )
    )
  );

-- audit_logs: 当該エンティティに関係するユーザーのみアクセス可能
alter table audit_logs enable row level security;

create policy "audit_logs_select_policy" on audit_logs
  for select
  using (
    -- エンティティタイプに応じてアクセス制御
    (
      entity = 'application' and exists (
        select 1 from applications a
        join projects p on p.id = a.project_id
        where a.id = audit_logs.entity_id
        and (
          (p.company_id in (select id from companies where user_id = auth.uid()))
          or
          (a.organization_id in (select id from organizations where user_id = auth.uid()))
          or
          (a.student_id in (select id from students where user_id = auth.uid()))
        )
      )
    )
    or
    (
      entity = 'agreement' and exists (
        select 1 from agreements ag
        join applications a on a.id = ag.application_id
        join projects p on p.id = a.project_id
        where ag.id = audit_logs.entity_id
        and (
          (p.company_id in (select id from companies where user_id = auth.uid()))
          or
          (a.organization_id in (select id from organizations where user_id = auth.uid()))
          or
          (a.student_id in (select id from students where user_id = auth.uid()))
        )
      )
    )
    -- 他のエンティティタイプも同様に追加可能
  );

-- ============================================
-- 完了メッセージ
-- ============================================
do $$
begin
  raise notice '✅ マッチング後フロー拡張マイグレーションが完了しました';
  raise notice '📋 追加されたテーブル: agreements, milestones, submissions, change_requests, audit_logs';
  raise notice '🔒 RLSポリシーが設定されました';
  raise notice '⏰ 検収期限の自動計算トリガーが設定されました（72時間）';
end $$;

