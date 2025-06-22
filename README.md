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

