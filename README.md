# UNION Match – Beta (Core SaaS)  
_Matching marketplace for student organizations & companies_

> **日本語補足**  
> 本プロジェクトは学生団体と企業のマッチングをサブスクリプションモデルで提供する
> β版 SaaS です。α掲示板 MVP からの学習を踏まえて、認証・Stripe 決済・
> 企業ダッシュボードなどを追加実装します。

---

## 1. What’s inside

| Area            | Key Points                                           |
| --------------- | ---------------------------------------------------- |
| **Stack**       | Next.js 14 • Tailwind + shadcn/ui • Supabase (Postgres + Auth + Storage) • Stripe Checkout/Billing |
| **Front-end**   | Pages Router, fully static export where possible     |
| **Back-end**    | Supabase REST + Row Level Security (β)               |
| **Auth**        | Magic-Link & Google / GitHub OAuth                   |
| **Payments**    | Free / Standard / Premium plans (Stripe)             |
| **Infra**       | Vercel Pro + Supabase Pro (2 GB)                      |
| **CI / CD**     | GitHub Actions → Vercel automatic deployments        |

---

## 2. Project structure

```

apps/
web/                # Next.js application
components/
pages/
lib/              # Supabase client, helpers
supabase/
migrations/         # SQL migrations (Supabase CLI)
seeds/              # Seed scripts
scripts/              # one-off utilities
.env.example
README.md

````

---

## 3. Environment variables

Copy `.env.example` to `.env.local` and fill the blanks:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<public-anon-key>
STRIPE_PRICE_STANDARD=<price_id>
STRIPE_PRICE_PREMIUM=<price_id>
STRIPE_WEBHOOK_SECRET=<whsec_...>
````

> **日本語補足**
>
> * `.env.local` は Git にコミットしないでください。
> * Supabase Dashboard → **Settings → API** で URL / anon key が取得できます。
> * Stripe 価格 ID は Stripe ダッシュボードからコピーしてください。

---

## 4. Getting started locally

```bash
# ① Install deps
pnpm install          # or yarn / npm

# ② Run Next.js dev server
pnpm dev              # http://localhost:3000

# ③ Supabase local (optional)
supabase start        # needs supabase CLI
```

### Database migrations

```bash
# Create migration
supabase migration new add_companies

# Apply to local
supabase db reset

# Deploy to cloud
supabase db push
```

---

## 5. Available scripts

| Command      | Description                      |
| ------------ | -------------------------------- |
| `pnpm dev`   | Run Next.js in dev mode          |
| `pnpm build` | Production build (static export) |
| `pnpm lint`  | ESLint + Prettier                |
| `pnpm test`  | Vitest unit tests                |
| `pnpm e2e`   | Playwright end-to-end tests      |

---

## 6. Deployment (Vercel)

1. Connect the GitHub repository to Vercel.
2. Add the same env vars under **Settings → Environment Variables**.
3. Set **Build Command** → `pnpm build`
4. Set **Output Directory** → `out`
5. Press **Deploy**. That’s it 🚀

---

## 7. Contributing

1. Create a feature branch from `beta`.
2. Follow conventional commit messages.
3. Open a PR & request review from `@pm-lead`.

---

## 8. Roadmap snapshot (α → β)

| Phase | Status         | Goal                          |
| ----- | -------------- | ----------------------------- |
| α     | ✅ Completed    | Validate “5 posts → 5 apps”   |
| β     | 🚧 In Progress | MRR ≥ ¥100k & 30 % conversion |
| γ     | ⏭ Planned      | Chat, analytics, tag search   |
| ζ     | ⏭ Planned      | Full release & scaling        |

---

## 9. License

MIT

> **日本語補足**
> 商用版リリース時にライセンス形態を見直す可能性があります。

---

## 10. Contact

* Product / PM: Dai Mishima – `dai@union.example`
* Design Lead: Mashiro Takayanagi
* Tech Advisor: Yamato Ueno

Happy hacking 👋

```

### 使い方

1. **`.env.example`** をプロジェクトに追加しておくと、開発者は `cp .env.example .env.local` だけで環境変数を準備できます。  
2. README 冒頭は英語で要点を整理し、> Quote で日本語補足を付ける構成にしています。  
3. Roadmap 部分は α→β の進行状況を簡易表にしているので、進捗に合わせて ✅ / 🚧 を更新してください。
```
