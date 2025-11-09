# Supabase 認証設定ガイド

## エラー: "Email signups are disabled"

このエラーは、Supabase Dashboardで「Enable Email Signup」がOFFになっている場合に発生します。

## 正しい設定手順

### ステップ1: Supabase Dashboardにアクセス
1. https://supabase.com/dashboard にログイン
2. プロジェクトを選択

### ステップ2: 認証設定を確認・変更
1. 左メニューから **Authentication** をクリック
2. **Settings** をクリック
3. **Auth** タブを選択

### ステップ3: 設定を確認
以下の2つの設定を確認してください：

#### ✅ 設定1: Enable Email Signup
- **状態**: **ON** にする（必須）
- **説明**: メールアドレスでの登録を許可します
- **OFFの場合**: 「Email signups are disabled」エラーが発生します

#### ✅ 設定2: Enable email confirmations
- **状態**: **OFF** にする（開発環境推奨）
- **説明**: メール確認を必須にします
- **OFFの場合**: メール確認なしで即座に登録できます
- **ONの場合**: メール確認が必要になります（メール送信設定が必要）

### ステップ4: 設定を保存
1. 両方の設定を確認
2. ページ下部の **「Save」** をクリック

---

## 設定の違い

| 設定項目 | ONの場合 | OFFの場合 |
|---------|---------|----------|
| **Enable Email Signup** | メールアドレスでの登録が可能 | メールアドレスでの登録が不可（エラー発生） |
| **Enable email confirmations** | メール確認が必要 | メール確認なしで即座に登録可能 |

---

## 推奨設定（開発環境）

開発環境では以下の設定を推奨します：

```
✅ Enable Email Signup: ON
❌ Enable email confirmations: OFF
```

これにより：
- メールアドレスでの登録が可能
- メール確認なしで即座に登録できる
- 開発がスムーズに進む

---

## 推奨設定（本番環境）

本番環境では以下の設定を推奨します：

```
✅ Enable Email Signup: ON
✅ Enable email confirmations: ON
✅ SMTP Settings: 正しく設定されている
```

これにより：
- メールアドレスでの登録が可能
- メール確認でセキュリティを確保
- 適切なメール送信設定が必要

---

## トラブルシューティング

### 問題1: 「Email signups are disabled」エラー

**原因**: 「Enable Email Signup」がOFFになっている

**解決策**:
1. Supabase Dashboard → Authentication → Settings → Auth
2. 「Enable Email Signup」をONにする
3. 「Save」をクリック
4. 再度登録を試みる

### 問題2: メール確認エラー

**原因**: 「Enable email confirmations」がONになっているが、メール送信設定がされていない

**解決策（開発環境）**:
1. 「Enable email confirmations」をOFFにする
2. 「Save」をクリック

**解決策（本番環境）**:
1. SMTP Settingsでメール送信設定を行う
2. メールテンプレートを確認

### 問題3: 設定を変更しても反映されない

**解決策**:
1. ブラウザのキャッシュをクリア
2. Supabase Dashboardで設定を再度確認
3. 開発サーバーを再起動
4. 再度登録を試みる

---

## 確認方法

設定が正しく反映されているか確認：

1. **Supabase Dashboard → Authentication → Settings → Auth**
   - 「Enable Email Signup」が **ON** になっているか確認
   - 「Enable email confirmations」が **OFF** になっているか確認（開発環境）

2. **企業登録を試す**
   - `/register/company` で登録を試みる
   - エラーなく登録できることを確認

3. **データベースで確認**
   - Supabase Dashboard → Table Editor → companies
   - 登録した企業情報が追加されているか確認

---

## 関連ドキュメント

- [Supabase Authentication Settings](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase Email Templates](https://supabase.com/docs/guides/auth/auth-email-templates)

