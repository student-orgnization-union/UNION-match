-- UNION Match - 連絡履歴テーブルの追加
-- 目的: メール送信履歴を記録し、中抜きリスクを軽減

-- ============================================
-- 1. contact_logs テーブルの作成
-- ============================================
create table if not exists contact_logs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  sender_type text not null check (sender_type in ('company', 'organization', 'student')), -- 送信者タイプ
  sender_id uuid not null, -- 送信者ID（companies.id, organizations.id, students.id）
  recipient_type text not null check (recipient_type in ('company', 'organization', 'student')), -- 受信者タイプ
  recipient_id uuid, -- 受信者ID（NULL可、連絡先情報のみの場合）
  contact_method text not null check (contact_method in ('email', 'phone', 'other')), -- 連絡方法
  contact_info text, -- 連絡先情報（暗号化推奨、将来的に実装）
  message_preview text, -- メッセージのプレビュー（件名・本文の一部）
  project_url text not null, -- 案件URL（トラッキングパラメータ付き）
  tracking_id text, -- トラッキングID（一意の識別子）
  created_at timestamptz default now()
);

-- インデックス
create index if not exists idx_contact_logs_application_id on contact_logs(application_id);
create index if not exists idx_contact_logs_sender on contact_logs(sender_type, sender_id);
create index if not exists idx_contact_logs_created_at on contact_logs(created_at);
create index if not exists idx_contact_logs_tracking_id on contact_logs(tracking_id);

-- ============================================
-- 2. RLS（Row Level Security）の設定
-- ============================================
alter table contact_logs enable row level security;

-- 当該applicationに関係するユーザーのみアクセス可能
create policy "contact_logs_select_policy" on contact_logs
  for select
  using (
    exists (
      select 1 from applications a
      join projects p on p.id = a.project_id
      where a.id = contact_logs.application_id
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

-- 当該applicationに関係するユーザーのみ挿入可能
create policy "contact_logs_insert_policy" on contact_logs
  for insert
  with check (
    exists (
      select 1 from applications a
      join projects p on p.id = a.project_id
      where a.id = contact_logs.application_id
      and (
        (p.company_id in (select id from companies where user_id = auth.uid()))
        or
        (a.organization_id in (select id from organizations where user_id = auth.uid()))
        or
        (a.student_id in (select id from students where user_id = auth.uid()))
      )
    )
  );

-- ============================================
-- 3. 連絡履歴の統計ビュー（オプション）
-- ============================================
create or replace view contact_logs_summary as
select
  application_id,
  sender_type,
  sender_id,
  recipient_type,
  recipient_id,
  contact_method,
  count(*) as contact_count,
  min(created_at) as first_contact_at,
  max(created_at) as last_contact_at
from contact_logs
group by application_id, sender_type, sender_id, recipient_type, recipient_id, contact_method;

-- ============================================
-- 完了メッセージ
-- ============================================
do $$
begin
  raise notice '✅ 連絡履歴テーブルの追加が完了しました';
  raise notice '📋 追加されたテーブル: contact_logs';
  raise notice '🔒 RLSポリシーが設定されました';
end $$;

