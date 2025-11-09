'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  DollarSign,
  ExternalLink,
  Send,
  Sparkles,
} from 'lucide-react'

import SiteFooter from '@/components/site-footer'
import SiteHeader from '@/components/site-header'
import { OptimizedImage } from '@/components/optimized-image'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import {
  getOrganizationSession,
  getCompanySession,
  getStudentSession,
  getStoredUserType,
  hasSupabaseConfig,
  subscribeAuthChange,
  type AuthUserType,
  type OrganizationSession,
  type CompanySession,
  type StudentSession,
} from '@/lib/auth/session'

type Company = {
  id: string
  name: string
  logo_url: string | null
  description?: string | null
  website?: string | null
}

type Project = {
  id: string
  title: string
  budget: string | null
  deadline: string | null
  description: string
  created_at: string
  company?: Company | null
}

type MessageState =
  | { type: 'success'; text: string }
  | { type: 'error'; text: string }
  | null

const aiHint = `応募内容のヒント:
1. 団体のミッションと活動実績
2. 今回の案件に興味を持った理由
3. 協業で提供できる価値や体制
4. 希望するコミュニケーション方法`

export default function ProjectDetailPage() {
  const params = useParams()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<MessageState>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUsingMockData, setIsUsingMockData] = useState(!hasSupabaseConfig)
  const [formData, setFormData] = useState({
    organization_name: '',
    contact_info: '',
    appeal: '',
  })
  const [organizationSession, setOrganizationSession] = useState<OrganizationSession>(() =>
    getOrganizationSession(),
  )
  const [companySession, setCompanySession] = useState<CompanySession>(() => getCompanySession())
  const [studentSession, setStudentSession] = useState<StudentSession>(() => getStudentSession())
  const [userType, setUserType] = useState<AuthUserType>(() => getStoredUserType())

  useEffect(() => {
    fetchProject()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, userType, companySession.accessToken])

  const isFormValid = useMemo(
    () => Boolean(formData.appeal.trim() && formData.contact_info.trim()),
    [formData.appeal, formData.contact_info],
  )

  useEffect(() => {
    const unsubscribe = subscribeAuthChange(() => {
      setOrganizationSession(getOrganizationSession())
      setCompanySession(getCompanySession())
      setStudentSession(getStudentSession())
      setUserType(getStoredUserType())
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (isUsingMockData) return
    setFormData((prev) => {
      const updates: Partial<typeof prev> = {}

      // 学生団体の場合
      if (userType === 'organization' && organizationSession.profile?.name && !prev.organization_name) {
        updates.organization_name = organizationSession.profile.name ?? ''
      }

      // 学生個人の場合
      if (userType === 'student' && studentSession.profile?.name && !prev.organization_name) {
        updates.organization_name = studentSession.profile.name ?? ''
      }

      // 連絡先の設定
      if (userType === 'organization' && organizationSession.profile?.contact_email && !prev.contact_info) {
        updates.contact_info = organizationSession.profile.contact_email ?? ''
      }

      if (userType === 'student' && studentSession.profile?.contact_email && !prev.contact_info) {
        updates.contact_info = studentSession.profile.contact_email ?? ''
      }

      if (Object.keys(updates).length === 0) {
        return prev
      }

      return { ...prev, ...updates }
    })
  }, [
    userType,
    organizationSession.profile?.name,
    organizationSession.profile?.contact_email,
    studentSession.profile?.name,
    studentSession.profile?.contact_email,
    isUsingMockData,
  ])

  const isAuthorized =
    (userType === 'organization' &&
      Boolean(organizationSession.accessToken && organizationSession.profile?.id)) ||
    (userType === 'student' &&
      Boolean(studentSession.accessToken && studentSession.profile?.id))

  const fetchProject = async () => {
    setLoading(true)
    try {
      // 企業がログインしている場合は認証トークンをヘッダーに含める
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }
      
      // 最新のセッション情報を取得
      let currentCompanySession = getCompanySession()
      const currentUserType = getStoredUserType()
      
      // トークンをリフレッシュする（期限切れの場合）
      if (currentUserType === 'company' && currentCompanySession.refreshToken) {
        try {
          const supabase = createClient()
          const { data: sessionData, error: refreshError } = await supabase.auth.refreshSession({
            refresh_token: currentCompanySession.refreshToken,
          })
          
          if (!refreshError && sessionData?.session) {
            // セッションを更新
            const { persistCompanySession } = await import('@/lib/auth/session')
            persistCompanySession({
              accessToken: sessionData.session.access_token,
              refreshToken: sessionData.session.refresh_token,
              profile: currentCompanySession.profile,
            })
            
            // 更新されたセッションを取得
            currentCompanySession = getCompanySession()
            console.log('[Client] Token refreshed successfully')
          } else if (refreshError) {
            console.warn('[Client] Token refresh failed:', refreshError.message)
          }
        } catch (refreshErr) {
          console.warn('[Client] Token refresh error:', refreshErr)
        }
      }
      
      if (currentUserType === 'company' && currentCompanySession.accessToken) {
        headers['Authorization'] = `Bearer ${currentCompanySession.accessToken}`
        console.log('[Client] Sending auth token for company:', currentCompanySession.profile?.id)
      } else {
        console.log('[Client] No auth token - userType:', currentUserType, 'hasToken:', !!currentCompanySession.accessToken)
      }

      const response = await fetch(`/api/projects/${params.id}`, {
        headers,
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('[Client] Fetch error:', response.status, errorData)
        throw new Error(errorData.error || 'Failed to fetch project')
      }
      
      const data = await response.json()
      setProject(data)
    } catch (error) {
      console.error('Error fetching project:', error)
      setIsUsingMockData(true)
      setProject(null)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      if (!isUsingMockData) {
        const hasOrgAuth =
          userType === 'organization' &&
          organizationSession.accessToken &&
          organizationSession.profile?.id
        const hasStudentAuth =
          userType === 'student' && studentSession.accessToken && studentSession.profile?.id

        if (!hasOrgAuth && !hasStudentAuth) {
          throw new Error('学生団体または学生個人アカウントでログインしてください。')
        }
      }

      const accessToken =
        userType === 'organization'
          ? organizationSession.accessToken
          : userType === 'student'
            ? studentSession.accessToken
            : null

      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({
          project_id: params.id,
          ...formData,
        }),
      })

      if (!response.ok) {
        const json = await response.json().catch(() => ({}))
        throw new Error(json?.error || '応募に失敗しました')
      }

      setFormData({ appeal: '', organization_name: '', contact_info: '' })
      setMessage({ type: 'success', text: '応募を送信しました。企業からの連絡をお待ちください。' })
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error?.message || '応募に失敗しました。もう一度お試しください。',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <PageShell>
        <div className="py-32 text-center">
          <div className="mx-auto h-16 w-16 animate-pulse rounded-3xl border border-indigo-400/40 bg-indigo-500/15" />
          <p className="mt-6 text-sm" style={{ color: 'var(--ink-muted-fallback)' }}>案件情報を読み込んでいます…</p>
        </div>
      </PageShell>
    )
  }

  if (!project) {
    return (
      <PageShell>
        <Card className="glass-panel border-0 rounded-um-lg text-center">
          <CardContent className="space-y-6 py-16">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-rose-400/40 bg-rose-500/15 text-rose-100">
              <Building2 className="h-7 w-7" />
            </div>
            <div className="space-y-3">
              <h2 className="text-2xl font-semibold text-white">案件が見つかりません</h2>
              <p className="text-sm" style={{ color: 'var(--ink-muted-fallback)' }}>
                指定された案件は存在しないか、まだ公開されていません。
              </p>
            </div>
            <Button asChild className="union-gradient union-glow h-11 px-6 text-sm font-semibold">
              <Link href="/projects">案件一覧に戻る</Link>
            </Button>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  return (
    <PageShell>
      <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--ink-muted-fallback)' }}>
        <ArrowLeft className="h-4 w-4" />
        <Link href="/projects" className="transition hover:text-white">
          案件一覧に戻る
        </Link>
      </div>

      {project.company && (
        <section className="mt-8">
          <Card className="glass-panel border-0 rounded-um-lg">
            <CardContent className="flex flex-col gap-6 py-6 sm:flex-row sm:items-center">
              <CompanyBadge company={project.company} />
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/companies/${project.company.id}`}
                    className="text-lg font-semibold text-white transition hover:text-indigo-200"
                  >
                    {project.company.name}
                  </Link>
                  {project.company.website && (
                    <a
                      href={project.company.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-xs transition hover:text-white"
                      style={{ color: 'var(--ink-muted-fallback)' }}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      公式サイト
                    </a>
                  )}
                </div>
                {project.company.description && (
                  <p className="text-sm leading-relaxed line-clamp-2" style={{ color: 'var(--ink-muted-fallback)' }}>
                    {project.company.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="glass-panel border-0 rounded-um-lg">
          <CardHeader className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Badge className="border-emerald-400/40 bg-emerald-400/15 text-emerald-100">募集中</Badge>
              <p className="text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>
                公開日: {new Date(project.created_at).toLocaleDateString('ja-JP')}
              </p>
            </div>
            <div className="space-y-4">
              <CardTitle className="text-3xl font-semibold text-white">{project.title}</CardTitle>
              <p className="text-sm" style={{ color: 'var(--ink-muted-fallback)' }}>
                UNION 運営の審査を通過した案件です。募集背景や期待する成果を確認のうえ、ご応募ください。
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              {project.budget && (
                <InfoPill icon={<DollarSign className="h-4 w-4 text-indigo-200" />} label={project.budget} />
              )}
              {project.deadline && (
                <InfoPill
                  icon={<Calendar className="h-4 w-4 text-amber-200" />}
                  label={`締切 ${new Date(project.deadline).toLocaleDateString('ja-JP')}`}
                />
              )}
            </div>
          </CardHeader>
          <CardContent>
            <article className="prose prose-invert prose-headings:text-white prose-p:text-white prose-strong:text-white max-w-none" style={{ '--tw-prose-body': 'var(--ink-muted-fallback)' } as React.CSSProperties}>
              <ReactMarkdown>{project.description}</ReactMarkdown>
            </article>
          </CardContent>
        </Card>

        <aside className="space-y-6">
          <Card className="glass-panel border-0 rounded-um-lg sticky top-28">
            <CardHeader>
              <CardTitle className="text-2xl text-white">応募フォーム</CardTitle>
              <CardDescription style={{ color: 'var(--ink-muted-fallback)' }}>
                興味をお持ちいただけた場合は、以下のフォームから応募内容を送信してください。
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isUsingMockData && !isAuthorized && (
                <Alert className="mb-6 border-yellow-400/40 bg-yellow-500/10 text-yellow-100">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <AlertDescription className="flex-1 whitespace-normal break-words text-left">
                      応募するには学生団体または学生個人アカウントでログインしてください。ログイン後にフォームが有効になります。
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {!isUsingMockData &&
                isAuthorized &&
                organizationSession.profile?.name && (
                <Alert className="mb-6 border-emerald-400/40 bg-emerald-500/10 text-emerald-100">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <AlertDescription className="flex-1 text-left">
                      {organizationSession.profile.name} として応募します。
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              {message && (
                <Alert
                  className={`mb-6 ${
                    message.type === 'success'
                      ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                      : 'border-rose-400/40 bg-rose-500/10 text-rose-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {message.type === 'success' ? (
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    )}
                    <AlertDescription className="flex-1 text-left">{message.text}</AlertDescription>
                  </div>
                </Alert>
              )}

              {isUsingMockData && (
                <Alert className="mb-6 border-yellow-400/30 bg-yellow-500/10 text-yellow-100">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                    <AlertDescription className="flex-1 text-left">
                      Supabase が未設定のためデモ表示になっています。応募内容は送信されません。
                    </AlertDescription>
                  </div>
                </Alert>
              )}

              <form className="space-y-6" onSubmit={handleSubmit}>
                <Field label="団体名" name="organization_name">
                  <Input
                    id="organization_name"
                    name="organization_name"
                    value={formData.organization_name}
                    onChange={handleChange}
                    placeholder="例）UNION 学生団体"
                    className="h-11 rounded-um-md border-white/10 bg-white/5 text-white focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-400/30"
                    style={{ 
                      '--tw-placeholder-opacity': '0.5',
                    } as React.CSSProperties}
                    disabled={!isAuthorized && !isUsingMockData}
                  />
                </Field>

                <Field label="連絡先（メールアドレスなど）" required name="contact_info">
                  <Input
                    id="contact_info"
                    name="contact_info"
                    value={formData.contact_info}
                    onChange={handleChange}
                    placeholder="example@organization.com"
                    className="h-11 rounded-um-md border-white/10 bg-white/5 text-white focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-400/30"
                    style={{ 
                      '--tw-placeholder-opacity': '0.5',
                    } as React.CSSProperties}
                    required
                    disabled={!isAuthorized && !isUsingMockData}
                  />
                </Field>

                <Field label="応募理由・団体の強み" required name="appeal">
                  <Textarea
                    id="appeal"
                    name="appeal"
                    value={formData.appeal}
                    onChange={handleChange}
                    placeholder={aiHint}
                    rows={6}
                    className="rounded-um-md border-white/10 bg-white/5 text-white focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-400/30"
                    style={{ 
                      '--tw-placeholder-opacity': '0.5',
                    } as React.CSSProperties}
                    required
                    disabled={!isAuthorized && !isUsingMockData}
                  />
                </Field>

                <Button
                  type="submit"
                  disabled={!isFormValid || isSubmitting || (!isUsingMockData && !isAuthorized)}
                  className="union-gradient union-glow h-11 w-full text-sm font-semibold disabled:opacity-60"
                >
                  {isSubmitting ? '送信中…' : '応募内容を送信する'}
                  {!isSubmitting && <Send className="ml-2 h-4 w-4" />}
                </Button>

                <p className="text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>
                  送信内容は直接企業担当者に届きます。返信には数日かかる場合があります。
                </p>
              </form>
            </CardContent>
          </Card>
        </aside>
      </section>
    </PageShell>
  )
}

function PageShell({ children }: { children: React.ReactNode }) {
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
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
            <Sparkles className="h-4 w-4" />
            Project Detail
          </div>
          <p className="mt-4 text-sm" style={{ color: 'var(--ink-muted-fallback)' }}>
            募集内容を確認し、学生個人・学生団体の強みと興味を丁寧に届けましょう。
          </p>
        </div>
        <div className="mt-10 space-y-8">{children}</div>
      </main>
      <SiteFooter />
    </div>
  )
}

function CompanyBadge({ company }: { company: Company }) {
  return (
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 rounded-2xl border border-white/10 bg-white/5 p-2">
        {company.logo_url ? (
          <OptimizedImage
            src={company.logo_url}
            alt={`${company.name} ロゴ`}
            width={56}
            height={56}
            className="h-full w-full rounded-xl object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center rounded-xl bg-white/5" style={{ color: 'var(--ink-muted-fallback)' }}>
            <Building2 className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--ink-muted-fallback)' }}>企業</span>
        <span className="text-lg font-semibold text-white">{company.name}</span>
      </div>
    </div>
  )
}

function InfoPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/10">
        {icon}
      </span>
      <span>{label}</span>
    </div>
  )
}

function Field({
  label,
  children,
  required,
  name,
}: {
  label: string
  children: ReactNode
  required?: boolean
  name: string
}) {
  return (
    <div className="space-y-2">
      <Label
        htmlFor={name}
        className="text-xs font-semibold uppercase tracking-[0.18em]"
        style={{ color: 'var(--ink-muted-fallback)' }}
      >
        {label}
        {required && <span className="ml-1 text-rose-300">*</span>}
      </Label>
      {children}
    </div>
  )
}
