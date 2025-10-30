import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Building2,
  CheckCircle,
  LayoutGrid,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react'

import { BrandedPageShell } from '@/components/branded-page-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const roleCards = [
  {
    title: '学生・学生団体',
    icon: <Users className="h-6 w-6" />,
    description:
      '公開中の案件を探して応募。応募フォームはUXを磨き込んだUIで構成されています。',
    action: (
      <Button asChild className="w-full union-gradient union-glow text-white">
        <Link href="/projects">
          案件を探す
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    ),
    tips: ['案件詳細で背景や期待成果を把握', '応募内容はMarkdownで表現力を確保'],
  },
  {
    title: '企業担当者',
    icon: <Building2 className="h-6 w-6" />,
    description:
      '企業登録でブランドの想いや連絡先を共有。案件投稿はテンプレート入力で完了します。',
    action: (
      <Button asChild className="w-full union-gradient union-glow text-white">
        <Link href="/company">
          企業登録へ進む
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    ),
    tips: ['ロゴやウェブサイトを登録で信頼感UP', '投稿後は運営が内容をブラッシュアップ'],
  },
  {
    title: 'UNION運営チーム',
    icon: <Shield className="h-6 w-6" />,
    description:
      'ダッシュボードで案件の審査や応募状況確認、CSVエクスポートまでワンクリック。',
    action: (
      <Button
        asChild
        variant="outline"
        className="w-full border-white/25 bg-white/5 text-white transition hover:bg-white/10"
      >
        <Link href="/admin">
          管理画面へ
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    ),
    tips: ['ステータス管理で承認・否認を即時反映', '応募データはCSVでダウンロード可能'],
  },
]

export default function StartPage() {
  return (
    <BrandedPageShell
      badge={
        <Badge className="border-indigo-400/40 bg-indigo-500/15 text-indigo-100">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Getting Started
          </span>
        </Badge>
      }
      title={
        <>
          UNION Match の
          <span className="mt-3 block text-transparent union-text-gradient">はじめ方ガイド</span>
        </>
      }
      description="学生団体・企業・UNION 運営、それぞれの体験をデザインした導線をご用意しました。MVPを活用しながら、共創の第一歩をスムーズに踏み出しましょう。"
      actions={
        <>
          <Button
            asChild
            className="union-gradient union-glow h-12 rounded-full px-8 text-sm font-semibold uppercase tracking-[0.2em]"
          >
            <Link href="/projects">案件一覧へ進む</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-full border-white/25 bg-white/5 px-8 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <Link href="/company">企業登録ガイド</Link>
          </Button>
        </>
      }
    >
      <section className="grid gap-6 md:grid-cols-3">
        {roleCards.map((role) => (
          <Card key={role.title} className="glass-outline border-white/10 bg-black/25">
            <CardHeader>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/40 bg-indigo-500/15 text-indigo-100">
                {role.icon}
              </div>
              <CardTitle className="text-xl text-white">{role.title}</CardTitle>
              <CardDescription className="text-sm leading-relaxed text-slate-300">
                {role.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <ul className="space-y-2 text-sm text-slate-300">
                {role.tips.map((tip) => (
                  <li key={tip} className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-indigo-200" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
              {role.action}
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="glass-outline border-white/10 bg-black/30">
          <CardHeader className="space-y-3">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-indigo-200">
              <LayoutGrid className="h-4 w-4" />
              Product Flow
            </div>
            <CardTitle className="text-2xl text-white">3ステップではじめる案件運用</CardTitle>
            <CardDescription className="text-sm text-slate-300">
              案件の投稿から公開、応募確認まで。UNION Match がプロセス全体をガイドします。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              {
                step: 'STEP 01',
                label: '企業登録と案件作成',
                detail: '企業の想いや連絡先を入力し、テンプレートに沿って案件を投稿。',
              },
              {
                step: 'STEP 02',
                label: '運営による審査',
                detail: '内容のブラッシュアップを行い、公開準備を整えます。',
              },
              {
                step: 'STEP 03',
                label: '応募の受信と共有',
                detail: '学生団体の応募を管理画面で確認し、CSVでチーム共有。',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-200">
                  {item.step}
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-white">{item.label}</p>
                  <p className="text-sm text-slate-300">{item.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-outline border-white/10 bg-black/30">
          <CardContent className="flex h-full flex-col justify-between gap-6 p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3">
                  <Image
                    src="/images/logo-for-black.png"
                    alt="UNION Match エンブレム"
                    fill
                    sizes="64px"
                    className="object-contain"
                  />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Experience</p>
                  <p className="text-lg font-semibold text-white">すぐに試せるMVP構成</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-slate-300">
                デモモードを使えば、Supabase の設定なしで一通りの導線を体験できます。実際の運用では `.env.local`
                を整備するとリアルなデータフローに切り替わります。
              </p>
            </div>
            <div className="space-y-3 text-sm text-slate-300">
              <p className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-indigo-200" />
                shadcn/ui × Tailwind で再利用しやすいUI
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-indigo-200" />
                Supabase + Next.js でバックエンドも完備
              </p>
              <p className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-indigo-200" />
                CSV出力や承認フローなど運用機能を実装済み
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              className="w-full border-white/25 bg-white/5 text-white transition hover:bg-white/10"
            >
              <Link href="/setup">
                セットアップ手順を見る
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </BrandedPageShell>
  )
}

