# Supabase 企業登録確認ガイド

企業登録が成功したときに、Supabaseのどこがどう変わるか、そして確認方法を説明します。

## 📋 登録時に更新される箇所

### 1. **Authentication → Users** (`auth.users`テーブル)
- **場所**: Supabase Dashboard → Authentication → Users
- **追加される内容**:
  - `id`: ユーザーの一意ID（UUID）
  - `email`: 登録したメールアドレス
  - `encrypted_password`: ハッシュ化されたパスワード
  - `email_confirmed_at`: メール確認日時（Auto Confirm有効時）
  - `raw_user_meta_data`: カスタムメタデータ
    ```json
    {
      "type": "company",
      "company_name": "登録した企業名"
    }
    ```
  - `created_at`: 登録日時

### 2. **Table Editor → companies** (`companies`テーブル)
- **場所**: Supabase Dashboard → Table Editor → companies
- **追加される内容**:
  - `id`: 企業の一意ID（UUID）
  - `user_id`: `auth.users`の`id`と紐づく（外部キー）
  - `name`: 企業名
  - `contact_email`: 連絡先メールアドレス
  - `website`: WebサイトURL（入力した場合）
  - `logo_url`: ロゴURL（アップロードまたはURL入力した場合）
  - `description`: 企業概要（入力した場合）
  - `created_at`: 登録日時
  - `updated_at`: 更新日時

### 3. **Table Editor → waiting_list** (`waiting_list`テーブル)
- **場所**: Supabase Dashboard → Table Editor → waiting_list
- **追加される内容**:
  - `email`: 連絡先メールアドレス
  - `type`: "company"
  - `name`: 企業名
  - `referrer`: "company-registration"
  - `created_at`: 登録日時

### 4. **Storage → company-logos** (ロゴをアップロードした場合)
- **場所**: Supabase Dashboard → Storage → company-logos
- **追加される内容**:
  - ファイル名: `{user_id}_{timestamp}.{拡張子}`
  - ファイル: アップロードしたロゴ画像

---

## 🔍 確認方法（ステップバイステップ）

### 方法1: Supabase Dashboardで確認

#### ステップ1: Authentication → Users を確認
1. Supabase Dashboardにログイン
2. 左メニューから **Authentication** をクリック
3. **Users** タブを選択
4. 登録したメールアドレスでユーザーを検索
5. ユーザーをクリックして詳細を確認
   - **Email**: 登録したメールアドレス
   - **User UID**: このIDが`companies`テーブルの`user_id`と一致します
   - **Metadata**: `type: "company"` と `company_name` が含まれているか確認

#### ステップ2: Table Editor → companies を確認
1. 左メニューから **Table Editor** をクリック
2. **companies** テーブルを選択
3. 登録した企業名で検索
4. レコードをクリックして詳細を確認
   - **user_id**: ステップ1で確認したUser UIDと一致しているか確認
   - **name**: 登録した企業名
   - **contact_email**: 連絡先メールアドレス
   - **logo_url**: ロゴURL（アップロードまたはURL入力した場合）

#### ステップ3: Table Editor → waiting_list を確認（オプション）
1. **Table Editor** → **waiting_list テーブル**を選択
2. 登録したメールアドレスで検索
3. レコードが追加されているか確認

#### ステップ4: Storage → company-logos を確認（ロゴをアップロードした場合）
1. 左メニューから **Storage** をクリック
2. **company-logos** バケットを選択
3. ファイル一覧にアップロードしたロゴが表示されているか確認
4. ファイル名は `{user_id}_{timestamp}.{拡張子}` の形式

---

### 方法2: SQL Editorで確認

#### クエリ1: 登録したユーザーを確認
```sql
SELECT 
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data,
  created_at
FROM auth.users
WHERE email = '登録したメールアドレス@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

#### クエリ2: 登録した企業情報を確認
```sql
SELECT 
  c.id,
  c.user_id,
  c.name,
  c.contact_email,
  c.website,
  c.logo_url,
  c.description,
  c.created_at,
  u.email as user_email
FROM companies c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE c.name = '登録した企業名'
ORDER BY c.created_at DESC
LIMIT 1;
```

#### クエリ3: ユーザーと企業の紐づきを確認
```sql
SELECT 
  u.id as user_id,
  u.email,
  u.raw_user_meta_data->>'company_name' as company_name_in_metadata,
  c.id as company_id,
  c.name as company_name,
  c.contact_email,
  c.logo_url
FROM auth.users u
LEFT JOIN companies c ON u.id = c.user_id
WHERE u.email = '登録したメールアドレス@example.com'
ORDER BY u.created_at DESC
LIMIT 1;
```

#### クエリ4: 外部キー制約エラーがないか確認
```sql
-- すべての企業レコードのuser_idがauth.usersに存在するか確認
SELECT 
  c.id,
  c.name,
  c.user_id,
  CASE 
    WHEN u.id IS NULL THEN '❌ user_idがauth.usersに存在しません'
    ELSE '✅ OK'
  END as status
FROM companies c
LEFT JOIN auth.users u ON c.user_id = u.id
WHERE u.id IS NULL;
```

---

### 方法3: ブラウザの開発者ツールで確認

1. 企業登録ページで登録を実行
2. ブラウザの開発者ツール（F12）を開く
3. **Network** タブを選択
4. 登録リクエストを確認:
   - `/auth/v1/signup` - ユーザー作成
   - `/rest/v1/companies` - 企業情報登録
   - `/storage/v1/object/company-logos/...` - ロゴアップロード（該当時）
5. 各リクエストのレスポンスを確認して、エラーがないか確認

---

## ⚠️ よくある問題と確認ポイント

### 問題1: 外部キー制約エラー
**症状**: `insert or update on table "companies" violates foreign key constraint "companies_user_id_fkey"`

**確認方法**:
```sql
-- ユーザーがauth.usersに存在するか確認
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = '登録したメールアドレス@example.com';
```

**解決策**:
- `email_confirmed_at`が`NULL`の場合、メール確認が必要です
- Supabase Dashboard → Authentication → Settings → Auth で「Enable email confirmations」をOFFにする

### 問題2: ロゴがアップロードされない
**確認方法**:
1. Storage → company-logos バケットを確認
2. ファイルが存在しない場合、Storageの設定を確認:
   - バケットが存在するか
   - バケットが公開（Public）になっているか
   - ポリシーが正しく設定されているか

### 問題3: セッションが保存されない
**確認方法**:
1. ブラウザの開発者ツール → Application → Local Storage
2. 以下のキーが存在するか確認:
   - `um.auth.accessToken`
   - `um.company.profile`
   - `um.user.type`

---

## 📊 確認チェックリスト

登録成功時に以下を確認してください：

- [ ] `auth.users`テーブルにユーザーが追加されている
- [ ] `companies`テーブルに企業情報が追加されている
- [ ] `companies.user_id`が`auth.users.id`と一致している
- [ ] `waiting_list`テーブルにレコードが追加されている（オプション）
- [ ] Storageにロゴがアップロードされている（ロゴをアップロードした場合）
- [ ] ブラウザのLocal Storageにセッション情報が保存されている
- [ ] エラーメッセージが表示されていない

---

## 🔗 関連リンク

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Authentication Docs](https://supabase.com/docs/guides/auth)
- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)

