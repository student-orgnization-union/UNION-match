# メール確認エラーの修正ガイド

## 問題

企業登録時に「メール確認が必要です」というエラーが表示されるが、メールが送信されない。

## 原因

Supabaseの設定で「Enable email confirmations」がONになっているが、メール送信設定（SMTP）が正しく設定されていないため、メールが送信されません。

## 解決方法

### 方法1: メール確認を無効にする（推奨・開発環境）

開発環境では、メール確認を無効にして即座に登録できるようにします。

#### ステップ1: Supabase Dashboardにアクセス
1. https://supabase.com/dashboard にログイン
2. プロジェクトを選択

#### ステップ2: 認証設定を変更
1. 左メニューから **Authentication** をクリック
2. **Settings** をクリック
3. **Auth** タブを選択
4. **「Enable Email Signup」** のトグルを **ON** にする（必須）
5. **「Enable email confirmations」** のトグルを **OFF** にする
6. ページ下部の **「Save」** をクリック

**⚠️ 注意**: 
- 「Enable Email Signup」がOFFの場合、「Email signups are disabled」エラーが発生します
- 両方の設定を正しく行う必要があります

#### ステップ3: 動作確認
1. 企業登録ページ（`/register/company`）で再度登録を試みる
2. エラーなく登録できることを確認

---

### 方法2: SMTP設定を行う（本番環境向け）

本番環境でメール確認を使用する場合は、SMTP設定が必要です。

#### ステップ1: SMTP設定
1. Supabase Dashboard → Authentication → Settings
2. **SMTP Settings** セクションを開く
3. メール送信サービス（SendGrid、Mailgun、AWS SESなど）の設定を行う
4. または、Supabaseのデフォルトメール送信を使用（制限あり）

#### ステップ2: メールテンプレートの確認
1. **Email Templates** タブを選択
2. 「Confirm signup」テンプレートを確認
3. 必要に応じてカスタマイズ

---

## 確認方法

### 設定が正しく反映されているか確認

1. **Supabase Dashboard → Authentication → Settings → Auth**
   - 「Enable email confirmations」が **OFF** になっているか確認

2. **企業登録を試す**
   - `/register/company` で登録を試みる
   - エラーなく登録できることを確認

3. **データベースで確認**
   - Supabase Dashboard → Table Editor → companies
   - 登録した企業情報が追加されているか確認
   - `user_id` が正しく設定されているか確認

---

## トラブルシューティング

### 問題1: 設定を変更してもエラーが続く

**解決策**:
1. ブラウザのキャッシュをクリア
2. Supabase Dashboardで設定を再度確認
3. 開発サーバーを再起動

### 問題2: メール確認をOFFにしたくない（本番環境）

**解決策**:
1. SMTP設定を行う（方法2を参照）
2. メールテンプレートを確認
3. メール送信ログを確認（Supabase Dashboard → Logs → Auth Logs）

### 問題3: 登録後もセッションが保存されない

**解決策**:
1. ブラウザの開発者ツール → Application → Local Storage を確認
2. `um.auth.accessToken` が存在するか確認
3. 存在しない場合、登録フローを再度確認

---

## 推奨設定（開発環境）

開発環境では以下の設定を推奨します：

- ✅ **Enable Email Signup**: ON
- ❌ **Enable email confirmations**: OFF
- ✅ **Enable phone signup**: OFF（電話番号認証を使用しない場合）

これにより、メール確認なしで即座に登録できます。

---

## 本番環境での設定

本番環境では以下の設定を推奨します：

- ✅ **Enable Email Signup**: ON
- ✅ **Enable email confirmations**: ON
- ✅ **SMTP Settings**: 正しく設定されている
- ✅ **Email Templates**: カスタマイズ済み

---

## 関連ドキュメント

- [Supabase Authentication Settings](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

