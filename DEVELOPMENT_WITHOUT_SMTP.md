# SMTP設定なしで開発を進める方法

## 概要

SMTP設定がまだできない場合でも、メール確認を無効にして開発を進めることができます。

## 設定手順

### ステップ1: Supabase Dashboardでメール確認を無効にする

1. **Supabase Dashboardにアクセス**
   - https://supabase.com/dashboard にログイン
   - プロジェクトを選択

2. **認証設定を変更**
   - 左メニュー → **Authentication** → **Settings**
   - **「Sign In / Providers」タブ**を選択（または「Auth」タブ）
   - **「Confirm email」**のトグルを**OFF**にする
   - ページ下部の**「Save changes」**をクリック

### ステップ2: 設定の確認

以下の設定になっていることを確認してください：

- ✅ **Allow new users to sign up**: ON（有効）
- ❌ **Confirm email**: OFF（無効）
- ✅ **Email**プロバイダー: Enabled（有効）

### ステップ3: 動作確認

1. **企業登録を試す**
   - `/register/company` で登録を試みる
   - エラーなく登録できることを確認
   - メール確認なしで即座に登録完了することを確認

2. **データベースで確認**
   - Supabase Dashboard → Table Editor → companies
   - 登録した企業情報が追加されているか確認
   - `user_id` が正しく設定されているか確認

---

## 現在の実装について

現在のコードは、メール確認が有効な場合と無効な場合の両方に対応しています：

### メール確認がOFFの場合（現在の設定）
- ユーザー作成と同時に`companies`テーブルに登録
- 即座にログイン状態になる
- すぐに案件投稿ページに移動できる

### メール確認がONの場合（将来SMTP設定後）
- ユーザー作成時にメタデータに企業情報を保存
- メール確認を促すメッセージを表示
- メール確認後、ログイン時に自動的に`companies`テーブルに登録

---

## 将来SMTP設定を行う場合

SMTP設定が完了したら、以下の手順でメール確認を有効にできます：

1. **SMTP設定を行う**
   - `SMTP_SETUP_GUIDE.md` を参照
   - SendGridなどのSMTPサービスを設定

2. **メール確認を有効にする**
   - Supabase Dashboard → Authentication → Settings
   - 「Confirm email」を**ON**にする
   - 「Save changes」をクリック

3. **動作確認**
   - 企業登録時にメール確認が必要になることを確認
   - メールが正しく送信されることを確認
   - メール確認後に登録が完了することを確認

---

## 開発中の推奨設定

開発中は以下の設定を推奨します：

```
✅ Allow new users to sign up: ON
❌ Confirm email: OFF
✅ Email プロバイダー: Enabled
```

これにより：
- メール確認なしで即座に登録できる
- 開発がスムーズに進む
- SMTP設定がなくても問題なく動作する

---

## トラブルシューティング

### 問題1: まだメール確認エラーが出る

**解決策**:
1. Supabase Dashboardで設定を再度確認
2. ブラウザのキャッシュをクリア
3. 開発サーバーを再起動

### 問題2: 登録後もセッションが保存されない

**解決策**:
1. ブラウザの開発者ツール → Application → Local Storage を確認
2. `um.auth.accessToken` が存在するか確認
3. 存在しない場合、登録フローを再度確認

---

## 確認チェックリスト

- [ ] 「Confirm email」がOFFになっている
- [ ] 「Allow new users to sign up」がONになっている
- [ ] 企業登録がエラーなく完了する
- [ ] `companies`テーブルに企業情報が追加されている
- [ ] ブラウザのLocal Storageにセッション情報が保存されている
- [ ] ログイン状態で案件投稿ページにアクセスできる

