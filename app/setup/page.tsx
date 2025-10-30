import Link from 'next/link'
import {
  ArrowRight,
  CheckCircle,
  Database,
  FileCode,
  Rocket,
  Server,
  Settings2,
  TerminalSquare,
} from 'lucide-react'

import { BrandedPageShell } from '@/components/branded-page-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function SetupGuidePage() {
  return (
    <BrandedPageShell
      badge={
        <Badge className="border-indigo-400/40 bg-indigo-500/15 text-indigo-100">
          <span className="flex items-center gap-2">
            <Settings2 className="h-4 w-4" />
            Setup Guide
          </span>
        </Badge>
      }
      title="Supabase 連携でMVPを本番稼働させる"
      description="このページでは、UNION Match をモックから本番のデータフローに切り替えるための初期設定をまとめています。環境変数を整え、Supabase Studio でSQLを実行すれば準備は完了です。"
      actions={
        <>
          <Button
            asChild
            className="union-gradient union-glow h-12 rounded-full px-8 text-sm font-semibold uppercase tracking-[0.2em]"
          >
            <a
              href="https://supabase.com/dashboard/projects"
              target="_blank"
              rel="noopener noreferrer"
            >
              Supabase Studioを開く
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-full border-white/25 bg-white/5 px-8 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Link href="/start">運用フローを見る</Link>
          </Button>
        </>
      }
      contentClassName="space-y-12"
    >
      <section className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="glass-outline border-white/10 bg-black/30">
          <CardHeader className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-indigo-200">
              <Server className="h-4 w-4" />
              Overview
            </div>
            <CardTitle className="text-2xl text-white">セットアップの全体像</CardTitle>
            <CardDescription className="text-sm text-slate-300">
              設定は大きく3つのアクションで完結します。まず環境変数の登録、次にSupabaseのテーブル作成、最後に動作確認です。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                label: '環境変数を設定する',
                detail: 'Vercel / `.env.local` に Supabase URL とキーを入力します。',
                icon: <TerminalSquare className="h-5 w-5" />,
              },
              {
                label: 'SQLスクリプトを実行する',
                detail: '`scripts/setup-database.sql` を Supabase Studio で実行しテーブルを構築します。',
                icon: <FileCode className="h-5 w-5" />,
              },
              {
                label: '画面で疎通確認する',
                detail: '/projects, /company, /admin を開いてデータが操作できるか確認します。',
                icon: <Rocket className="h-5 w-5" />,
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/40 bg-indigo-500/15 text-indigo-100">
                  {item.icon}
                </div>
                <div>
                  <p className="text-base font-semibold text-white">{item.label}</p>
                  <p className="text-sm text-slate-300">{item.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-outline border-white/10 bg-black/30">
          <CardHeader className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-indigo-200">
              <Database className="h-4 w-4" />
              Environment
            </div>
            <CardTitle className="text-xl text-white">必須の環境変数</CardTitle>
            <CardDescription className="text-sm text-slate-300">
              Vercel 本番環境とローカル開発の双方に設定してください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-indigo-200">ブラウザ側</p>
              <ul className="mt-2 space-y-1">
                <li>NEXT_PUBLIC_SUPABASE_URL</li>
                <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-indigo-200">サーバー側</p>
              <ul className="mt-2 space-y-1">
                <li>SUPABASE_URL（末尾に /rest/v1 を付与しないこと）</li>
                <li>SUPABASE_SERVICE_ROLE_KEY</li>
              </ul>
            </div>
            <p className="text-xs text-slate-400">
              Tips: 開発中に `.env.local` を更新した場合は再起動を忘れずに。
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <Card className="glass-outline border-white/10 bg-black/30">
          <CardHeader className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-indigo-200">
              <FileCode className="h-4 w-4" />
              SQL Script
            </div>
            <CardTitle className="text-xl text-white">Supabase Studio で実行</CardTitle>
            <CardDescription className="text-sm text-slate-300">
              SQL Editor に以下を貼り付けて実行すると、テーブルと権限がまとめて作成されます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="rounded-2xl border border-white/10 bg-black/50 p-5 text-xs leading-relaxed text-slate-200">
{`-- scripts/setup-database.sql の抜粋
create extension if not exists "pgcrypto";

-- companies / projects / applications / waiting_list を作成
-- 既に存在する場合は IF NOT EXISTS で安全にスキップされます。`}
            </pre>
            <Button
              asChild
              variant="outline"
              className="mt-4 w-full border-white/25 bg-white/5 text-white transition hover:bg-white/10"
            >
              <a
                href="https://supabase.com/docs/guides/database"
                target="_blank"
                rel="noopener noreferrer"
              >
                Supabase ドキュメントを見る
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
            <p className="mt-3 text-xs text-slate-400">
              実行後は Studio の Table view でレコードが空のテーブルを確認できます。
            </p>
          </CardContent>
        </Card>

        <Card className="glass-outline border-white/10 bg-black/30">
          <CardHeader className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-indigo-200">
              <CheckCircle className="h-4 w-4" />
              Validation
            </div>
            <CardTitle className="text-xl text-white">動作確認チェックリスト</CardTitle>
            <CardDescription className="text-sm text-slate-300">
              ひと通りの導線を通して問題がないか最終確認しましょう。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-300">
            <ChecklistItem label="/company で企業登録 → localStorage に company_id が保存される" />
            <ChecklistItem label="/post で案件投稿 → Supabase の projects にレコード生成" />
            <ChecklistItem label="/admin でステータス変更 → review / public / rejected の更新が反映" />
            <ChecklistItem label="/projects で公開案件が表示される" />
            <ChecklistItem label="/projects/[id] から応募 → applications にレコード追加" />
            <Button
              asChild
              className="w-full union-gradient union-glow text-white"
            >
              <Link href="/admin">管理画面で応募一覧を確認</Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </BrandedPageShell>
  )
}

function ChecklistItem({ label }: { label: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-indigo-400/40 bg-indigo-500/15 text-indigo-100">
        <CheckCircle className="h-3.5 w-3.5" />
      </div>
      <p>{label}</p>
    </div>
  )
}
