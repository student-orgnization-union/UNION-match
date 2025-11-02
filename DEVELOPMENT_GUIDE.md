# Union Match 開発ガイド

## 📋 実装完了内容

### 1. データベーススキーマ拡張 ✅
- `organizations`テーブルの追加（学生団体用）
- `companies`テーブルに`user_id`カラム追加（認証連携）
- `applications`テーブルに`organization_id`カラム追加
- Supabase Authとの連携設定

### 2. 認証システム実装 ✅
- **団体アカウント**: 登録・ログイン機能
  - `/register/organization` - 団体登録ページ
  - `/login/organization` - 団体ログインページ
- **企業アカウント**: 登録・ログイン機能
  - `/register/company` - 企業登録ページ
  - `/login/company` - 企業ログインページ
- セッション管理（Supabase Auth）
- ログイン状態に応じたUI表示

### 3. UIデザイン刷新 ✅
- トップページ/LPの完全刷新
  - Union Matchの機能説明
  - 団体・企業それぞれの登録導線
  - 登録済みユーザーへのログイン導線
- ヘッダーコンポーネントの改善
  - ログイン状態の表示
  - ユーザータイプ別のナビゲーション
  - ドロップダウンメニューでのユーザー情報表示

### 4. ページ構成
- `/` - トップページ（刷新済み）
- `/register/organization` - 団体登録
- `/login/organization` - 団体ログイン
- `/register/company` - 企業登録
- `/login/company` - 企業ログイン
- `/projects` - 案件一覧（既存）
- `/post` - 案件投稿（企業用、既存）
- `/admin` - 管理画面（既存）

## 🔧 事前準備が必要なもの

### 1. Supabaseプロジェクトの設定

1. **Supabaseプロジェクト作成**
   - [Supabase](https://supabase.com)でプロジェクトを作成

2. **環境変数の設定**
   プロジェクトルートに`.env.local`ファイルを作成し、以下を設定：

   ```env
   # Supabase設定（必須）
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # 管理画面用（任意）
   ADMIN_USERNAME=unionadmin
   ADMIN_PASSWORD=your-secure-password
   ```

3. **データベース初期化**
   ```bash
   # データベーススキーマを初期化
   npm run codex
   # または
   node scripts/init-db.ts
   ```

4. **Supabase Auth設定**
   - Supabaseダッシュボードで「Authentication」→「Providers」を開く
   - Email providerを有効化
   - 「Enable Email Signup」をONに設定
   - 必要に応じてメール確認をOFF（開発時）

### 2. 画像アセットの確認

以下の画像ファイルが存在することを確認：
- `/public/images/for-header.png` - ヘッダーロゴ
- `/public/images/for-footer.png` - フッターロゴ
- `/public/images/logo-for-black.png` - ロゴ（フォールバック）

### 3. 依存関係のインストール

```bash
npm install
# または
pnpm install
```

## 🚀 開発サーバーの起動

```bash
npm run dev
# または
pnpm dev
```

ブラウザで `http://localhost:3000` を開いて確認

## 📝 今後の拡張予定（推奨）

### 1. 認証保護されたページ
- `/post` - 企業アカウントのみアクセス可能にする
- `/projects/[id]/apply` - 団体アカウントで応募を簡易化

### 2. プロフィール管理ページ
- `/organization/profile` - 団体情報の編集
- `/company/profile` - 企業情報の編集

### 3. 応募管理機能
- 企業側: 自社案件への応募一覧ページ
- 団体側: 応募履歴の確認ページ

### 4. メール認証
- Supabase Authのメール確認機能を有効化
- パスワードリセット機能

### 5. パスワードポリシー
- より強力なパスワード要件
- パスワード強度インジケーター

## ⚠️ 注意事項

1. **本番環境への移行時**
   - `.env.local`の内容を本番環境変数に設定
   - `SUPABASE_SERVICE_ROLE_KEY`は機密情報のため、絶対に公開リポジトリにコミットしない
   - Row Level Security (RLS)を有効化してセキュリティを強化

2. **認証エラーの処理**
   - 現在、基本的なエラーハンドリングは実装済み
   - より詳細なエラーメッセージが必要な場合は追加実装を検討

3. **セッション管理**
   - Supabase Authのセッションは自動で管理される
   - 必要に応じてセッションの有効期限を調整

## 🔍 トラブルシューティング

### データベースエラー
- Supabaseダッシュボードでテーブルが作成されているか確認
- `scripts/init-db.ts`を再実行

### 認証エラー
- 環境変数が正しく設定されているか確認
- SupabaseダッシュボードでEmail providerが有効か確認

### UI表示の問題
- ブラウザのキャッシュをクリア
- `npm run dev`で開発サーバーを再起動
