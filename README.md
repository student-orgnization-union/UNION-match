# UNION Match MVP

学生団体と企業をつなぐマッチングプラットフォームのMVP（Minimum Viable Product）です。

## 🎯 プロジェクト概要

UNION Matchは、学生団体と企業の協業を促進するプラットフォームです。企業が案件を投稿し、学生団体が応募できる仕組みを提供します。

## ✨ 主な機能

### 一般ユーザー（学生・学生団体）
- 📋 **案件一覧閲覧**: 公開中の協業案件を検索・フィルタ機能付きで閲覧
- 🔍 **詳細確認**: 案件の詳細情報、企業情報の確認
- 📝 **応募機能**: 興味のある案件に応募（団体名、連絡先、応募理由を入力）

### 企業ユーザー
- 🏢 **企業登録**: 企業情報の登録（企業名、連絡先、ロゴ、Webサイト等）
- 📤 **案件投稿**: 協業案件の投稿（案件名、予算、締切、詳細説明等）
- ⏳ **承認待ち**: 投稿後は運営による承認を経て公開

### 管理ユーザー（UNION運営）
- ✅ **案件承認**: 投稿された案件の承認・否認
- 📊 **応募管理**: 応募情報の確認・CSV出力
- 🔧 **システム管理**: データベース初期化、診断機能

## 🛠 技術スタック

- **フロントエンド**: Next.js 14, TypeScript, Tailwind CSS
- **UIコンポーネント**: shadcn/ui, Radix UI
- **データベース**: Supabase (PostgreSQL)
- **認証**: Supabase Auth（管理画面）
- **デプロイ**: Vercel
- **パッケージマネージャー**: pnpm

## 🚀 セットアップ

### 1. リポジトリのクローン
```bash
git clone <repository-url>
cd union-match-mvp
```

### 2. 依存関係のインストール
```bash
pnpm install
```

### 3. 環境変数の設定
`.env.example` を参考に `.env.local` ファイルを作成し、以下の環境変数を設定：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 管理者メールアドレス（任意・カンマ区切り）
SUPABASE_ADMIN_EMAILS=admin@example.com
```

管理画面にアクセスするユーザーは Supabase Auth 上で作成し、ユーザーの `app_metadata.roles` に `admin` を追加するか、`SUPABASE_ADMIN_EMAILS` にメールアドレスを登録してください。認証済みの管理者は `/login` からサインインし、ダッシュボード `/admin` に遷移します。

### 4. データベースの初期化
Supabase StudioのSQL Editorで`scripts/setup-database.sql`を実行：

```sql
-- 必要拡張（gen_random_uuid）
create extension if not exists pgcrypto;

-- companies
create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  logo_url text,
  website text,
  contact_email text,
  created_at timestamptz default now()
);

-- projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  budget text,
  deadline date,
  description text,
  contact_info text not null,
  status text default 'review',
  rating_avg double precision,
  created_at timestamptz default now(),
  company_id uuid
);

-- applications
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  appeal text not null,
  organization_name text,
  contact_info text not null,
  created_at timestamptz default now()
);

-- waiting_list
create table if not exists waiting_list (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  type text,
  name text,
  interest_score int,
  referrer text,
  created_at timestamptz default now()
);

-- 外部キー制約
alter table projects
  add constraint projects_company_id_fkey
  foreign key (company_id)
  references companies(id)
  on delete set null;

-- インデックス
create index if not exists idx_projects_status on projects(status);
create index if not exists idx_projects_created_at on projects(created_at);
create index if not exists idx_applications_project_id on applications(project_id);
create index if not exists idx_applications_created_at on applications(created_at);

-- RLS無効化（MVP段階）
alter table companies disable row level security;
alter table projects disable row level security;
alter table applications disable row level security;
alter table waiting_list disable row level security;
```

### 5. 開発サーバーの起動
```bash
pnpm dev
```

ブラウザで[http://localhost:3000](http://localhost:3000)を開いて確認

## 📁 プロジェクト構造

```
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   ├── admin/         # 管理用API
│   │   ├── applications/   # 応募API
│   │   ├── companies/     # 企業API
│   │   ├── projects/      # 案件API
│   │   └── register/      # 登録API
│   ├── admin/             # 管理画面
│   ├── companies/         # 企業詳細ページ
│   ├── company/           # 企業登録ページ
│   ├── post/              # 案件投稿ページ
│   ├── projects/          # 案件一覧・詳細ページ
│   ├── setup/             # セットアップガイド
│   └── start/             # スタートページ
├── components/            # Reactコンポーネント
│   ├── ui/               # shadcn/uiコンポーネント
│   ├── optimized-image.tsx
│   ├── loading-components.tsx
│   └── error-components.tsx
├── lib/                   # ユーティリティ
│   ├── db/               # データベース関連
│   └── supabase/         # Supabase設定
├── scripts/              # スクリプト
└── public/               # 静的ファイル
```

## 🌐 デプロイ

### Vercelへのデプロイ

1. Vercelアカウントにログイン
2. プロジェクトをインポート
3. 環境変数を設定
4. デプロイ実行

```bash
# Vercel CLIを使用する場合
vercel --prod
```

## 🔧 開発コマンド

```bash
# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# 本番サーバー起動
pnpm start

# リント
pnpm lint

# 型チェック
pnpm type-check
```

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🤝 コントリビューション

プルリクエストやイシューの報告を歓迎します。詳細は[CONTRIBUTING.md](CONTRIBUTING.md)をご覧ください。

## 📞 サポート

質問やサポートが必要な場合は、GitHubのIssuesページでお知らせください。
