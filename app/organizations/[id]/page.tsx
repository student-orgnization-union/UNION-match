'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, ArrowLeft, Mail, Star, Building2 } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

type Organization = {
  id: string
  name: string
  description: string | null
  contact_email: string | null
  created_at: string
  rating_avg?: number | null
  rating_count?: number | null
}

type Rating = {
  id: string
  score: number
  comment: string | null
  created_at: string
  rater_type: 'company'
  companies?: { name: string } | null
}

export default function OrganizationPage() {
  const params = useParams()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [ratings, setRatings] = useState<Rating[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/organizations/${params.id}`)
        if (!res.ok) throw new Error('failed')
        const json = await res.json()
        setOrganization(json.organization)
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

  if (!organization) {
    return (
      <div className="relative min-h-screen overflow-hidden text-white motion-fade-in" style={{ background: 'var(--bg-0-fallback)' }}>
        <SiteHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="glass-panel border-0 rounded-um-lg text-center">
            <CardContent className="py-12">
              <h3 className="text-2xl font-semibold mb-3 text-white">学生団体が見つかりません</h3>
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
            <Users className="h-7 w-7" style={{ color: 'var(--ink-muted-fallback)' }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-white">{organization.name}</h1>
              {organization.rating_avg !== null && organization.rating_avg !== undefined && (
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-400/40">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-semibold text-yellow-400">
                    {organization.rating_avg.toFixed(1)}
                  </span>
                  {organization.rating_count && organization.rating_count > 0 && (
                    <span className="text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>
                      ({organization.rating_count})
                    </span>
                  )}
                </div>
              )}
            </div>
            {organization.contact_email && (
              <div className="text-sm flex items-center gap-1 mt-1" style={{ color: 'var(--ink-muted-fallback)' }}>
                <Mail className="h-4 w-4" />
                {organization.contact_email}
              </div>
            )}
          </div>
        </div>

        {organization.description && (
          <Card className="glass-panel border-0 rounded-um-lg mb-10">
            <CardHeader>
              <CardTitle className="text-xl text-white">団体概要</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--ink-muted-fallback)' }}>{organization.description}</p>
            </CardContent>
          </Card>
        )}

        {/* 評価セクション */}
        {ratings.length > 0 && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold mb-6 text-white">評価</h2>
            <div className="grid gap-4">
              {ratings.map((rating) => {
                const raterName = rating.companies?.name || '匿名'
                return (
                  <Card key={rating.id} className="glass-panel border-0 rounded-um-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5" style={{ color: 'var(--ink-muted-fallback)' }} />
                          <div>
                            <p className="font-semibold text-white">{raterName}</p>
                            <p className="text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>企業</p>
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
      </main>
      <SiteFooter />
    </div>
  )
}

