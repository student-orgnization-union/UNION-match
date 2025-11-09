# PR: マッチング後フロー拡張 - スキーマ追加

## 目的（ユーザー価値）

既存の「応募→承認→完了→評価」フローを拡張し、より詳細なプロジェクト管理機能を提供します。
- **合意シート（Light SOW）**: 目的・成果物・期日・金額・権利・連絡手段を双方で確認
- **マイルストーン管理**: プロジェクトの進捗を段階的に管理
- **納品・検収**: 72時間の検収タイマーと修正サイクル
- **変更リクエスト**: スコープ・期日・金額の変更を管理
- **監査ログ**: 全てのアクションを記録

## 変更点

### ファイル一覧

1. **新規作成**
   - `scripts/migrate-add-matching-flow.sql` - スキーマ追加マイグレーション
   - `scripts/migrate-rollback-matching-flow.sql` - ロールバックスクリプト
   - `PR_MIGRATION_SCHEMA.md` - このPRドキュメント

2. **更新**
   - `app/api/applications/[id]/route.ts` - 新しいステータス遷移の許可

### 主要差分

#### 1. 新規テーブル追加

- **agreements**: 合意シート（目的・成果物・期日・金額・権利・連絡手段）
- **milestones**: マイルストーン（タイトル・期日・担当・進捗・リスクフラグ）
- **submissions**: 納品物（ファイル・URL・メモ・検収状態・検収期限）
- **change_requests**: 変更リクエスト（タイプ・差分・提案者・ステータス）
- **audit_logs**: 監査ログ（エンティティ・アクション・実行者・メタデータ）

#### 2. applicationsテーブルの拡張

- `risk_flag` (boolean): リスクフラグ
- `change_pending` (boolean): 変更リクエスト保留中フラグ
- `kickoff_scheduled_at` (timestamptz): キックオフ予定日時

#### 3. 新しいステータス遷移

既存の `pending`, `accepted`, `rejected`, `completed` に加えて、以下を追加：
- `agreed`: 合意済み
- `kickoff_scheduled`: キックオフ予定
- `in_progress`: 実行中
- `delivering`: 納品中
- `under_review`: 検収中
- `revisions`: 修正依頼
- `rated`: 評価済み

#### 4. 自動化機能

- **検収期限の自動計算**: `submissions.submitted_at + 72時間` を自動設定
- **更新日時の自動更新**: 各テーブルの `updated_at` を自動更新
- **監査ログ関数**: `log_audit()` 関数で監査ログを記録

#### 5. RLS（Row Level Security）ポリシー

全ての新規テーブルにRLSポリシーを設定：
- 当該applicationに関係するユーザー（企業側 or 学生側）のみアクセス可能
- SELECT, INSERT, UPDATE の各操作に対してポリシーを設定

## 影響範囲

### 既存機能への影響

- **後方互換性**: 既存の `pending`, `accepted`, `rejected`, `completed` ステータスはそのまま動作
- **既存データ**: 既存のapplicationsデータには影響なし（新規カラムはデフォルト値）
- **既存API**: `/api/applications/[id]` のPATCHエンドポイントは新しいステータスを許可するように拡張

### データベース

- **新規テーブル**: 5つの新規テーブルが追加
- **インデックス**: パフォーマンス向上のためのインデックスを追加
- **外部キー制約**: 既存テーブルとの整合性を保証

## マイグレーション手順

### 実行方法

1. Supabase Dashboardにログイン
2. SQL Editorを開く
3. `scripts/migrate-add-matching-flow.sql` の内容をコピー＆ペースト
4. 実行ボタンをクリック

### ロールバック手順

問題が発生した場合：

1. Supabase DashboardのSQL Editorを開く
2. `scripts/migrate-rollback-matching-flow.sql` の内容をコピー＆ペースト
3. 実行ボタンをクリック

**注意**: ロールバックは全ての新規テーブルとデータを削除します。実行前に必ずデータバックアップを取ってください。

## 動作確認手順

### 1. マイグレーション実行後の確認

```sql
-- テーブルが作成されているか確認
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('agreements', 'milestones', 'submissions', 'change_requests', 'audit_logs');

-- applicationsテーブルに新しいカラムが追加されているか確認
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'applications' 
  AND column_name IN ('risk_flag', 'change_pending', 'kickoff_scheduled_at');

-- インデックスが作成されているか確認
SELECT indexname 
FROM pg_indexes 
WHERE tablename IN ('agreements', 'milestones', 'submissions', 'change_requests', 'audit_logs');
```

### 2. 既存機能の動作確認

- 既存の応募・承認・完了・評価フローが正常に動作することを確認
- 既存のステータス（`pending`, `accepted`, `rejected`, `completed`）が正常に動作することを確認

### 3. 新しいステータスの動作確認

- APIエンドポイント `/api/applications/[id]` で新しいステータス（`agreed`, `in_progress`等）が設定できることを確認

## リスクとロールバック手順

### リスク

1. **RLSポリシーの複雑さ**: 複数のテーブルを跨ぐRLSポリシーにより、パフォーマンスに影響する可能性
   - **対策**: インデックスを適切に設定し、必要に応じてクエリを最適化

2. **外部キー制約**: 既存データとの整合性チェック
   - **対策**: マイグレーション前に既存データの整合性を確認

3. **タイムゾーン**: `timestamptz` の扱い
   - **対策**: サーバー側でUTCを使用し、フロントエンドで適切に変換

### ロールバック手順

1. `scripts/migrate-rollback-matching-flow.sql` を実行
2. `app/api/applications/[id]/route.ts` を元の状態に戻す（gitで復元）

## 次のステップ

このPRがマージされた後、以下の順序で実装を進めます：

1. **合意シート（Light SOW）最小実装** - 作成/表示/`agreed`遷移
2. **マイルストーンボード** - CRUD/ドラッグ並替
3. **納品/検収タイマー** - 72h + 修正サイクル
4. **変更リクエスト** - 差分プレビュー→承認
5. **評価UIの改善** - 完了直後/翌日バナー
6. **監査ログ一覧** - a11y/テスト整備

## スクリーンショット/録画

（マイグレーション実行後のSupabase Dashboardのスクリーンショットを追加）

## 参考資料

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL JSONB Documentation](https://www.postgresql.org/docs/current/datatype-json.html)

