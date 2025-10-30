import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import {
  ArrowRight,
  Building2,
  CheckCircle,
  Compass,
  Fingerprint,
  Globe,
  Handshake,
  LineChart,
  Radar,
  Sparkles,
  Target,
  Users,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

type EntryPoint = {
  title: string
  description: string
  href: string
  cta: string
  accent: string
  icon: LucideIcon
}

type Highlight = {
  title: string
  description: string
  icon: LucideIcon
}

type TimelineStage = {
  title: string
  description: string
  detail: string
  icon: LucideIcon
}

const heroStats = [
  { label: '案件承認フロー', value: '運営の審査を可視化したステータス管理' },
  { label: '応募の一元管理', value: '学生団体の応募をCSVで出力・共有' },
  { label: 'セットアップ', value: 'Supabaseスクリプトとガイドを同梱' },
]

const entryPoints: EntryPoint[] = [
  {
    title: '学生・学生団体',
    description: '協業テーマに合わせて案件を検索し、想いを込めた応募を届けます。',
    href: '/projects',
    cta: '案件一覧へ',
    accent: 'Explore',
    icon: Users,
  },
  {
    title: '企業担当者',
    description: '企業情報を登録し、期待するパートナー像を踏まえた募集要項を作成します。',
    href: '/company',
    cta: '企業登録へ',
    accent: 'Create',
    icon: Building2,
  },
  {
    title: 'UNION運営',
    description: '案件審査と応募状況をダッシュボードで管理し、次の打ち手を素早く判断します。',
    href: '/admin',
    cta: '運営画面へ',
    accent: 'Curate',
    icon: LineChart,
  },
]

const highlights: Highlight[] = [
  {
    title: 'プロジェクトの発見をデザイン',
    description:
      '案件カードは目的・予算・締切を視覚的に整理。学生団体が自分たちに合う機会を素早く見つけられます。',
    icon: Compass,
  },
  {
    title: '企業の熱量を伝える情報設計',
    description:
      'テンプレートに沿って入力するだけで、企業の背景や期待が伝わる募集ページを作成できます。',
    icon: Target,
  },
  {
    title: '運営の審査もスムーズに',
    description:
      '審査・公開・否認などのステータスを即時更新。応募情報はCSVで共有し、抜け漏れを防ぎます。',
    icon: Radar,
  },
]

const timeline: TimelineStage[] = [
  {
    title: '企業登録',
    description: '企業情報を登録し、担当者の連絡先や想いを共有します。',
    detail: '入力時間は5分程度。登録後は案件投稿へ。',
    icon: Globe,
  },
  {
    title: '案件投稿',
    description: '募集背景・協業テーマ・期待する成果をテンプレートに沿って記入。',
    detail: 'ロゴ画像や予算を設定すると学生からの信頼度が向上します。',
    icon: Handshake,
  },
  {
    title: '運営審査',
    description: 'UNION運営が案件を確認し、必要があれば内容をブラッシュアップ。',
    detail: '公開後は学生団体へ自動で案内されます。',
    icon: Fingerprint,
  },
  {
    title: '応募・マッチング',
    description: '学生団体が応募し、企業は応募内容を一元管理できます。',
    detail: '応募はCSV出力も可能。社内共有や振り返りに活用できます。',
    icon: CheckCircle,
  },
]

const proofPoints = [
  { title: 'シームレスな応募導線', description: '案件詳細からワンクリックで応募フォームへ' },
  { title: 'SupabaseとNext.js', description: 'モダンスタックで拡張と運用に強い構成' },
  { title: 'UIライブラリ', description: 'shadcn/ui × Tailwind CSS で美しいUIを高速に構築' },
]

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#030712] via-[#050c1f] to-[#000308] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-1/3 h-[520px] bg-[radial-gradient(circle_at_center,_rgba(236,147,255,0.14),_transparent_65%)] blur-3xl" />
      <SiteHeader />

      <main className="relative z-10">
        <Hero />
        <EntrySection />
        <HighlightsSection />
        <TimelineSection />
        <ProofSection />
        <CTASection />
      </main>

      <SiteFooter />
    </div>
  )
}

function Hero() {
  return (
    <section className="px-4 pb-24 pt-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="hero-glow relative space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-100">
              <Sparkles className="h-4 w-4" />
              Students × Companies
            </span>
            <h1 className="text-balance text-5xl font-semibold tracking-tight text-white sm:text-6xl md:text-7xl">
              協業の<span className="text-gradient">スタートライン</span>をデザインする
            </h1>
            <p className="max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
              UNION Matchは、学生団体と企業が共創する新しい機会をつくるマッチング・プラットフォームです。案件投稿から審査、応募管理までを美しいUIで一貫してサポートします。
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button
                asChild
                className="union-gradient union-glow h-12 rounded-full px-10 text-sm font-semibold uppercase tracking-[0.18em]"
              >
                <Link href="/projects">
                  案件を探す
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full border-white/20 bg-white/5 px-8 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Link href="/company">企業として参加する</Link>
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <Card key={stat.label} className="glass-panel border-white/10 bg-white/5 px-5 py-6">
                  <CardDescription className="text-xs uppercase tracking-[0.24em] text-indigo-100">
                    {stat.label}
                  </CardDescription>
                  <CardTitle className="mt-3 text-sm font-semibold text-slate-200">{stat.value}</CardTitle>
                </Card>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -top-6 right-6 h-20 w-20 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl" />
            <div className="glass-panel relative flex h-full flex-col justify-between overflow-hidden px-10 py-12">
              <div className="flex flex-col gap-6">
                <span className="text-xs uppercase tracking-[0.22em] text-slate-400">Platform Canvas</span>
                <h2 className="text-3xl font-semibold text-white">案件の魅力が届くUI設計</h2>
                <p className="text-sm leading-relaxed text-slate-300">
                  カード・詳細・応募フォームが横断的に連携し、学生団体が自分たちの価値を表現できるUIを提供します。
                </p>
              </div>
              <div className="relative mt-6 h-64 overflow-hidden rounded-3xl border border-white/10 bg-white/5">
                <div className="absolute -left-12 top-10 h-32 w-32 rounded-full border border-white/10 bg-indigo-500/20 blur-2xl" />
                <div className="absolute -right-14 bottom-8 h-36 w-36 rounded-full border border-white/10 bg-purple-500/30 blur-2xl" />
                <div className="relative flex h-full flex-col justify-between p-6 text-sm text-slate-300">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">UI Blocks</p>
                  <p className="space-y-2">
                    <span className="block text-lg font-semibold text-white">Projects Grid</span>
                    <span className="block">Glass cards × gradient badges × action-oriented CTAs</span>
                  </p>
                  <div className="grid gap-2 text-xs uppercase tracking-[0.2em] text-slate-400 sm:grid-cols-2">
                    <span>Filter &amp; Search</span>
                    <span>Company Storytelling</span>
                    <span>Responsive Ready</span>
                    <span>Supabase Powered</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function EntrySection() {
  return (
    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-semibold text-white sm:text-4xl">
            ロールに合わせたスタート地点
          </h2>
          <p className="mt-4 text-base text-slate-300">
            学生・企業・運営、それぞれの目的に沿った導線を用意しました。
          </p>
        </div>
        <div className="grid-glimmer grid gap-6 md:grid-cols-3">
          {entryPoints.map((item) => (
            <Card
              key={item.title}
              className="glass-panel border-white/10 bg-black/30 transition duration-300 hover:-translate-y-1 hover:border-white/20"
            >
              <CardHeader className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-indigo-100">
                    {item.accent}
                  </span>
                  <item.icon className="h-5 w-5 text-indigo-200" />
                </div>
                <CardTitle className="text-xl text-white">{item.title}</CardTitle>
                <CardDescription className="text-sm leading-relaxed text-slate-300">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button
                  asChild
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  <Link href={item.href}>
                    {item.cta}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function HighlightsSection() {
  return (
    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-semibold text-white sm:text-4xl">
            体験を磨き込んだUIと情報設計
          </h2>
          <p className="mt-4 text-base text-slate-300">
            案件の魅力が伝わり、応募の熱量が返ってくる。そんな循環を生む3つのデザインコンセプトです。
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <Card key={item.title} className="glass-panel border-white/10 bg-black/25 p-6">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/40 bg-indigo-500/15 text-indigo-100">
                <item.icon className="h-6 w-6" />
              </div>
              <CardTitle className="text-xl text-white">{item.title}</CardTitle>
              <CardDescription className="mt-3 text-sm leading-relaxed text-slate-300">
                {item.description}
              </CardDescription>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}

function TimelineSection() {
  return (
    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-semibold text-white sm:text-4xl">
            公開までの流れ
          </h2>
          <p className="mt-4 text-base text-slate-300">
            案件投稿から公開、応募管理まで。運営と企業がスムーズに連携できるフローを用意しました。
          </p>
        </div>
        <div className="glass-panel border-white/10 bg-black/25 px-6 py-10 sm:px-10">
          <div className="grid gap-6 md:grid-cols-2">
            {timeline.map((stage, index) => (
              <div key={stage.title} className="flex items-start gap-4 rounded-2xl border border-white/12 bg-white/4 p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-indigo-400/40 bg-indigo-500/15 text-indigo-100">
                  <stage.icon className="h-5 w-5" />
                </div>
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Step {index + 1}</p>
                  <h3 className="text-lg font-semibold text-white">{stage.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-300">{stage.description}</p>
                  <p className="text-xs text-slate-400">{stage.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function ProofSection() {
  return (
    <section className="px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl text-center">
        <h2 className="text-balance text-3xl font-semibold text-white sm:text-4xl">
          プロダクトの核になる3つの要素
        </h2>
        <p className="mt-4 text-base text-slate-300">
          UNION Matchは、プロダクト開発に必要な仕組みとデザイン資産をまとめて提供します。
        </p>
      </div>
      <div className="mx-auto mt-10 grid max-w-5xl gap-6 md:grid-cols-3">
        {proofPoints.map((item) => (
          <Card key={item.title} className="glass-panel border-white/10 bg-black/25 px-6 py-8 text-left">
            <CardTitle className="text-lg text-white">{item.title}</CardTitle>
            <CardDescription className="mt-2 text-sm text-slate-300">{item.description}</CardDescription>
          </Card>
        ))}
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="px-4 pb-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <Card className="glass-panel border-white/10 bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/20 px-8 py-12 sm:px-12">
          <CardHeader className="space-y-4 text-center">
            <span className="text-xs uppercase tracking-[0.24em] text-indigo-200">Ready to Build</span>
            <CardTitle className="text-balance text-3xl font-semibold text-white sm:text-4xl">
              UNION MatchのMVPから、あなたのプロダクトをはじめよう
            </CardTitle>
            <CardDescription className="text-base text-slate-200">
              デザインとシステムが融合したテンプレートを活用して、学生団体と企業の出会いを最短距離で実現しましょう。
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              className="union-gradient union-glow h-12 rounded-full px-10 text-sm font-semibold uppercase tracking-[0.18em]"
            >
              <Link href="/projects">案件一覧を見る</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 rounded-full border-white/20 bg-white/5 px-8 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              <Link href="/company">企業として参加する</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
