# Supabase Storage ポリシー設定ガイド

## 概要

学生団体登録時にロゴファイルをアップロードするには、`organization-logos`バケットのポリシー設定が必要です。

---

## ステップ1: Storageバケットを作成

1. **Supabase Dashboardにアクセス**
   - https://supabase.com/dashboard にログイン
   - プロジェクトを選択

2. **Storageバケットを作成**
   - 左メニュー → **Storage**
   - **「New bucket」**をクリック
   - バケット名: `organization-logos`
   - **「Public bucket」**を**ON**にする（重要！）
   - **「Create bucket」**をクリック

---

## ステップ2: Storageポリシーを設定

### 方法A: Supabase DashboardのUIから設定（推奨）

1. **Storage → Policies** に移動
2. **`organization-logos`バケット**を選択
3. **「New Policy」**をクリック

#### ポリシー1: アップロードを許可（認証済みユーザー）

**Policy Name**: `Allow authenticated users to upload logos`

**Policy Definition**:
```sql
(
  bucket_id = 'organization-logos'::text
  AND (auth.role() = 'authenticated'::text)
)
```

**Allowed Operations**: 
- ✅ `INSERT` を選択

**Use RLS**: ✅ ON（有効にする）

**Policy Command**: `PERMISSIVE`（デフォルト）

**Target Roles**: `authenticated` を選択

---

#### ポリシー2: 読み取りを許可（全員）

**注意**: バケットを公開（Public）にしている場合、このポリシーは**不要**です。公開バケットは自動的に全員が読み取り可能です。

もしバケットを非公開にする場合は、以下のポリシーを追加：

**Policy Name**: `Allow public read access`

**Policy Definition**:
```sql
(bucket_id = 'organization-logos'::text)
```

**Allowed Operations**: 
- ✅ `SELECT` を選択

**Use RLS**: ✅ ON（有効にする）

**Policy Command**: `PERMISSIVE`（デフォルト）

**Target Roles**: `anon`, `authenticated` の両方を選択

---

### 方法B: SQL Editorから直接設定

Supabase Dashboard → **SQL Editor** を開き、以下のSQLを実行：

```sql
-- ポリシー1: 認証済みユーザーがアップロード可能
CREATE POLICY "Allow authenticated users to upload logos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-logos'::text
);

-- ポリシー2: 全員が読み取り可能（バケットが公開の場合は不要）
-- バケットを公開にしている場合は、このポリシーは不要です
CREATE POLICY "Allow public read access"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'organization-logos'::text
);
```

---

## ステップ3: 動作確認

1. **学生団体登録ページでロゴをアップロード**
   - `/register/organization` で登録を試みる
   - ロゴファイルを選択
   - アップロードが成功することを確認

2. **Storageで確認**
   - Supabase Dashboard → Storage → organization-logos
   - アップロードしたファイルが表示されているか確認

---

## 既存のバケット（company-logos）の設定も確認

企業登録用の`company-logos`バケットも同様の設定が必要です：

### company-logos バケットのポリシー

**ポリシー1: アップロードを許可**
```sql
(
  bucket_id = 'company-logos'::text
  AND (auth.role() = 'authenticated'::text)
)
```
**Allowed Operations**: `INSERT`

**ポリシー2: 読み取りを許可**（バケットが公開の場合は不要）
```sql
(bucket_id = 'company-logos'::text)
```
**Allowed Operations**: `SELECT`

---

## トラブルシューティング

### 問題1: 400エラーが発生する

**原因**: バケットが存在しない、またはポリシーが設定されていない

**解決策**:
1. Storage → `organization-logos` バケットが存在するか確認
2. バケットが公開（Public）になっているか確認
3. ポリシーが正しく設定されているか確認

### 問題2: 403エラー（Forbidden）が発生する

**原因**: 認証トークンが正しく渡されていない、またはポリシーが不足している

**解決策**:
1. 認証済みユーザーがアップロードできるポリシー（INSERT）を確認
2. ブラウザの開発者ツール → Network タブで、リクエストヘッダーを確認
3. `Authorization: Bearer <token>` が含まれているか確認

### 問題3: ファイルはアップロードできるが、画像が表示されない

**原因**: 読み取りポリシーが設定されていない、またはバケットが非公開

**解決策**:
1. バケットを公開（Public）にする
2. または、読み取りポリシー（SELECT）を追加

---

## ポリシーの確認方法

1. **Supabase Dashboard → Storage → Policies**
2. **`organization-logos`バケット**を選択
3. 以下のポリシーが表示されているか確認：
   - ✅ `Allow authenticated users to upload logos` (INSERT)
   - ✅ `Allow public read access` (SELECT) - バケットが公開の場合は不要

---

## セキュリティのベストプラクティス

1. **バケットを公開にする**: ロゴは公開情報なので、Publicバケットが適切です
2. **アップロードは認証必須**: 認証済みユーザーのみがアップロード可能にします
3. **ファイルサイズ制限**: アプリケーション側で5MB以下に制限しています
4. **ファイルタイプ制限**: 画像ファイル（JPEG、PNG、GIF、WebP）のみ許可

---

## 関連ドキュメント

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)
- [RLS (Row Level Security)](https://supabase.com/docs/guides/auth/row-level-security)

