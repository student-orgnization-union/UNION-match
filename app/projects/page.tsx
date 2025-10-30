'use client'

import { useEffect, useMemo, useState, type ComponentProps, type ReactNode } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  Calendar,
  DollarSign,
  Filter,
  Layers,
  Search,
  Sparkles,
  Trophy,
} from 'lucide-react'

import SiteFooter from '@/components/site-footer'
import SiteHeader from '@/components/site-header'
import DbSetupCallout from '@/components/db-setup-callout'
import { OptimizedImage } from '@/components/optimized-image'
import { LoadingGrid } from '@/components/loading-components'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

type ProjectCard = {
  id: string
  title: string
  budget: string | null
  deadline: string | null
  description: string
  created_at: string
  company: { id: string; name: string; logo_url: string | null } | null
}

const budgetOptions = [
  { label: 'すべて', value: 'all' },
  { label: '低予算（10万円未満）', value: 'low' },
  { label: '中予算（10-50万円）', value: 'medium' },
  { label: '高予算（50万円以上）', value: 'high' },
  { label: '予算未記載', value: 'no-budget' },
]

export default function ProjectsPage() {
  // --- コアstateや効果の前にSupabase設定チェックを先に置く ---
  const hasSupabaseConfig = useMemo(
    () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    []
  );
  const [projects, setProjects] = useState<ProjectCard[]>([])
  const [filteredProjects, setFilteredProjects] = useState<ProjectCard[]>([])
  const [loading, setLoading] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [budgetFilter, setBudgetFilter] = useState('all')

  useEffect(() => {
    if (hasSupabaseConfig) {
      fetchProjects()
    } else {
      setLoading(false)
      setNeedsSetup(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSupabaseConfig])

  useEffect(() => {
    filterProjects()
  }, [projects, searchTerm, sortBy, budgetFilter])

  const fetchProjects = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('projects')
        .select(
          `
            id, title, budget, deadline, description, created_at,
            company:companies!projects_company_id_fkey ( id, name, logo_url )
          `,
        )
        .eq('status', 'public')
        .order('created_at', { ascending: false })

      if (error) {
        const msg = error.message || ''
        const hint = error.hint || ''
        const needsSetupFlag =
          msg.includes("Could not find the table 'public.projects'") ||
          (msg.includes('relation') && msg.includes('does not exist')) ||
          hint.includes('schema cache') ||
          error.code === '42P01'

        if (needsSetupFlag) {
          setNeedsSetup(true)
          return
        }

        throw error
      }

      const normalized: ProjectCard[] = ((data ?? []) as any[]).map((item) => ({
        id: item.id,
        title: item.title,
        budget: item.budget,
        deadline: item.deadline,
        description: item.description,
        created_at: item.created_at,
        company: item.company
          ? Array.isArray(item.company)
            ? item.company[0] ?? null
            : item.company
          : null,
      }))

      setProjects(normalized)
      setNeedsSetup(false)
    } catch (e) {
      console.error('Error fetching projects:', e)
      setNeedsSetup(true)
    } finally {
      setLoading(false)
    }
  }

  const filterProjects = () => {
    let filtered = [...projects]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter((project) => {
        const companyName = project.company?.name?.toLowerCase() ?? ''
        return (
          project.title.toLowerCase().includes(term) ||
          project.description.toLowerCase().includes(term) ||
          companyName.includes(term)
        )
      })
    }

    if (budgetFilter !== 'all') {
      filtered = filtered.filter((project) => {
        if (!project.budget) return budgetFilter === 'no-budget'
        const budget = project.budget.toLowerCase()
        if (budgetFilter === 'low') return budget.includes('万円未満') || budget.includes('1万円') || budget.includes('5万円')
        if (budgetFilter === 'medium') return budget.includes('10万円') || budget.includes('20万円') || budget.includes('30万円')
        if (budgetFilter === 'high') return budget.includes('50万円') || budget.includes('100万円') || budget.includes('以上')
        return true
      })
    }

    switch (sortBy) {
      case 'oldest':
        filtered.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        )
        break
      case 'deadline':
        filtered.sort((a, b) => {
          if (!a.deadline && !b.deadline) return 0
          if (!a.deadline) return 1
          if (!b.deadline) return -1
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
        })
        break
      default:
        filtered.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
    }

    setFilteredProjects(filtered)
  }

  const renderSupabaseWarning = () => (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#030712] via-[#050c1f] to-[#000308] text-slate-100">
      <BackgroundAura />
      <SiteHeader />
      <main className="relative z-10 mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl text-center">
          <Badge className="mx-auto w-fit border-yellow-400/50 bg-yellow-500/15 text-yellow-200">
            環境設定が必要です
          </Badge>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            Supabase の接続情報が設定されていません
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            `.env.local` に接続情報を記載すると、案件一覧が自動的に読み込まれます。
          </p>
        </section>
        <Card className="glass-outline mt-12 border-yellow-500/30 bg-yellow-500/10">
          <CardContent className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-full border border-yellow-400/30 bg-yellow-400/10 p-2 text-yellow-200">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-yellow-100">
                  NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です
                </p>
                <p className="mt-2 text-sm text-yellow-200/80">
                  `.env.example` をコピーして環境変数を整備し、ページを再読込してください。
                </p>
              </div>
            </div>
            <Button asChild variant="outline" className="border-yellow-400/50 text-yellow-100 hover:bg-yellow-500/20">
              <Link href="/setup">セットアップガイドを見る</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  )

  if (!hasSupabaseConfig) {
    return renderSupabaseWarning()
  }

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#030712] via-[#050c1f] to-[#000308] text-slate-100">
        <BackgroundAura />
        <SiteHeader />
        <main className="relative z-10 mx-auto max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <SectionHeader />
          <div className="mt-12">
            <LoadingGrid count={6} />
          </div>
        </main>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#030712] via-[#050c1f] to-[#000308] text-slate-100">
      <BackgroundAura />
      <SiteHeader />
      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <SectionHeader />

        {needsSetup && (
          <div className="mt-10">
            <DbSetupCallout />
          </div>
        )}

        {!needsSetup && projects.length > 0 && (
          <section className="mt-12">
            <Card className="glass-outline border-white/10 bg-black/30">
              <CardContent className="flex flex-col gap-6 py-6 md:flex-row md:items-end md:justify-between">
                <div className="flex-1 space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <FilterInput
                      label="キーワード検索"
                      icon={<Search className="h-4 w-4" />}
                      placeholder="案件名・企業名・内容で検索"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                    <SelectInput
                      label="並び順"
                      value={sortBy}
                      onValueChange={setSortBy}
                      options={[
                        { value: 'newest', label: '新しい順' },
                        { value: 'oldest', label: '古い順' },
                        { value: 'deadline', label: '締切順' },
                      ]}
                    />
                    <SelectInput
                      label="予算"
                      value={budgetFilter}
                      onValueChange={setBudgetFilter}
                      options={budgetOptions}
                    />
                  </div>
                </div>
                {(searchTerm || budgetFilter !== 'all' || sortBy !== 'newest') && (
                  <Button
                    variant="ghost"
                    className="self-start text-sm text-slate-300 hover:text-white"
                    onClick={() => {
                      setSearchTerm('')
                      setSortBy('newest')
                      setBudgetFilter('all')
                    }}
                  >
                    条件をリセット
                  </Button>
                )}
              </CardContent>
            </Card>
          </section>
        )}

        <section className="mt-12">
          {filteredProjects.length === 0 && !needsSetup ? (
            <EmptyState
              searchTerm={searchTerm}
              budgetFilter={budgetFilter}
              total={projects.length}
              onReset={() => {
                setSearchTerm('')
                setSortBy('newest')
                setBudgetFilter('all')
              }}
            />
          ) : (
            <>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-300">
                  <span className="text-lg font-semibold text-white">{filteredProjects.length}</span>
                  件の案件が見つかりました
                  {(searchTerm || budgetFilter !== 'all') && (
                    <span className="ml-2 text-xs text-slate-400">全{projects.length}件中</span>
                  )}
                </p>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <Sparkles className="h-4 w-4" />
                  表示されている案件は審査済みの公開案件です
                </div>
              </div>
              <div className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {filteredProjects.map((project) => (
                  <ProjectCardItem key={project.id} project={project} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}

function ProjectCardItem({ project }: { project: ProjectCard }) {
  return (
    <Card className="glass-outline border-white/10 bg-black/40 transition duration-300 hover:-translate-y-1 hover:border-white/20">
      <CardHeader className="space-y-4 pb-0">
        <div className="flex items-center justify-between">
          <Badge className="border-emerald-400/40 bg-emerald-400/15 text-emerald-100">募集中</Badge>
          <p className="text-xs text-slate-400">
            公開日: {new Date(project.created_at).toLocaleDateString('ja-JP')}
          </p>
        </div>
        <CardTitle className="line-clamp-2 text-xl text-white">{project.title}</CardTitle>
        <CardDescription className="line-clamp-3 text-sm leading-relaxed text-slate-300">
          {project.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div className="space-y-3 text-sm text-slate-300">
          {project.company && (
            <div className="flex items-center gap-3">
              <OptimizedImage
                src={project.company.logo_url}
                alt={`${project.company.name} ロゴ`}
                width={40}
                height={40}
                className="h-10 w-10 rounded-xl border border-white/10 bg-white/5 object-cover"
              />
              <Link
                href={`/companies/${project.company.id}`}
                className="text-sm font-medium text-white transition hover:text-indigo-200"
              >
                {project.company.name}
              </Link>
            </div>
          )}
          {project.budget && (
            <InfoRow icon={<DollarSign className="h-4 w-4 text-indigo-200" />} label={project.budget} />
          )}
          {project.deadline && (
            <InfoRow
              icon={<Calendar className="h-4 w-4 text-amber-200" />}
              label={`締切 ${new Date(project.deadline).toLocaleDateString('ja-JP')}`}
            />
          )}
        </div>
        <Button asChild className="w-full union-gradient union-glow h-11 text-sm font-semibold">
          <Link href={`/projects/${project.id}`}>案件の詳細を見る</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function InfoRow({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 px-4 py-2">
      <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/10">
        {icon}
      </span>
      <span className="text-sm text-slate-200">{label}</span>
    </div>
  )
}

function EmptyState({
  searchTerm,
  budgetFilter,
  total,
  onReset,
}: {
  searchTerm: string
  budgetFilter: string
  total: number
  onReset: () => void
}) {
  const isFiltered = Boolean(searchTerm || budgetFilter !== 'all')

  return (
    <Card className="glass-outline border-white/10 bg-black/20 text-center">
      <CardContent className="space-y-6 py-16">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-400/40 bg-indigo-500/15 text-indigo-100">
          {isFiltered ? <Search className="h-7 w-7" /> : <Layers className="h-7 w-7" />}
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-semibold text-white">
            {isFiltered ? '条件に合う案件が見つかりません' : '公開中の案件がまだありません'}
          </h3>
          <p className="text-sm leading-relaxed text-slate-300">
            {isFiltered
              ? '検索条件を変更して再度お試しください。'
              : '企業担当者が案件を投稿するとここに表示されます。'}
          </p>
          {!isFiltered && (
            <p className="text-xs text-slate-400">
              企業の皆様は案件投稿ページから公開申請を行ってください。
            </p>
          )}
        </div>
        {isFiltered ? (
          <Button variant="outline" className="border-white/20 text-slate-200 hover:bg-white/10" onClick={onReset}>
            条件をリセットして一覧を更新
          </Button>
        ) : (
          <Button asChild className="union-gradient union-glow h-11 px-8 text-sm font-semibold">
            <Link href="/company">企業として案件を投稿する</Link>
          </Button>
        )}
        {total === 0 && (
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
            <Trophy className="h-4 w-4" />
            初めての案件投稿は、応募者に大きくアピールできます。
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function FilterInput({
  label,
  icon,
  ...props
}: ComponentProps<typeof Input> & { label: string; icon: ReactNode }) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
        {icon}
        {label}
      </label>
      <Input
        {...props}
        className="h-11 rounded-xl border-white/10 bg-white/5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-400/30"
      />
    </div>
  )
}

function SelectInput({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string
  value: string
  onValueChange: (value: string) => void
  options: { label: string; value: string }[]
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">{label}</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-11 rounded-xl border-white/10 bg-white/5 text-sm text-white focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-400/30">
          <SelectValue placeholder="選択してください" />
        </SelectTrigger>
        <SelectContent className="border-white/10 bg-[#0d1222] text-slate-100">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function SectionHeader() {
  return (
    <section className="mx-auto max-w-3xl text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
        <Sparkles className="h-4 w-4" />
        Public Projects
      </div>
      <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
        協業案件を探す
      </h1>
      <p className="mt-4 text-lg leading-relaxed text-slate-300">
        UNION Match で公開されている案件から、学生団体に合うプロジェクトを発見しましょう。詳細ページでは募集背景や期待する成果まで確認できます。
      </p>
    </section>
  )
}

function BackgroundAura() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-[35%] h-[420px] bg-[radial-gradient(circle_at_center,_rgba(236,147,255,0.14),_transparent_65%)] blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[-25%] h-[480px] bg-[radial-gradient(circle_at_bottom,_rgba(45,212,191,0.1),_transparent_70%)] blur-3xl" />
    </>
  )
}
