'use client'

import Link from 'next/link'
import { Users, User, ArrowRight, Sparkles } from 'lucide-react'

import SiteFooter from '@/components/site-footer'
import SiteHeader from '@/components/site-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProjectsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden text-white motion-fade-in" style={{ background: 'var(--bg-0-fallback)' }}>
      <div 
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          background: 'radial-gradient(circle at 50% 20%, var(--um-blue-fallback) 0%, transparent 60%)',
        }}
      />
      <SiteHeader />
      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
            <Sparkles className="h-4 w-4" />
            Project Selection
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            協業案件を探す
          </h1>
          <p className="mt-4 text-lg leading-relaxed" style={{ color: 'var(--ink-muted-fallback)' }}>
            学生団体向けまたは学生個人向けの案件から、あなたに合うプロジェクトを発見しましょう。
          </p>
        </section>

        <section className="mt-16 grid gap-8 md:grid-cols-2">
          <Card className="glass-panel border-0 rounded-um-lg transition duration-300 hover:-translate-y-1 hover:border-indigo-400/40 motion-fade-in">
            <CardHeader className="space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-400/40 bg-indigo-500/15 text-indigo-100">
                <Users className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl text-white">学生団体向け案件</CardTitle>
              <CardDescription style={{ color: 'var(--ink-muted-fallback)' }}>
                学生団体として協業できる案件を探します。チームでの活動や団体の実績を活かせるプロジェクトが集まっています。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full union-gradient union-glow h-11 text-sm font-semibold">
                <Link href="/projects/organizations">
                  学生団体向け案件を見る
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="glass-panel border-0 rounded-um-lg transition duration-300 hover:-translate-y-1 hover:border-indigo-400/40 motion-fade-in">
            <CardHeader className="space-y-4">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-indigo-400/40 bg-indigo-500/15 text-indigo-100">
                <User className="h-8 w-8" />
              </div>
              <CardTitle className="text-2xl text-white">学生個人向け案件</CardTitle>
              <CardDescription style={{ color: 'var(--ink-muted-fallback)' }}>
                学生個人として参加できる案件を探します。個人のスキルや興味を活かせるプロジェクトが集まっています。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full union-gradient union-glow h-11 text-sm font-semibold">
                <Link href="/projects/students">
                  学生個人向け案件を見る
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
