# Supabase設定ガイド

## ✅ 完了したこと

1. **.env.localのURL修正**
   - `NEXT_PUBLIC_SUPABASE_URL`を正しいSupabase URLに修正しました
   - 正しいURL: `https://yqnluaxuhbgtndmdmciv.supabase.co`

## 📋 次のステップ

### 1. データベーススキーマの適用

Supabase Dashboardで以下の手順でSQLを実行してください：

1. **Supabase Dashboardにアクセス**
   - https://supabase.com/dashboard にログイン
   - プロジェクト `yqnluaxuhbgtndmdmciv` を選択

2. **SQL Editorを開く**
   - 左サイドバーから「SQL Editor」をクリック
   - 「New query」をクリック

3. **SQLスクリプトを実行**
   - `scripts/setup-database-schema.sql` の内容をコピー
   - SQL Editorに貼り付けて実行

   または、以下のSQLファイルを使用：
   ```bash
   cat scripts/setup-database-schema.sql
   ```

4. **実行結果の確認**
   - 実行が成功すると「Success. No rows returned」と表示されます
   - 左サイドバーの「Table Editor」で以下のテーブルが作成されているか確認：
     - `companies`
     - `organizations` ← **新規追加**
     - `projects`
     - `applications`
     - `waiting_list`

### 2. 認証設定の確認

Supabase Dashboardで以下を確認・設定してください：

1. **Authentication → Settings**
   - 「Enable Email Signup」が**ON**になっているか確認
   - 「Confirm email」は開発中は**OFF**でも問題ありません（本番環境ではON推奨）

2. **Site URL設定**
   - 「Site URL」に開発環境のURLを設定（例: `http://localhost:3000`）
   - 「Redirect URLs」に以下を追加：
     - `http://localhost:3000/**`
     - `https://unionmatchmvp2.vercel.app/**`（本番環境URL）

3. **Email Templates（オプション）**
   - メール認証を使用する場合は、メールテンプレートをカスタマイズできます

### 3. 動作確認

1. **開発サーバーを起動**
   ```bash
   npm run dev
   ```

2. **ブラウザでアクセス**
   - http://localhost:3000 にアクセス
   - トップページが表示されることを確認

3. **登録機能のテスト**
   - 「学生団体として参加」→ `/register/organization` に遷移
   - 「企業として参加」→ `/register/company` に遷移
   - 登録フォームが正常に表示されることを確認

4. **ログイン機能のテスト**
   - `/login/organization` または `/login/company` にアクセス
   - ログインフォームが正常に表示されることを確認

## 🔧 トラブルシューティング

### データベースエラーが発生する場合

- Supabase Dashboard → Database → Tables でテーブルが作成されているか確認
- SQL Editorでエラーメッセージを確認
- `IF NOT EXISTS`を使用しているため、既存テーブルがあってもエラーになりません

### 認証エラーが発生する場合

- `.env.local`の環境変数が正しく設定されているか確認
- Supabase Dashboard → Settings → API で以下を確認：
  - Project URL: `https://yqnluaxuhbgtndmdmciv.supabase.co`
  - anon public key: `.env.local`の`NEXT_PUBLIC_SUPABASE_ANON_KEY`と一致しているか
  - service_role key: `.env.local`の`SUPABASE_SERVICE_ROLE_KEY`と一致しているか

### 環境変数の確認

```bash
# .env.localの内容を確認（SERVICE_ROLE_KEYは表示しない）
cat .env.local | grep -v SERVICE_ROLE_KEY
```

正しい設定：
```
NEXT_PUBLIC_SUPABASE_URL=https://yqnluaxuhbgtndmdmciv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

## 📝 確認チェックリスト

- [ ] `.env.local`のURLが正しい（vercel.appではなくsupabase.co）
- [ ] `scripts/setup-database-schema.sql`をSupabase Dashboardで実行済み
- [ ] `organizations`テーブルが作成されている
- [ ] `companies`テーブルに`user_id`カラムが追加されている
- [ ] `applications`テーブルに`organization_id`カラムが追加されている
- [ ] Supabase Dashboardで「Enable Email Signup」がON
- [ ] 開発サーバーが正常に起動する
- [ ] 登録・ログインページが正常に表示される

## 🎉 完了後の動作

セットアップが完了すると、以下が利用可能になります：

1. **学生団体**
   - アカウント登録 (`/register/organization`)
   - ログイン (`/login/organization`)
   - 案件閲覧・応募

2. **企業**
   - アカウント登録 (`/register/company`)
   - ログイン (`/login/company`)
   - 案件投稿 (`/post`)

3. **認証状態の管理**
   - ヘッダーにログイン状態が表示される
   - ログイン済みユーザーは適切なページにアクセス可能
