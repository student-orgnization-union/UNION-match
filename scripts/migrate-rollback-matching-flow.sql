-- UNION Match - マッチング後フロー拡張のロールバック
-- 注意: このスクリプトは全ての新規テーブルとカラムを削除します
-- 実行前に必ずデータバックアップを取ってください

-- ============================================
-- 1. トリガーの削除
-- ============================================
drop trigger if exists trigger_set_submission_review_deadline on submissions;
drop trigger if exists trigger_update_change_requests_updated_at on change_requests;
drop trigger if exists trigger_update_submissions_updated_at on submissions;
drop trigger if exists trigger_update_milestones_updated_at on milestones;
drop trigger if exists trigger_update_agreements_updated_at on agreements;

-- ============================================
-- 2. 関数の削除
-- ============================================
drop function if exists set_submission_review_deadline();
drop function if exists update_change_requests_updated_at();
drop function if exists update_submissions_updated_at();
drop function if exists update_milestones_updated_at();
drop function if exists update_agreements_updated_at();
drop function if exists log_audit(text, uuid, text, uuid, jsonb);

-- ============================================
-- 3. テーブルの削除（外部キー制約により順序が重要）
-- ============================================
drop table if exists audit_logs cascade;
drop table if exists change_requests cascade;
drop table if exists submissions cascade;
drop table if exists milestones cascade;
drop table if exists agreements cascade;

-- ============================================
-- 4. applicationsテーブルから追加カラムを削除
-- ============================================
do $$
begin
  if exists (
    select 1 from information_schema.columns 
    where table_name = 'applications' and column_name = 'kickoff_scheduled_at'
  ) then
    alter table applications drop column kickoff_scheduled_at;
  end if;

  if exists (
    select 1 from information_schema.columns 
    where table_name = 'applications' and column_name = 'change_pending'
  ) then
    alter table applications drop column change_pending;
  end if;

  if exists (
    select 1 from information_schema.columns 
    where table_name = 'applications' and column_name = 'risk_flag'
  ) then
    alter table applications drop column risk_flag;
  end if;
end $$;

-- ============================================
-- 5. インデックスの削除
-- ============================================
drop index if exists idx_applications_risk_flag;
drop index if exists idx_applications_change_pending;
drop index if exists idx_applications_status;

-- ============================================
-- 完了メッセージ
-- ============================================
do $$
begin
  raise notice '✅ ロールバックが完了しました';
  raise notice '⚠️  削除されたテーブル: agreements, milestones, submissions, change_requests, audit_logs';
  raise notice '⚠️  applicationsテーブルから追加カラムが削除されました';
end $$;

