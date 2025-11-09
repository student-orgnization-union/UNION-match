# Supabase SMTP設定ガイド（メール確認を有効にする場合）

## 目的

メール確認を必須にして、メールが送信されるようにするための設定手順です。

## 前提条件

- 「Confirm email」が**ON**になっている
- 「Allow new users to sign up」が**ON**になっている
- 「Email」プロバイダーが**Enabled**になっている

---

## ステップ1: SMTP設定を行う

### 方法A: Supabaseのデフォルトメール送信を使用（開発環境・制限あり）

Supabaseは無料プランでもデフォルトでメール送信機能を提供していますが、制限があります。

1. **Supabase Dashboard → Authentication → Settings**
2. **「Emails」タブ**を選択
3. **「SMTP Settings」**セクションを確認
4. デフォルト設定が有効になっているか確認

**注意**: 無料プランでは1時間あたり4通までという制限があります。

### 方法B: 外部SMTPサービスを使用（推奨・本番環境）

より確実にメールを送信するには、外部SMTPサービスを使用します。

#### 推奨サービス
- **SendGrid**（無料プラン: 100通/日）
- **Mailgun**（無料プラン: 5,000通/月）
- **AWS SES**（従量課金）
- **Resend**（無料プラン: 3,000通/月）

#### SendGridを使用する場合の設定手順

1. **SendGridアカウントを作成**
   - https://sendgrid.com にアクセス
   - アカウントを作成（無料プランでOK）

2. **API Keyを作成**
   - SendGrid Dashboard → Settings → API Keys
   - 「Create API Key」をクリック
   - 名前を入力（例: "Supabase"）
   - 権限: 「Full Access」を選択
   - API Keyをコピー（後で使用）

3. **Supabase Dashboardで設定**
   - Supabase Dashboard → Authentication → Settings
   - **「Emails」タブ**を選択
   - **「SMTP Settings」**セクションを開く
   - 以下の情報を入力：
     ```
     Host: smtp.sendgrid.net
     Port: 587
     Username: apikey
     Password: [SendGridのAPI Key]
     Sender email: [送信元メールアドレス（SendGridで認証済み）]
     Sender name: UNION Match
     ```
   - 「Save」をクリック

4. **メール送信のテスト**
   - Supabase Dashboard → Authentication → Users
   - テスト用ユーザーを作成
   - メールが届くか確認

---

## ステップ2: メールテンプレートの確認

1. **Supabase Dashboard → Authentication → Settings**
2. **「Emails」タブ**を選択
3. **「Email Templates」**セクションを確認
4. **「Confirm signup」**テンプレートを確認・カスタマイズ

メールテンプレートには以下の変数が使用できます：
- `{{ .ConfirmationURL }}`: メール確認用のURL
- `{{ .Email }}`: ユーザーのメールアドレス
- `{{ .SiteURL }}`: サイトのURL

---

## ステップ3: URL設定の確認

メール確認後のリダイレクト先を設定します。

1. **Supabase Dashboard → Authentication → Settings**
2. **「URL Configuration」タブ**を選択
3. **「Site URL」**を設定:
   - 開発環境: `http://localhost:3000`
   - 本番環境: `https://your-domain.com`
4. **「Redirect URLs」**に以下を追加:
   - `http://localhost:3000/**`
   - `https://your-domain.com/**`

---

## ステップ4: 動作確認

1. **企業登録を試す**
   - `/register/company` で登録を試みる
   - メール確認が必要な旨のメッセージが表示される

2. **メールを確認**
   - 登録したメールアドレスに確認メールが届くか確認
   - メール内の確認リンクをクリック

3. **確認後の動作**
   - 確認リンクをクリックすると、設定したリダイレクトURLに遷移
   - ログインページに遷移し、ログインできることを確認

---

## トラブルシューティング

### 問題1: メールが届かない

**確認事項**:
1. SMTP設定が正しいか確認
2. SendGridなどのSMTPサービスの設定が正しいか確認
3. 送信元メールアドレスが認証済みか確認
4. スパムフォルダを確認

**解決策**:
- SMTP設定を再確認
- 別のSMTPサービスを試す
- Supabase Dashboard → Logs → Auth Logs でエラーログを確認

### 問題2: メール確認後も登録が完了しない

**原因**: メール確認後、companiesテーブルへの登録が完了していない

**解決策**: メール確認後のコールバック処理を実装（コード側で対応が必要）

---

## 関連ドキュメント

- [Supabase SMTP Settings](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)
- [SendGrid Documentation](https://docs.sendgrid.com/)

