# Supabase Storage設定ガイド（ロゴアップロード用）

## 概要

企業登録時にロゴファイルをアップロードするには、Supabase Storageの設定が必要です。

## ステップ1: Storageバケットを作成

1. **Supabase Dashboardにアクセス**
   - https://supabase.com/dashboard にログイン
   - プロジェクトを選択

2. **Storageバケットを作成**
   - 左メニュー → **Storage**
   - **「New bucket」**をクリック
   - バケット名: `company-logos`
   - **「Public bucket」**を**ON**にする（重要！）
   - **「Create bucket」**をクリック

## ステップ2: Storageポリシーを設定

1. **Storage → Policies**
2. **`company-logos`バケット**を選択
3. **「New Policy」**をクリック

### ポリシー1: アップロードを許可（認証済みユーザー）

**Policy Name**: `Allow authenticated users to upload logos`

**Policy Definition**:
```sql
(
  bucket_id = 'company-logos'::text
  AND (auth.role() = 'authenticated'::text)
)
```

**Allowed Operations**: `INSERT`

### ポリシー2: 読み取りを許可（全員）

**Policy Name**: `Allow public read access`

**Policy Definition**:
```sql
(bucket_id = 'company-logos'::text)
```

**Allowed Operations**: `SELECT`

または、バケットを公開（Public）にしている場合は、ポリシー2は不要です。

## ステップ3: 動作確認

1. **企業登録ページでロゴをアップロード**
   - `/register/company` で登録を試みる
   - ロゴファイルを選択
   - アップロードが成功することを確認

2. **Storageで確認**
   - Supabase Dashboard → Storage → company-logos
   - アップロードしたファイルが表示されているか確認

---

## トラブルシューティング

### 問題1: 400エラーが発生する

**原因**: バケットが存在しない、またはポリシーが設定されていない

**解決策**:
1. Storage → company-logos バケットが存在するか確認
2. バケットが公開（Public）になっているか確認
3. ポリシーが正しく設定されているか確認

### 問題2: 403エラーが発生する

**原因**: 認証トークンが正しく渡されていない、またはポリシーが不足している

**解決策**:
1. 認証済みユーザーがアップロードできるポリシーを確認
2. ブラウザの開発者ツール → Network タブで、リクエストヘッダーを確認

### 問題3: ロゴアップロードが失敗しても登録を続行したい

**現在の実装**: ロゴアップロードが失敗しても、登録は続行されます。警告メッセージが表示されますが、登録自体は成功します。

---

## 注意事項

- ロゴアップロードは**オプション**です
- ロゴアップロードが失敗しても、企業登録は完了します
- ロゴは後から設定できます
- Storageの設定が完了していない場合でも、登録は可能です

---

## 関連ドキュメント

- [Supabase Storage Docs](https://supabase.com/docs/guides/storage)
- [Supabase Storage Policies](https://supabase.com/docs/guides/storage/security/access-control)

