'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Building2, Calendar, DollarSign, ArrowLeft, Globe } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

type Company = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  website: string | null
  created_at: string
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/companies/${params.id}`)
        if (!res.ok) throw new Error('failed')
        const json = await res.json()
        setCompany(json.company)
        setProjects(json.projects || [])
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
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 union-gradient rounded-xl animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-400">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!company) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="union-card border-white/10 text-center p-10">
          <CardContent>
            <h3 className="text-2xl font-semibold mb-3">企業が見つかりません</h3>
            <Button asChild variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Link href="/projects"><ArrowLeft className="h-4 w-4 mr-1" />案件一覧へ戻る</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />
      <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-10">
          <div className="w-16 h-16 rounded-xl bg-white/5 overflow-hidden flex items-center justify-center">
            {company.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={company.logo_url || "/placeholder.svg"} alt={`${company.name} ロゴ`} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="h-7 w-7 text-white/70" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">{company.name}</h1>
            {company.website && (
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-white/70 hover:text-white flex items-center gap-1 mt-1">
                <Globe className="h-4 w-4" />
                公式サイト
              </a>
            )}
          </div>
        </div>

        {company.description && (
          <Card className="union-card border-white/10 mb-10">
            <CardHeader>
              <CardTitle className="text-xl text-white">企業概要</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80 leading-relaxed whitespace-pre-wrap">{company.description}</p>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-6">公開中の案件</h2>
          {projects.length === 0 ? (
            <p className="text-white/60">現在公開中の案件はありません。</p>
          ) : (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((p) => (
                <Card key={p.id} className="union-card border-white/10">
                  <CardHeader>
                    <CardTitle className="text-xl text-white">{p.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      {p.budget && (
                        <div className="flex items-center text-gray-400">
                          <div className="w-6 h-6 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                            <DollarSign className="h-3 w-3 text-blue-400" />
                          </div>
                          {p.budget}
                        </div>
                      )}
                      {p.deadline && (
                        <div className="flex items-center text-gray-400">
                          <div className="w-6 h-6 bg-orange-500/20 rounded-lg flex items-center justify-center mr-3">
                            <Calendar className="h-3 w-3 text-orange-400" />
                          </div>
                          締切: {new Date(p.deadline).toLocaleDateString('ja-JP')}
                        </div>
                      )}
                    </div>
                    <Button asChild className="w-full union-gradient text-white border-0 mt-5">
                      <Link href={`/projects/${p.id}`}>詳細を見る</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
