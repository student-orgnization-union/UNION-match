'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Calendar, DollarSign, ArrowLeft, Globe, Star, Users, User } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

type Company = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  website: string | null
  created_at: string
  rating_avg?: number | null
  rating_count?: number | null
}

type Rating = {
  id: string
  score: number
  comment: string | null
  created_at: string
  rater_type: 'organization' | 'student'
  organizations?: { name: string } | null
  students?: { name: string } | null
}

type Project = {
  id: string
  title: string
  budget: string | null
  deadline: string | null
  description: string
  created_at: string
  status: string
}

export default function CompanyPage() {
  const params = useParams()
  const [company, setCompany] = useState<Company | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/companies/${params.id}`)
        if (!res.ok) throw new Error('failed')
        const json = await res.json()
        setCompany(json.company)
        setProjects(json.projects || [])
        setRatings(json.ratings || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [params.id])

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden text-white motion-fade-in" style={{ background: 'var(--bg-0-fallback)' }}>
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-12 h-12 union-gradient rounded-um-lg animate-pulse mx-auto mb-4"></div>
            <p style={{ color: 'var(--ink-muted-fallback)' }}>読み込み中...</p>
          </div>
        </div>
        <SiteFooter />
      </div>
    )
  }

  if (!company) {
    return (
      <div className="relative min-h-screen overflow-hidden text-white motion-fade-in" style={{ background: 'var(--bg-0-fallback)' }}>
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="glass-panel border-0 rounded-um-lg text-center">
            <CardContent className="py-12">
              <h3 className="text-2xl font-semibold mb-3 text-white">企業が見つかりません</h3>
              <Button asChild variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/10 mt-4">
                <Link href="/projects"><ArrowLeft className="h-4 w-4 mr-1" />案件一覧へ戻る</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <SiteFooter />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen overflow-hidden text-white motion-fade-in" style={{ background: 'var(--bg-0-fallback)' }}>
      <div 
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          background: 'radial-gradient(circle at 50% 20%, var(--um-blue-fallback) 0%, transparent 60%)',
        }}
      />
      <SiteHeader />
      <main className="relative z-10 max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
          <div className="w-16 h-16 rounded-um-lg bg-white/5 overflow-hidden flex items-center justify-center">
            {company.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo_url || "/placeholder.svg"} alt={`${company.name} ロゴ`} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="h-7 w-7" style={{ color: 'var(--ink-muted-fallback)' }} />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-white">{company.name}</h1>
              {company.rating_avg !== null && company.rating_avg !== undefined && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-400/40">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-yellow-400">
                    {company.rating_avg.toFixed(1)}
                  </span>
                  {company.rating_count && company.rating_count > 0 && (
                    <span className="text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>
                      ({company.rating_count})
                    </span>
                  )}
                </div>
              )}
            </div>
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm flex items-center gap-1 mt-1 transition hover:text-white" style={{ color: 'var(--ink-muted-fallback)' }}>
                <Globe className="h-4 w-4" />
                公式サイト
              </a>
            )}
          </div>
        </div>

        {company.description && (
          <Card className="glass-panel border-0 rounded-um-lg mb-10">
            <CardHeader>
              <CardTitle className="text-xl text-white">企業概要</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--ink-muted-fallback)' }}>{company.description}</p>
            </CardContent>
          </Card>
        )}

        {/* 評価セクション */}
        {ratings.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-6 text-white">評価</h2>
            <div className="grid gap-4">
              {ratings.map((rating) => {
                const raterName = rating.organizations?.name || rating.students?.name || '匿名'
                const raterType = rating.rater_type === 'organization' ? '学生団体' : '学生個人'
                return (
                  <Card key={rating.id} className="glass-panel border-0 rounded-um-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          {rating.rater_type === 'organization' ? (
                            <Users className="h-5 w-5" style={{ color: 'var(--ink-muted-fallback)' }} />
                          ) : (
                            <User className="h-5 w-5" style={{ color: 'var(--ink-muted-fallback)' }} />
                          )}
                          <div>
                            <p className="font-semibold text-white">{raterName}</p>
                            <p className="text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>{raterType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${
                                i < rating.score
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-600'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {rating.comment && (
                        <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-muted-fallback)' }}>
                          {rating.comment}
                        </p>
                      )}
                      <p className="text-xs mt-3" style={{ color: 'var(--ink-muted-fallback)' }}>
                        {new Date(rating.created_at).toLocaleDateString('ja-JP')}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-6 text-white">公開中の案件</h2>
          {projects.length === 0 ? (
            <p style={{ color: 'var(--ink-muted-fallback)' }}>現在公開中の案件はありません。</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <Card key={p.id} className="glass-panel border-0 rounded-um-lg hover:border-indigo-400/40 transition">
                  <CardHeader>
                    <CardTitle className="text-xl text-white line-clamp-2">{p.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm mb-4">
                      {p.budget && (
                        <div className="flex items-center" style={{ color: 'var(--ink-muted-fallback)' }}>
                          <div className="w-6 h-6 bg-indigo-500/20 rounded-lg flex items-center justify-center mr-3">
                            <DollarSign className="h-3 w-3 text-indigo-400" />
                          </div>
                          {p.budget}
                        </div>
                      )}
                      {p.deadline && (
                        <div className="flex items-center" style={{ color: 'var(--ink-muted-fallback)' }}>
                          <div className="w-6 h-6 bg-orange-500/20 rounded-lg flex items-center justify-center mr-3">
                            <Calendar className="h-3 w-3 text-orange-400" />
                          </div>
                          締切: {new Date(p.deadline).toLocaleDateString('ja-JP')}
                        </div>
                      )}
                    </div>
                    <Button asChild className="w-full union-gradient union-glow text-white border-0">
                      <Link href={`/projects/${p.id}`}>詳細を見る</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
