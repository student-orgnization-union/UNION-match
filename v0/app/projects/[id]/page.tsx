'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Calendar, DollarSign, Send, Building2, CheckCircle, AlertCircle, AlertTriangle, Globe } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

interface Company {
  id: string
  name: string
  logo_url: string | null
  description?: string | null
  website?: string | null
}

interface Project {
  id: string
  title: string
  budget: string | null
  deadline: string | null
  description: string
  created_at: string
  company?: Company | null
}

export default function ProjectDetailPage() {
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [isUsingMockData, setIsUsingMockData] = useState(false)
  const [formData, setFormData] = useState({
    appeal: '',
    organization_name: '',
    contact_info: ''
  })

  useEffect(() => {
    fetchProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  const fetchProject = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/projects/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      } else {
        console.error('Failed to fetch project')
      }
    } catch (error) {
      console.error('Error fetching project:', error)
      setIsUsingMockData(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      const response = await fetch(`/api/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: params.id,
          ...formData
        }),
      })

      if (response.ok) {
        setMessage({ type: 'success', text: '応募を送信しました。企業からの連絡をお待ちください。' })
        setFormData({ appeal: '', organization_name: '', contact_info: '' })
      } else {
        const j = await response.json().catch(() => ({}))
        throw new Error(j?.error || '応募に失敗しました')
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || '応募に失敗しました。もう一度お試しください。' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const isFormValid = formData.appeal && formData.contact_info

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

  if (!project) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="union-card border-white/10 text-center p-12 max-w-md">
          <CardContent>
            <div className="w-16 h-16 bg-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Building2 className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">案件が見つかりません</h3>
            <p className="text-gray-400 mb-8">指定された案件は存在しないか、まだ公開されていません。</p>
            <Button asChild className="union-gradient hover:opacity-90 text-white border-0">
              <Link href="/projects">案件一覧に戻る</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <SiteHeader />

      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Company snippet */}
        {project.company && (
          <Card className="union-card border-white/10 mb-8">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-white/5 overflow-hidden flex items-center justify-center">
                  {project.company.logo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={project.company.logo_url || "/placeholder.svg"} alt={`${project.company.name} ロゴ`} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="h-6 w-6 text-white/70" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Link href={`/companies/${project.company.id}`} className="text-lg font-semibold text-white hover:underline">
                      {project.company.name}
                    </Link>
                    {project.company.website && (
                      <a href={project.company.website} target="_blank" rel="noopener noreferrer" className="text-sm text-white/70 hover:text-white flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        公式サイト
                      </a>
                    )}
                  </div>
                  {project.company.description && (
                    <p className="text-sm text-white/70 mt-1 line-clamp-2">{project.company.description}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-12 lg:grid-cols-3">
          {/* 案件詳細 */}
          <div className="lg:col-span-2">
            <Card className="union-card border-white/10">
              <CardHeader>
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30 mb-4">
                      募集中
                    </Badge>
                    <CardTitle className="text-3xl text-white mb-4">{project.title}</CardTitle>
                  </div>
                </div>
                <div className="flex flex-wrap gap-6 text-sm">
                  {project.budget && (
                    <div className="flex items-center text-gray-400">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                        <DollarSign className="h-4 w-4 text-blue-400" />
                      </div>
                      <span>{project.budget}</span>
                    </div>
                  )}
                  {project.deadline && (
                    <div className="flex items-center text-gray-400">
                      <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center mr-3">
                        <Calendar className="h-4 w-4 text-orange-400" />
                      </div>
                      <span>締切: {new Date(project.deadline).toLocaleDateString('ja-JP')}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert prose-lg max-w-none">
                  <ReactMarkdown 
                    components={{
                      h1: ({children}) => <h1 className="text-2xl font-bold text-white mb-4">{children}</h1>,
                      h2: ({children}) => <h2 className="text-xl font-bold text-white mb-3">{children}</h2>,
                      h3: ({children}) => <h3 className="text-lg font-bold text-white mb-2">{children}</h3>,
                      p: ({children}) => <p className="text-gray-300 mb-4 leading-relaxed">{children}</p>,
                      ul: ({children}) => <ul className="text-gray-300 mb-4 space-y-2">{children}</ul>,
                      ol: ({children}) => <ol className="text-gray-300 mb-4 space-y-2">{children}</ol>,
                      li: ({children}) => <li className="ml-4">{children}</li>,
                    }}
                  >
                    {project.description}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 応募フォーム */}
          <div className="lg:col-span-1">
            <Card className="union-card border-white/10 sticky top-24">
              <CardHeader>
                <CardTitle className="text-2xl text-white">この案件に応募する</CardTitle>
                <CardDescription className="text-gray-400">
                  興味をお持ちいただいた場合は、以下のフォームからご応募ください
                </CardDescription>
              </CardHeader>
              <CardContent>
                {message && (
                  <Alert className={`mb-6 ${
                    message.type === 'success' 
                      ? 'border-green-500/30 bg-green-500/10' 
                      : 'border-red-500/30 bg-red-500/10'
                  }`}>
                    <div className="flex items-center">
                      {message.type === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
                      )}
                      <AlertDescription className={
                        message.type === 'success' ? 'text-green-300' : 'text-red-300'
                      }>
                        {message.text}
                      </AlertDescription>
                    </div>
                  </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="appeal" className="text-white">応募理由 *</Label>
                    <Textarea
                      id="appeal"
                      name="appeal"
                      value={formData.appeal}
                      onChange={handleChange}
                      placeholder="なぜこの案件に興味を持ったか、どのような貢献ができるかを記載してください"
                      rows={4}
                      required
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="organization_name" className="text-white">団体名</Label>
                    <Input
                      id="organization_name"
                      name="organization_name"
                      value={formData.organization_name}
                      onChange={handleChange}
                      placeholder="例：○○大学△△サークル"
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contact_info" className="text-white">連絡先 *</Label>
                    <Input
                      id="contact_info"
                      name="contact_info"
                      type="email"
                      value={formData.contact_info}
                      onChange={handleChange}
                      placeholder="example@student.ac.jp"
                      required
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-500 focus:border-white/40"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full union-gradient text-white border-0 py-3" 
                    disabled={!isFormValid || isSubmitting}
                  >
                    {isSubmitting ? '送信中...' : (<><Send className="h-4 w-4 mr-2" />応募する</>)}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
