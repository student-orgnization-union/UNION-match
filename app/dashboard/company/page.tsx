'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  Edit,
  Eye,
  Globe,
  ExternalLink,
  Save,
  Star,
  Copy,
  Users,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Link as LinkIcon,
  MessageSquare,
  X,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import {
  getCompanySession,
  getStoredUserType,
  hasSupabaseConfig,
  subscribeAuthChange,
  type AuthUserType,
  type CompanySession,
} from '@/lib/auth/session'

type Project = {
  id: string
  title: string
  status: string
  created_at: string
  description: string
  budget: string | null
  deadline: string | null
}

type CompanyInfo = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  website: string | null
  contact_email: string | null
}

type Application = {
  id: string
  project_id: string
  project_title: string
  project_description?: string | null
  project_budget?: string | null
  project_deadline?: string | null
  appeal: string
  organization_name: string | null
  matched_organization_name?: string | null
  matched_student_name?: string | null
  contact_info: string
  created_at: string
  accepted_at?: string | null
  status?: string
  organization_id?: string | null
  student_id?: string | null
  has_rating?: boolean // 評価済みかどうか
}

export default function CompanyDashboardPage() {
  const router = useRouter()
  const supabase = useMemo(() => {
    try {
      return createClient()
    } catch {
      return null
    }
  }, [])
  const [companySession, setCompanySession] = useState<CompanySession>(() => getCompanySession())
  const [userType, setUserType] = useState<AuthUserType>(() => getStoredUserType())
  const [projects, setProjects] = useState<Project[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditingCompany, setIsEditingCompany] = useState(false)
  const [editingCompany, setEditingCompany] = useState<Partial<CompanyInfo>>({})
  const [savingCompany, setSavingCompany] = useState(false)
  const [updatingApplication, setUpdatingApplication] = useState<string | null>(null)

  const isUsingMockData = useMemo(() => !hasSupabaseConfig, [])
  const isAuthorized = useMemo(() => 
    userType === 'company' && Boolean(companySession.accessToken && companySession.profile?.id),
    [userType, companySession.accessToken, companySession.profile?.id]
  )

  // フィルタリングされた応募リスト（パフォーマンス最適化）
  const pendingApplications = useMemo(() => 
    applications.filter((app) => app.status !== 'accepted' && app.status !== 'completed'),
    [applications]
  )
  const acceptedApplications = useMemo(() => 
    applications.filter((app) => app.status === 'accepted'),
    [applications]
  )

  useEffect(() => {
    const unsubscribe = subscribeAuthChange(() => {
      setCompanySession(getCompanySession())
      setUserType(getStoredUserType())
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (!isAuthorized || isUsingMockData) {
      setLoading(false)
      return
    }

    const fetchData = async () => {
      if (!supabase || !companySession.profile?.id) return

      try {
        // 案件を取得
        const { data: projectsData, error: projectsError } = await supabase
          .from('projects')
          .select('id, title, status, created_at, description, budget, deadline')
          .eq('company_id', companySession.profile.id)
          .order('created_at', { ascending: false })

        if (projectsError) throw projectsError

        setProjects(projectsData || [])

        // 企業情報を取得
        const { data: companyData, error: companyError } = await supabase
          .from('companies')
          .select('id, name, description, logo_url, website, contact_email')
          .eq('id', companySession.profile.id)
          .single()

        if (companyError) throw companyError

        setCompanyInfo(companyData)

        // 応募を取得（企業の案件に対する応募）
        const projectIds = (projectsData || []).map((p: Project) => p.id)
        if (projectIds.length > 0) {
          const { data: applicationsData, error: applicationsError } = await supabase
            .from('applications')
            .select(
              'id, project_id, appeal, organization_name, contact_info, created_at, accepted_at, status, organization_id, student_id, projects(id, title, description, budget, deadline, contact_info)',
            )
            .in('project_id', projectIds)
            .order('created_at', { ascending: false })

          if (applicationsError) throw applicationsError

          // 各応募に対して評価済みかどうか、学生団体名・学生個人名を取得
          const applicationsWithRatings = await Promise.all(
            (applicationsData || []).map(async (app: any) => {
              let hasRating = false
              if (companySession.profile?.id) {
                const { data: ratingData } = await supabase
                  .from('ratings')
                  .select('id')
                  .eq('application_id', app.id)
                  .eq('rater_type', 'company')
                  .eq('rater_id', companySession.profile.id)
                  .single()
                
                hasRating = !!ratingData
              }

              // 学生団体名を取得
              let matchedOrganizationName = app.organization_name || null
              if (app.organization_id) {
                const { data: orgData } = await supabase
                  .from('organizations')
                  .select('name')
                  .eq('id', app.organization_id)
                  .single()
                if (orgData) {
                  matchedOrganizationName = orgData.name
                }
              }

              // 学生個人名を取得
              let matchedStudentName = null
              if (app.student_id) {
                const { data: studentData } = await supabase
                  .from('students')
                  .select('name')
                  .eq('id', app.student_id)
                  .single()
                if (studentData) {
                  matchedStudentName = studentData.name
                }
              }

              const project = app.projects && !Array.isArray(app.projects) ? app.projects : null
              return {
                id: app.id,
                project_id: app.project_id,
                project_title: project?.title || '不明な案件',
                project_description: project?.description || null,
                project_budget: project?.budget || null,
                project_deadline: project?.deadline || null,
                appeal: app.appeal,
                organization_name: app.organization_name,
                matched_organization_name: matchedOrganizationName,
                matched_student_name: matchedStudentName,
                contact_info: app.contact_info,
                created_at: app.created_at,
                accepted_at: app.accepted_at,
                status: app.status || 'pending',
                organization_id: app.organization_id,
                student_id: app.student_id,
                has_rating: hasRating,
              }
            })
          )

          setApplications(applicationsWithRatings)
        }
      } catch (err: any) {
        console.error('Failed to fetch data:', err)
        setError('データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthorized, isUsingMockData, supabase, companySession.profile?.id])

  // 未認証の場合はリダイレクト
  useEffect(() => {
    if (!loading && !isAuthorized && !isUsingMockData) {
      router.push('/login/company?redirect=/dashboard/company')
    }
  }, [loading, isAuthorized, isUsingMockData, router])

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'review':
        return { label: '審査中', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-400/40' }
      case 'approved':
        return { label: '公開中', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-400/40' }
      case 'rejected':
        return { label: '却下', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-400/40' }
      default:
        return { label: status, color: 'text-white/60', bg: 'bg-white/5', border: 'border-white/20' }
    }
  }

  const getApplicationStatusLabel = useCallback((status: string | null | undefined) => {
    const normalizedStatus = status || 'pending'
    switch (normalizedStatus) {
      case 'pending':
        return { label: '審査中', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-400/40' }
      case 'accepted':
        return { label: '承認済み', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-400/40' }
      case 'rejected':
        return { label: '不承認', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-400/40' }
      case 'completed':
        return { label: '完了', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-400/40' }
      default:
        return { label: '審査中', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-400/40' }
    }
  }, [])

  const updateApplicationStatus = useCallback(async (applicationId: string, status: string) => {
    if (!companySession.accessToken) {
      setError('認証が必要です')
      return
    }

    setUpdatingApplication(applicationId)
    try {
      const response = await fetch(`/api/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${companySession.accessToken}`,
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'ステータス更新に失敗しました')
      }

      // 応募リストを更新
      setApplications((prev) =>
        prev.map((app) => {
          if (app.id === applicationId) {
            const updated = { ...app, status }
            if (status === 'accepted') {
              updated.accepted_at = new Date().toISOString()
            }
            return updated
          }
          return app
        })
      )
    } catch (err: any) {
      console.error('Failed to update application status:', err)
      setError(err.message || 'ステータス更新に失敗しました')
    } finally {
      setUpdatingApplication(null)
    }
  }, [companySession.accessToken])


  if (!hasSupabaseConfig) {
    return (
      <div className="min-h-screen text-white" style={{ background: 'var(--bg-0-fallback)' }}>
        <SiteHeader />
        <div className="mx-auto max-w-md px-4 py-16 text-center space-y-4">
          <Alert className="border-yellow-400/40 bg-yellow-500/10 text-yellow-100">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Supabase の設定が必要です</AlertDescription>
          </Alert>
        </div>
        <SiteFooter />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen text-white" style={{ background: 'var(--bg-0-fallback)' }}>
        <SiteHeader />
        <div className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p style={{ color: 'var(--ink-muted-fallback)' }}>読み込み中...</p>
        </div>
        <SiteFooter />
      </div>
    )
  }

  if (!isAuthorized && !isUsingMockData) {
    return null // リダイレクト中
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
      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 union-gradient rounded-um-lg flex items-center justify-center">
                <Building2 className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  企業<span className="union-text-gradient">ダッシュボード</span>
                </h1>
                <p className="text-lg mt-2" style={{ color: 'var(--ink-muted-fallback)' }}>
                  {companySession.profile?.name || '企業アカウント'}としてログイン中
                </p>
              </div>
            </div>
            <Button
              asChild
              className="union-gradient union-glow h-11 px-6 text-sm font-semibold"
            >
              <Link href="/post">
                <Plus className="mr-2 h-4 w-4" />
                新規案件を投稿
              </Link>
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="mb-8 border-rose-400/40 bg-rose-500/10 text-rose-100">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="glass-panel border-0 rounded-um-lg">
            <CardHeader>
              <CardTitle className="text-lg text-white">投稿済み案件</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{projects.length}</div>
              <p className="text-sm mt-2" style={{ color: 'var(--ink-muted-fallback)' }}>件</p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-0 rounded-um-lg">
            <CardHeader>
              <CardTitle className="text-lg text-white">公開中</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-400">
                {projects.filter((p) => p.status === 'approved').length}
              </div>
              <p className="text-sm mt-2" style={{ color: 'var(--ink-muted-fallback)' }}>件</p>
            </CardContent>
          </Card>

          <Card className="glass-panel border-0 rounded-um-lg">
            <CardHeader>
              <CardTitle className="text-lg text-white">審査中</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-400">
                {projects.filter((p) => p.status === 'review').length}
              </div>
              <p className="text-sm mt-2" style={{ color: 'var(--ink-muted-fallback)' }}>件</p>
            </CardContent>
          </Card>
        </div>

        {/* 企業詳細のプレビュー・編集 */}
        {companyInfo && (
          <div className="mb-12">
            <Card className="glass-panel border-0 rounded-um-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl text-white">企業詳細情報</CardTitle>
                  <div className="flex items-center gap-2">
                    {!isEditingCompany && (
                      <>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                        >
                          <Link href={`/companies/${companyInfo.id}`} target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            プレビュー
                          </Link>
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditingCompany(true)
                            setEditingCompany({
                              name: companyInfo.name,
                              description: companyInfo.description || '',
                              website: companyInfo.website || '',
                              logo_url: companyInfo.logo_url || '',
                            })
                          }}
                          variant="outline"
                          size="sm"
                          className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          編集
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <CardDescription style={{ color: 'var(--ink-muted-fallback)' }}>
                  学生側から見た企業詳細画面のプレビューと編集ができます
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditingCompany ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="company-name" style={{ color: 'var(--ink-muted-fallback)' }}>
                        企業名 <span className="text-rose-300">*</span>
                      </Label>
                      <Input
                        id="company-name"
                        value={editingCompany.name || ''}
                        onChange={(e) => setEditingCompany({ ...editingCompany, name: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-description" style={{ color: 'var(--ink-muted-fallback)' }}>
                        企業概要
                      </Label>
                      <Textarea
                        id="company-description"
                        value={editingCompany.description || ''}
                        onChange={(e) => setEditingCompany({ ...editingCompany, description: e.target.value })}
                        rows={6}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="企業の概要や特徴を入力してください"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-website" style={{ color: 'var(--ink-muted-fallback)' }}>
                        公式サイトURL
                      </Label>
                      <Input
                        id="company-website"
                        type="url"
                        value={editingCompany.website || ''}
                        onChange={(e) => setEditingCompany({ ...editingCompany, website: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company-logo" style={{ color: 'var(--ink-muted-fallback)' }}>
                        ロゴURL
                      </Label>
                      <Input
                        id="company-logo"
                        type="url"
                        value={editingCompany.logo_url || ''}
                        onChange={(e) => setEditingCompany({ ...editingCompany, logo_url: e.target.value })}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="https://example.com/logo.png"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={async () => {
                          if (!supabase || !companyInfo.id || !editingCompany.name) return
                          setSavingCompany(true)
                          try {
                            const { error: updateError } = await supabase
                              .from('companies')
                              .update({
                                name: editingCompany.name,
                                description: editingCompany.description || null,
                                website: editingCompany.website || null,
                                logo_url: editingCompany.logo_url || null,
                              })
                              .eq('id', companyInfo.id)

                            if (updateError) throw updateError

                            setCompanyInfo({ ...companyInfo, ...editingCompany })
                            setIsEditingCompany(false)
                            setError(null)
                          } catch (err: any) {
                            console.error('Failed to update company:', err)
                            setError('企業情報の更新に失敗しました')
                          } finally {
                            setSavingCompany(false)
                          }
                        }}
                        disabled={savingCompany || !editingCompany.name}
                        className="union-gradient union-glow h-10 px-6 text-sm font-semibold"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {savingCompany ? '保存中...' : '保存'}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditingCompany(false)
                          setEditingCompany({})
                        }}
                        variant="outline"
                        size="sm"
                        className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                      >
                        キャンセル
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-start gap-6">
                      {companyInfo.logo_url ? (
                        <div className="w-24 h-24 rounded-2xl border border-white/10 bg-white/5 p-2 flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={companyInfo.logo_url}
                            alt={`${companyInfo.name} ロゴ`}
                            className="w-full h-full rounded-xl object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-12 w-12" style={{ color: 'var(--ink-muted-fallback)' }} />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2">{companyInfo.name}</h3>
                        {companyInfo.website && (
                          <a
                            href={companyInfo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm hover:text-white transition"
                            style={{ color: 'var(--ink-muted-fallback)' }}
                          >
                            <Globe className="h-4 w-4" />
                            {companyInfo.website}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {companyInfo.contact_email && (
                          <p className="text-sm mt-2" style={{ color: 'var(--ink-muted-fallback)' }}>{companyInfo.contact_email}</p>
                        )}
                      </div>
                    </div>
                    {companyInfo.description && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--ink-muted-fallback)' }}>企業概要</h4>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--ink-muted-fallback)' }}>
                          {companyInfo.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">投稿した案件一覧</h2>
          </div>

          {projects.length === 0 ? (
            <Card className="glass-panel border-0 rounded-um-lg">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--ink-muted-fallback)' }} />
                <p className="text-lg mb-2 text-white">まだ案件を投稿していません</p>
                <p className="text-sm mb-6" style={{ color: 'var(--ink-muted-fallback)' }}>
                  新規案件を投稿して、学生団体とのマッチングを始めましょう
                </p>
                <Button
                  asChild
                  className="union-gradient union-glow h-11 px-6 text-sm font-semibold"
                >
                  <Link href="/post">
                    <Plus className="mr-2 h-4 w-4" />
                    新規案件を投稿
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => {
                const statusInfo = getStatusLabel(project.status)
                return (
                  <Card key={project.id} className="glass-panel border-0 rounded-um-lg">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold text-white">{project.title}</h3>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.border} border ${statusInfo.color}`}
                            >
                              {statusInfo.label}
                            </span>
                          </div>
                          <p className="text-sm mb-4 line-clamp-2" style={{ color: 'var(--ink-muted-fallback)' }}>{project.description}</p>
                          <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>
                            {project.budget && (
                              <span>予算: {project.budget}</span>
                            )}
                            {project.deadline && (
                              <span>期限: {new Date(project.deadline).toLocaleDateString('ja-JP')}</span>
                            )}
                            <span>投稿日: {new Date(project.created_at).toLocaleDateString('ja-JP')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                          >
                            <Link href={`/projects/${project.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              閲覧
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* マッチング成立 */}
        {acceptedApplications.length > 0 && (
          <div className="mt-12 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">マッチング成立</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--ink-muted-fallback)' }}>
                  承認済みの応募一覧です。連絡先情報を確認して、プロジェクトを進めてください。
                </p>
              </div>
            </div>
            <div className="grid gap-4">
              {acceptedApplications.map((application) => (
                  <Card key={application.id} className="glass-panel border-0 rounded-um-lg border-green-400/20">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-semibold text-white">{application.project_title}</h3>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-500/10 border border-green-400/40 text-green-400">
                              マッチング成立
                            </span>
                          </div>
                          
                          {/* マッチング成立メッセージ */}
                          <div className="mb-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-400/20">
                            <p className="text-sm font-semibold text-indigo-300 mb-1">
                              🎉 マッチング成立
                            </p>
                            <p className="text-sm text-white">
                              UNION Matchにて案件の承諾いただいた
                              {application.matched_organization_name ? (
                                <span className="font-semibold text-indigo-200">
                                  {application.matched_organization_name}
                                </span>
                              ) : application.matched_student_name ? (
                                <span className="font-semibold text-indigo-200">
                                  {application.matched_student_name}
                                </span>
                              ) : application.organization_name ? (
                                <span className="font-semibold text-indigo-200">
                                  {application.organization_name}
                                </span>
                              ) : (
                                <span className="font-semibold text-indigo-200">応募者</span>
                              )}
                              とのマッチングが成立しました。
                            </p>
                            {application.accepted_at && (
                              <p className="text-xs mt-2" style={{ color: 'var(--ink-muted-fallback)' }}>
                                成立日: {new Date(application.accepted_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            )}
                          </div>

                          {(application.matched_organization_name || application.organization_name) && (
                            <p className="text-sm mb-2" style={{ color: 'var(--ink-muted-fallback)' }}>
                              応募団体:{' '}
                              {application.organization_id ? (
                                <Link
                                  href={`/organizations/${application.organization_id}`}
                                  target="_blank"
                                  className="font-semibold text-white hover:text-indigo-400 transition underline inline-flex items-center gap-1"
                                >
                                  {application.matched_organization_name || application.organization_name}
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                              ) : (
                                <span className="font-semibold text-white">{application.organization_name}</span>
                              )}
                            </p>
                          )}
                          {application.matched_student_name && (
                            <p className="text-sm mb-2" style={{ color: 'var(--ink-muted-fallback)' }}>
                              応募者: <span className="font-semibold text-white">{application.matched_student_name}</span>
                            </p>
                          )}
                          
                          {/* 案件情報サマリー */}
                          <div className="mt-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-400/20">
                            <p className="text-sm font-semibold text-indigo-300 mb-3 flex items-center gap-2">
                              <FileText className="h-4 w-4" />
                              案件情報
                            </p>
                            <div className="space-y-2 text-sm">
                              {application.project_description && (
                                <p className="text-white line-clamp-2" style={{ color: 'var(--ink-muted-fallback)' }}>
                                  {application.project_description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-4 mt-3">
                                {application.project_budget && (
                                  <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4" style={{ color: 'var(--ink-muted-fallback)' }} />
                                    <span style={{ color: 'var(--ink-muted-fallback)' }}>予算: {application.project_budget}</span>
                                  </div>
                                )}
                                {application.project_deadline && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4" style={{ color: 'var(--ink-muted-fallback)' }} />
                                    <span style={{ color: 'var(--ink-muted-fallback)' }}>
                                      期限: {new Date(application.project_deadline).toLocaleDateString('ja-JP')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-indigo-400/20">
                              <Button
                                asChild
                                variant="outline"
                                size="sm"
                                className="w-full border-indigo-400/40 bg-indigo-500/10 text-indigo-100 hover:bg-indigo-500/20"
                              >
                                <Link href={`/projects/${application.project_id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  案件詳細ページを開く
                                </Link>
                              </Button>
                            </div>
                          </div>

                          {/* アクションエリア */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {application.contact_info && application.contact_info.includes('@') && (
                              <Button
                                size="sm"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                onClick={async () => {
                                  try {
                                    // トラッキングIDを生成
                                    const trackingId = `track_${application.id}_${Date.now()}`
                                    const projectUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/projects/${application.project_id}?ref=email&application_id=${application.id}&tracking_id=${trackingId}`
                                    
                                    // メール本文テンプレート（案件詳細を含む）
                                    const emailBody = `こんにちは、

UNION Matchにて案件「${application.project_title}」のマッチングが成立いたしました。

【案件詳細】
案件名: ${application.project_title}
${application.project_description ? `案件説明: ${application.project_description}\n` : ''}${application.project_budget ? `予算: ${application.project_budget}\n` : ''}${application.project_deadline ? `期限: ${new Date(application.project_deadline).toLocaleDateString('ja-JP')}\n` : ''}

案件詳細ページ: ${projectUrl}

プロジェクトの詳細について、ご連絡させていただきます。

よろしくお願いいたします。

---
このメールはUNION Match経由で送信されました。
案件URL: ${projectUrl}`

                                    const mailtoLink = `mailto:${application.contact_info}?subject=${encodeURIComponent(`【UNION Match】${application.project_title}について`)}&body=${encodeURIComponent(emailBody)}`
                                    
                                    // 連絡履歴を記録
                                    if (companySession.accessToken) {
                                      try {
                                        await fetch('/api/contact/log', {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${companySession.accessToken}`,
                                          },
                                          body: JSON.stringify({
                                            application_id: application.id,
                                            recipient_type: application.organization_id ? 'organization' : 'student',
                                            recipient_id: application.organization_id || application.student_id,
                                            contact_method: 'email',
                                            contact_info: application.contact_info,
                                            message_preview: `件名: 【UNION Match】${application.project_title}について`,
                                            project_url: projectUrl,
                                            tracking_id: trackingId,
                                          }),
                                        })
                                      } catch (logError) {
                                        console.error('Failed to log contact:', logError)
                                      }
                                    }
                                    
                                    // メール送信
                                    window.location.href = mailtoLink
                                  } catch (err) {
                                    console.error('Failed to send email:', err)
                                    alert('メール送信に失敗しました')
                                  }
                                }}
                              >
                                <Mail className="mr-2 h-4 w-4" />
                                メールで連絡する
                              </Button>
                            )}
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                            >
                              <Link href={`/projects/${application.project_id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                案件詳細を見る
                              </Link>
                            </Button>
                          </div>

                          {/* 連絡先情報と連絡方法 */}
                          {application.contact_info && (
                            <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-400/20">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold text-green-400 flex items-center gap-2">
                                  <MessageSquare className="h-4 w-4" />
                                  連絡先情報
                                </p>
                              </div>
                              <div className="space-y-3">
                                {application.contact_info.includes('@') ? (
                                  <Button
                                    size="sm"
                                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                                    onClick={async () => {
                                      try {
                                        // トラッキングIDを生成
                                        const trackingId = `track_${application.id}_${Date.now()}`
                                        const projectUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/projects/${application.project_id}?ref=email&application_id=${application.id}&tracking_id=${trackingId}`
                                        
                                        // メール本文テンプレート（案件詳細を含む）
                                        const emailBody = `こんにちは、

UNION Matchにて案件「${application.project_title}」のマッチングが成立いたしました。

【案件詳細】
案件名: ${application.project_title}
${application.project_description ? `案件説明: ${application.project_description}\n` : ''}${application.project_budget ? `予算: ${application.project_budget}\n` : ''}${application.project_deadline ? `期限: ${new Date(application.project_deadline).toLocaleDateString('ja-JP')}\n` : ''}

案件詳細ページ: ${projectUrl}

プロジェクトの詳細について、ご連絡させていただきます。

よろしくお願いいたします。

---
このメールはUNION Match経由で送信されました。
案件URL: ${projectUrl}`

                                        const mailtoLink = `mailto:${application.contact_info}?subject=${encodeURIComponent(`【UNION Match】${application.project_title}について`)}&body=${encodeURIComponent(emailBody)}`
                                        
                                        // 連絡履歴を記録
                                        if (companySession.accessToken) {
                                          try {
                                            await fetch('/api/contact/log', {
                                              method: 'POST',
                                              headers: {
                                                'Content-Type': 'application/json',
                                                Authorization: `Bearer ${companySession.accessToken}`,
                                              },
                                              body: JSON.stringify({
                                                application_id: application.id,
                                                recipient_type: application.organization_id ? 'organization' : 'student',
                                                recipient_id: application.organization_id || application.student_id,
                                                contact_method: 'email',
                                                contact_info: application.contact_info,
                                                message_preview: `件名: 【UNION Match】${application.project_title}について`,
                                                project_url: projectUrl,
                                                tracking_id: trackingId,
                                              }),
                                            })
                                          } catch (logError) {
                                            console.error('Failed to log contact:', logError)
                                            // ログ記録に失敗してもメール送信は続行
                                          }
                                        }
                                        
                                        // メール送信
                                        window.location.href = mailtoLink
                                      } catch (err) {
                                        console.error('Failed to send email:', err)
                                        alert('メール送信に失敗しました')
                                      }
                                    }}
                                  >
                                    <Mail className="mr-2 h-4 w-4" />
                                    メールで連絡する
                                  </Button>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-white">
                                      <Phone className="h-4 w-4" />
                                      {application.contact_info}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs border-green-400/40 bg-green-500/10 text-green-100 hover:bg-green-500/20"
                                      onClick={async () => {
                                        try {
                                          await navigator.clipboard.writeText(application.contact_info)
                                          alert('連絡先情報をコピーしました')
                                        } catch (err) {
                                          console.error('Failed to copy:', err)
                                        }
                                      }}
                                    >
                                      <Copy className="h-3 w-3 mr-1" />
                                      コピー
                                    </Button>
                                  </div>
                                )}
                                <p className="text-xs mt-2" style={{ color: 'var(--ink-muted-fallback)' }}>
                                  ※ 連絡はUNION Match経由で行ってください。案件URLを含めることで、プロジェクトの進捗を管理できます。
                                </p>
                              </div>
                            </div>
                          )}

                          {/* プロジェクト進行フロー（タイミー風） */}
                          <div className="mt-4 p-4 rounded-lg bg-indigo-500/10 border border-indigo-400/20">
                            <p className="text-sm font-semibold text-indigo-300 mb-3 flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              プロジェクト進行フロー
                            </p>
                            <div className="space-y-3">
                              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 border-2 border-indigo-400/40 flex items-center justify-center text-sm font-bold text-indigo-300">
                                  1
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-white mb-1">初回連絡</p>
                                  <p className="text-xs mb-2" style={{ color: 'var(--ink-muted-fallback)' }}>
                                    上記の「メールで連絡する」ボタンから、案件詳細を含むメールを送信してください
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-3 text-xs border-indigo-400/40 bg-indigo-500/10 text-indigo-100 hover:bg-indigo-500/20"
                                    onClick={async () => {
                                      try {
                                        const projectUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/projects/${application.project_id}`
                                        await navigator.clipboard.writeText(projectUrl)
                                        alert('案件URLをコピーしました')
                                      } catch (err) {
                                        console.error('Failed to copy:', err)
                                      }
                                    }}
                                  >
                                    <LinkIcon className="h-3 w-3 mr-1" />
                                    案件URLをコピー
                                  </Button>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 border-2 border-indigo-400/40 flex items-center justify-center text-sm font-bold text-indigo-300">
                                  2
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-white mb-1">プロジェクト進行</p>
                                  <p className="text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>
                                    定期的に進捗を確認し、必要に応じて連絡を取り合ってください
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-500/20 border-2 border-indigo-400/40 flex items-center justify-center text-sm font-bold text-indigo-300">
                                  3
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-semibold text-white mb-1">完了と評価</p>
                                  <p className="text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>
                                    プロジェクトが完了したら、「完了にする」ボタンをクリックして評価を行ってください
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <Button
                            onClick={() => updateApplicationStatus(application.id, 'completed')}
                            disabled={updatingApplication === application.id}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {updatingApplication === application.id ? '更新中...' : '完了にする'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        {/* 応募一覧 */}
        <div className="mt-12 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">応募一覧</h2>
            <p className="text-sm" style={{ color: 'var(--ink-muted-fallback)' }}>
              全{applications.length}件の応募
            </p>
          </div>

          {applications.length === 0 ? (
            <Card className="glass-panel border-0 rounded-um-lg">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--ink-muted-fallback)' }} />
                <p className="text-lg mb-2 text-white">まだ応募がありません</p>
                <p className="text-sm" style={{ color: 'var(--ink-muted-fallback)' }}>
                  案件が公開されると、学生団体からの応募がここに表示されます
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingApplications.map((application) => (
                <Card key={application.id} className="glass-panel border-0 rounded-um-lg">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-semibold text-white">{application.project_title}</h3>
                          {(() => {
                            const statusInfo = getApplicationStatusLabel(application.status || 'pending')
                            return (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.border} border ${statusInfo.color}`}
                              >
                                {statusInfo.label}
                              </span>
                            )
                          })()}
                        </div>
                        {application.organization_name && (
                          <p className="text-sm mb-2" style={{ color: 'var(--ink-muted-fallback)' }}>
                            応募団体:{' '}
                            {application.organization_id ? (
                              <Link
                                href={`/organizations/${application.organization_id}`}
                                target="_blank"
                                className="font-semibold text-white hover:text-indigo-400 transition underline inline-flex items-center gap-1"
                              >
                                {application.organization_name}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            ) : (
                              <span className="font-semibold text-white">{application.organization_name}</span>
                            )}
                          </p>
                        )}
                        <p className="text-sm mb-4 line-clamp-3" style={{ color: 'var(--ink-muted-fallback)' }}>{application.appeal}</p>
                        <div className="flex flex-wrap gap-4 text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>
                          {application.contact_info && (
                            <span>連絡先: {application.contact_info}</span>
                          )}
                          <span>応募日: {new Date(application.created_at).toLocaleDateString('ja-JP')}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <div className="flex items-center gap-2">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                          >
                            <Link href={`/projects/${application.project_id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              案件を見る
                            </Link>
                          </Button>
                        </div>
                        {/* 承認/拒否ボタン（pending、null、undefined、または空文字の場合に表示） */}
                        {(!application.status || application.status === 'pending' || application.status === '' || application.status === null) && (
                          <div className="flex flex-col items-end gap-2 mt-2">
                            <div className="flex items-center gap-2">
                              <Button
                                onClick={() => updateApplicationStatus(application.id, 'accepted')}
                                disabled={updatingApplication === application.id}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white min-w-[100px]"
                              >
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {updatingApplication === application.id ? '更新中...' : '承認'}
                              </Button>
                              <Button
                                onClick={() => updateApplicationStatus(application.id, 'rejected')}
                                disabled={updatingApplication === application.id}
                                size="sm"
                                variant="destructive"
                                className="bg-rose-600 hover:bg-rose-700 min-w-[100px]"
                              >
                                <X className="mr-2 h-4 w-4" />
                                {updatingApplication === application.id ? '更新中...' : '不承認'}
                              </Button>
                            </div>
                            <p className="text-xs text-center" style={{ color: 'var(--ink-muted-fallback)' }}>
                              応募を承認または不承認にしてください
                            </p>
                          </div>
                        )}
                        {application.status === 'accepted' && (
                          <Button
                            onClick={() => updateApplicationStatus(application.id, 'completed')}
                            disabled={updatingApplication === application.id}
                            size="sm"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {updatingApplication === application.id ? '更新中...' : '完了にする'}
                          </Button>
                        )}
                        {application.status === 'completed' && (
                          <Button
                            asChild
                            size="sm"
                            variant={application.has_rating ? "outline" : "default"}
                            className={application.has_rating 
                              ? "border-yellow-400/40 bg-yellow-500/10 text-yellow-100 hover:bg-yellow-500/20"
                              : "bg-yellow-600 hover:bg-yellow-700 text-white"
                            }
                          >
                            <Link href={`/ratings/${application.id}`}>
                              <Star className="mr-2 h-4 w-4" />
                              {application.has_rating ? '評価を編集' : '評価する'}
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
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

