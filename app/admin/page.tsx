'use client'

import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import type { Session, SupabaseClient } from '@supabase/supabase-js'
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle,
  Download,
  Loader2,
  LogIn,
  LogOut,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import SiteFooter from '@/components/site-footer'
import SiteHeader from '@/components/site-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type ProjectStatus = 'review' | 'public' | 'rejected' | 'closed' | (string & {})

type Project = {
  id: string
  title: string
  budget: string | null
  deadline: string | null
  description: string
  contact_info: string
  status: ProjectStatus
  created_at: string
}

type Application = {
  id: string
  project_id: string
  appeal: string
  organization_name: string | null
  contact_info: string
  created_at: string
  project: {
    title: string
  }
}

type DiagnosticsResponse = {
  ok: boolean
  supabaseUrlRawPreview: string
  derivedOrigin: string | null
  flags: {
    hasValue: boolean
    hasRestPath: boolean
    hasAnyPath: boolean
  }
  advice: string[]
}

type MessageState =
  | { type: 'success'; text: string }
  | { type: 'error'; text: string }
  | null

type AuthState = 'loading' | 'signedOut' | 'unauthorized' | 'authorized' | 'setupRequired'

const hasSupabaseConfig =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

function setSessionFlagCookie(enabled: boolean) {
  if (typeof document === 'undefined') return
  // Lightweight signal for middleware so it can gate /admin requests before hydration.
  const base = 'um-admin-session'
  if (enabled) {
    document.cookie = `${base}=1; Path=/; SameSite=Lax`
  } else {
    document.cookie = `${base}=; Path=/; Max-Age=0; SameSite=Lax`
  }
}

const STATUS_MESSAGES: Record<'review' | 'public' | 'rejected' | 'closed', string> = {
  review: '案件を審査ステータスに戻しました',
  public: '案件を承認しました',
  rejected: '案件を否認しました',
  closed: '案件の公開を終了しました',
}

function getStatusMessage(status: ProjectStatus) {
  return STATUS_MESSAGES[status as keyof typeof STATUS_MESSAGES] ?? 'ステータスを更新しました'
}

function userHasAdminRole(user: Session['user'] | null | undefined): boolean {
  if (!user) return false
  const rolesMeta = user.app_metadata?.roles
  const roles = Array.isArray(rolesMeta)
    ? rolesMeta
    : typeof rolesMeta === 'string'
      ? [rolesMeta]
      : []

  if (roles.includes('admin')) return true
  if (user.app_metadata?.role === 'admin') return true

  const adminFlag = user.app_metadata?.is_admin ?? user.user_metadata?.is_admin ?? user.user_metadata?.admin
  if (adminFlag === true || adminFlag === 'true') return true

  return false
}

export default function AdminPage() {
  const supabase = useMemo(() => {
    if (!hasSupabaseConfig) return null
    // Create a client only when Supabase env vars are present to avoid runtime crashes.
    return createClient()
  }, [])

  const [session, setSession] = useState<Session | null>(null)
  const [authState, setAuthState] = useState<AuthState>(hasSupabaseConfig ? 'loading' : 'setupRequired')
  const [projects, setProjects] = useState<Project[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [message, setMessage] = useState<MessageState>(null)
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null)
  const [diagnosticsLoading, setDiagnosticsLoading] = useState(false)

  const accessToken = session?.access_token ?? null

  useEffect(() => {
    // Keep the cookie mirror aligned with the current authorization status.
    if (authState === 'authorized') {
      setSessionFlagCookie(true)
    } else if (authState !== 'loading') {
      setSessionFlagCookie(false)
    }
  }, [authState])

  const handleAuthError = useCallback(
    async (notice?: string) => {
      if (!supabase) return
      await supabase.auth.signOut().catch(() => {})
      setSessionFlagCookie(false) // Ensure middleware stops treating the user as signed in.
      setSession(null)
      setAuthState('signedOut')
      if (notice) {
        setMessage({ type: 'error', text: notice })
      }
    },
    [supabase],
  )

  const updateAuthFromSession = useCallback((nextSession: Session | null) => {
    setSession(nextSession)
    if (!nextSession) {
      setAuthState('signedOut')
      return
    }
    setAuthState(userHasAdminRole(nextSession.user) ? 'authorized' : 'unauthorized')
  }, [])

  useEffect(() => {
    if (!supabase) return

    let isMounted = true

    const bootstrap = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (!isMounted) return
        updateAuthFromSession(data.session ?? null)
      } catch (error) {
        console.error('Failed to retrieve Supabase session:', error)
        if (isMounted) {
          setAuthState('signedOut')
        }
      }
    }

    bootstrap()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) return
      updateAuthFromSession(nextSession)
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, updateAuthFromSession])

  const fetchData = useCallback(async () => {
    if (!accessToken) return

    setLoadingData(true)
    try {
      const headers: HeadersInit = { Authorization: `Bearer ${accessToken}` }
      const [projectsRes, applicationsRes] = await Promise.all([
        fetch('/api/admin/projects', { headers }),
        fetch('/api/admin/applications', { headers }),
      ])

      const unauthorized = [projectsRes.status, applicationsRes.status].some(
        (status) => status === 401 || status === 403,
      )

      if (unauthorized) {
        await handleAuthError('認証情報の有効期限が切れました。再度サインインしてください。')
        return
      }

      const projectsData = projectsRes.ok ? await projectsRes.json() : []
      const applicationsData = applicationsRes.ok ? await applicationsRes.json() : []

      setProjects(Array.isArray(projectsData) ? projectsData : [])
      setApplications(Array.isArray(applicationsData) ? applicationsData : [])
    } catch (error) {
      console.error('Error fetching admin data:', error)
      setMessage({ type: 'error', text: 'データの取得に失敗しました' })
    } finally {
      setLoadingData(false)
    }
  }, [accessToken, handleAuthError])

  useEffect(() => {
    if (authState === 'authorized') {
      fetchData()
    } else if (authState !== 'loading') {
      setLoadingData(false)
    }
  }, [authState, fetchData])

  const updateProjectStatus = useCallback(
    async (projectId: string, status: ProjectStatus) => {
      if (!accessToken) {
        setMessage({ type: 'error', text: '認証が必要です' })
        return
      }

      try {
        const response = await fetch(`/api/admin/projects/${projectId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ status }),
        })

        if (response.status === 401 || response.status === 403) {
          await handleAuthError('認証情報の有効期限が切れました。再度サインインしてください。')
          return
        }

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          throw new Error(data?.error || '更新に失敗しました')
        }

        setMessage({ type: 'success', text: getStatusMessage(status) })
        fetchData()
      } catch (error) {
        console.error('Error updating project status:', error)
        setMessage({ type: 'error', text: 'ステータス更新に失敗しました' })
      }
    },
    [accessToken, fetchData, handleAuthError],
  )

  const runDiagnostics = useCallback(async () => {
    if (!accessToken) {
      setMessage({ type: 'error', text: '診断には認証が必要です' })
      return
    }

    setDiagnosticsLoading(true)
    try {
      const response = await fetch('/api/admin/diag', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const data: DiagnosticsResponse | { error?: string } = await response.json().catch(() => ({}))

      if (response.status === 401 || response.status === 403) {
        await handleAuthError('認証情報の有効期限が切れました。再度サインインしてください。')
        return
      }

      if (!response.ok) {
        throw new Error((data as { error?: string })?.error || '診断に失敗しました')
      }

      setDiagnostics(data as DiagnosticsResponse)
    } catch (error) {
      console.error('Error running diagnostics:', error)
      setMessage({ type: 'error', text: '診断に失敗しました' })
      setDiagnostics(null)
    } finally {
      setDiagnosticsLoading(false)
    }
  }, [accessToken, handleAuthError])

  const downloadCSV = useCallback(() => {
    const csvContent = [
      ['応募ID', '案件名', '団体名', '連絡先', '応募理由', '応募日時'],
      ...applications.map((app) => [
        app.id,
        app.project.title,
        app.organization_name || '',
        app.contact_info,
        app.appeal.replace(/\n/g, ' '),
        new Date(app.created_at).toLocaleString('ja-JP'),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `applications_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [applications])

  const handleSignOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut().catch(() => {})
    setSessionFlagCookie(false) // Drop middleware flag immediately on manual sign-out.
    setSession(null)
    setAuthState('signedOut')
  }, [supabase])

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'review':
        return <Badge className="border-amber-400/40 bg-amber-500/15 text-amber-100">審査中</Badge>
      case 'public':
        return <Badge className="border-emerald-400/40 bg-emerald-400/15 text-emerald-100">公開中</Badge>
      case 'rejected':
        return <Badge className="border-rose-400/40 bg-rose-500/15 text-rose-100">否認</Badge>
      case 'closed':
        return <Badge className="border-slate-400/40 bg-slate-500/15 text-slate-100">掲載終了</Badge>
      default:
        return <Badge className="border-slate-400/40 bg-slate-500/15 text-slate-100">{status}</Badge>
    }
  }

  if (authState === 'loading') {
    return (
      <PageShell>
        <LoadingPlaceholder />
      </PageShell>
    )
  }

  if (authState === 'setupRequired') {
    return (
      <PageShell>
        <SetupRequiredMessage />
      </PageShell>
    )
  }

  if (!supabase) {
    return (
      <PageShell>
        <Card className="glass-outline border-yellow-500/40 bg-yellow-500/10">
          <CardHeader>
            <CardTitle className="text-2xl text-white">Supabase の設定が必要です</CardTitle>
            <CardDescription className="text-slate-200">
              管理画面を利用するには `.env.local` に Supabase の URL と鍵を設定してください。
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-yellow-200">
            <p>
              詳細は <a href="/setup" className="underline">セットアップガイド</a> を参照してください。
            </p>
          </CardContent>
        </Card>
      </PageShell>
    )
  }

  if (authState === 'signedOut') {
    return (
      <PageShell>
        <AuthIntro />
        <AdminLoginCard supabase={supabase} />
      </PageShell>
    )
  }

  if (authState === 'unauthorized') {
    return (
      <PageShell onSignOut={handleSignOut} userEmail={session?.user?.email ?? null}>
        <UnauthorizedNotice />
      </PageShell>
    )
  }

  return (
    <PageShell onSignOut={handleSignOut} userEmail={session?.user?.email ?? null}>
      {message && (
        <Alert
          className={`glass-outline ${
            message.type === 'success'
              ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
              : 'border-rose-400/40 bg-rose-500/10 text-rose-100'
          }`}
        >
          <div className="flex items-start gap-3">
            {message.type === 'success' ? (
              <CheckCircle className="mt-0.5 h-4 w-4" />
            ) : (
              <AlertCircle className="mt-0.5 h-4 w-4" />
            )}
            <AlertDescription>{message.text}</AlertDescription>
          </div>
        </Alert>
      )}

      <section className="mt-10 grid gap-10">
        <Card className="glass-outline border-white/10 bg-black/30">
          <CardHeader className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl text-white">案件管理</CardTitle>
              <CardDescription className="text-slate-300">
                審査中の案件を承認・否認、掲載終了までワンクリックで操作できます。
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <ShieldCheck className="h-4 w-4" />
              UNION 運営のみアクセス可能な専用ページです。
            </div>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <LoadingPlaceholder />
            ) : projects.length === 0 ? (
              <EmptyPlaceholder text="審査対象の案件がありません" />
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow className="border-white/5">
                      <TableHead className="text-slate-300">案件名</TableHead>
                      <TableHead className="text-slate-300">予算</TableHead>
                      <TableHead className="text-slate-300">締切</TableHead>
                      <TableHead className="text-slate-300">ステータス</TableHead>
                      <TableHead className="text-slate-300">投稿日</TableHead>
                      <TableHead className="text-slate-300">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {projects.map((project) => (
                      <TableRow key={project.id} className="border-white/5">
                        <TableCell className="max-w-xs truncate font-medium text-white">
                          {project.title}
                        </TableCell>
                        <TableCell className="text-slate-300">{project.budget || '-'}</TableCell>
                        <TableCell className="text-slate-300">
                          {project.deadline ? new Date(project.deadline).toLocaleDateString('ja-JP') : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(project.status)}</TableCell>
                        <TableCell className="text-slate-300">
                          {new Date(project.created_at).toLocaleDateString('ja-JP')}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap items-center gap-2">
                            {project.status !== 'public' && (
                              <Button
                                size="sm"
                                onClick={() => updateProjectStatus(project.id, 'public')}
                                className="h-8 rounded-lg border-emerald-400/40 bg-emerald-500/20 px-3 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/30"
                              >
                                <Check className="mr-1 h-3.5 w-3.5" />
                                承認
                              </Button>
                            )}
                            {project.status !== 'rejected' && (
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => updateProjectStatus(project.id, 'rejected')}
                                className="h-8 rounded-lg border-rose-400/40 bg-rose-500/20 px-3 text-xs font-semibold text-rose-100 transition hover:bg-rose-500/30"
                              >
                                <X className="mr-1 h-3.5 w-3.5" />
                                否認
                              </Button>
                            )}
                            {project.status === 'public' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateProjectStatus(project.id, 'closed')}
                                className="h-8 rounded-lg border-slate-400/40 bg-slate-500/20 px-3 text-xs font-semibold text-slate-200 transition hover:bg-slate-500/30"
                              >
                                掲載終了
                              </Button>
                            )}
                            {project.status !== 'review' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateProjectStatus(project.id, 'review')}
                                className="h-8 rounded-lg px-3 text-xs font-semibold text-slate-200 hover:text-white"
                              >
                                審査へ戻す
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-outline border-white/10 bg-black/30">
          <CardHeader className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl text-white">応募管理</CardTitle>
              <CardDescription className="text-slate-300">
                学生団体からの応募内容を一覧し、CSV でダウンロードできます。
              </CardDescription>
            </div>
            <Button
              onClick={downloadCSV}
              disabled={applications.length === 0}
              className="union-gradient union-glow h-10 rounded-xl px-5 text-sm font-semibold disabled:opacity-60"
            >
              <Download className="mr-2 h-4 w-4" />
              CSV出力
            </Button>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <LoadingPlaceholder />
            ) : applications.length === 0 ? (
              <EmptyPlaceholder text="応募データがまだありません" />
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[720px]">
                  <TableHeader>
                    <TableRow className="border-white/5">
                      <TableHead className="text-slate-300">案件名</TableHead>
                      <TableHead className="text-slate-300">団体名</TableHead>
                      <TableHead className="text-slate-300">連絡先</TableHead>
                      <TableHead className="text-slate-300">応募理由</TableHead>
                      <TableHead className="text-slate-300">応募日</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {applications.map((application) => (
                      <TableRow key={application.id} className="border-white/5">
                        <TableCell className="max-w-xs truncate font-medium text-white">
                          {application.project.title}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {application.organization_name || '-'}
                        </TableCell>
                        <TableCell className="text-slate-300">{application.contact_info}</TableCell>
                        <TableCell className="max-w-xs truncate text-slate-300">
                          {application.appeal}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {new Date(application.created_at).toLocaleDateString('ja-JP')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-outline border-white/10 bg-black/30">
          <CardHeader className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-3xl text-white">接続診断</CardTitle>
              <CardDescription className="text-slate-300">
                Supabase 連携の環境変数設定を確認し、よくある誤設定を検出します。
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={runDiagnostics}
              disabled={diagnosticsLoading}
              className="border-white/20 text-white hover:bg-white/10"
            >
              {diagnosticsLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  診断中…
                </>
              ) : (
                '診断を実行'
              )}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-slate-200">
            {diagnostics ? (
              <>
                <div className="space-y-1">
                  <p className="text-slate-300">
                    URL プレビュー:{' '}
                    <span className="font-mono text-xs text-slate-200">
                      {diagnostics.supabaseUrlRawPreview || '(未設定)'}
                    </span>
                  </p>
                  {diagnostics.derivedOrigin && (
                    <p className="text-slate-300">
                      検出された Origin:{' '}
                      <span className="font-mono text-xs text-slate-200">
                        {diagnostics.derivedOrigin}
                      </span>
                    </p>
                  )}
                </div>
                {diagnostics.advice && diagnostics.advice.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-slate-300">推奨アクション</p>
                    <ul className="list-disc space-y-1 pl-5 text-slate-200">
                      {diagnostics.advice.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="flex items-center gap-2 text-emerald-200">
                    <CheckCircle className="h-4 w-4" />
                    環境設定に問題は見つかりませんでした。
                  </p>
                )}
              </>
            ) : (
              <p className="text-slate-400">診断結果はここに表示されます。</p>
            )}
          </CardContent>
        </Card>
      </section>
    </PageShell>
  )
}

function AuthIntro() {
  return (
    <Card className="glass-outline border-white/10 bg-black/25">
      <CardHeader className="space-y-4">
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
          <Sparkles className="h-4 w-4" />
          管理者ログイン
        </div>
        <CardTitle className="text-3xl text-white">UNION 運営用ダッシュボード</CardTitle>
        <CardDescription className="text-slate-300">
          Supabase Auth でサインインすると、案件の審査や応募状況の確認、CSV エクスポートなどの機能が利用できます。
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

function AdminLoginCard({ supabase }: { supabase: SupabaseClient }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        throw new Error(signInError.message || 'サインインに失敗しました')
      }
    } catch (err: any) {
      setError(err?.message || 'サインインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="glass-outline border-white/10 bg-black/30">
      <CardHeader>
        <CardTitle className="text-2xl text-white">管理者としてサインイン</CardTitle>
        <CardDescription className="text-slate-300">
          Supabase Auth で作成した管理者アカウントのメールアドレスとパスワードを入力してください。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="admin-email">メールアドレス</Label>
            <Input
              id="admin-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-400/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">パスワード</Label>
            <Input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-400/30"
            />
          </div>
          {error && <p className="text-sm text-rose-300">{error}</p>}
          <Button
            type="submit"
            className="w-full union-gradient union-glow h-11 text-sm font-semibold"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                サインイン中…
              </>
            ) : (
              <>
                <LogIn className="mr-2 h-4 w-4" />
                サインイン
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function UnauthorizedNotice() {
  return (
    <Card className="glass-outline border-rose-500/40 bg-rose-500/10 text-rose-100">
      <CardHeader>
        <div className="flex items-center gap-2 text-sm uppercase tracking-[0.18em]">
          <AlertTriangle className="h-4 w-4" />
          Access Restricted
        </div>
        <CardTitle className="text-2xl text-white">権限がありません</CardTitle>
        <CardDescription className="text-rose-100/80">
          このアカウントには管理者ロールが付与されていません。管理者にロールの追加を依頼してください。
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

function SetupRequiredMessage() {
  return (
    <Card className="glass-outline border-yellow-500/40 bg-yellow-500/10">
      <CardHeader>
        <CardTitle className="text-2xl text-white">Supabase 設定が見つかりません</CardTitle>
        <CardDescription className="text-yellow-200">
          環境変数
          <code className="mx-1 rounded bg-black/40 px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_URL</code>
          と
          <code className="mx-1 rounded bg-black/40 px-1 py-0.5 text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
          を設定し、アプリを再起動してください。
        </CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-yellow-200">
        <p>
          詳細は <a href="/setup" className="underline">セットアップガイド</a> を参照のうえ、Supabase プロジェクトの準備と SQL
          スクリプトの実行を行ってください。
        </p>
      </CardContent>
    </Card>
  )
}

function LoadingPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-slate-300">
      <div className="h-12 w-12 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-200" />
      <p className="text-sm">データを読み込んでいます…</p>
    </div>
  )
}

function EmptyPlaceholder({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 py-16 text-center">
      <Sparkles className="mx-auto h-6 w-6 text-indigo-200" />
      <p className="mt-4 text-sm text-slate-300">{text}</p>
    </div>
  )
}

function PageShell({
  children,
  onSignOut,
  userEmail,
}: {
  children: ReactNode
  onSignOut?: () => void
  userEmail?: string | null
}) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#030712] via-[#050c1f] to-[#000308] text-slate-100">
      <BackgroundAura />
      <SiteHeader />
      <main className="relative z-10 mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
            <Sparkles className="h-4 w-4" />
            Admin Console
          </div>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            運営ダッシュボード
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-slate-300">
            投稿案件の審査や応募状況をここで一元管理できます。ステータス更新は即時反映され、学生団体への案内も自動化されます。
          </p>
          {(onSignOut || userEmail) && (
            <div className="mt-6 flex flex-col items-center justify-center gap-3 text-sm text-slate-300 sm:flex-row sm:justify-end">
              {userEmail && <span className="text-xs text-slate-400">サインイン中: {userEmail}</span>}
              {onSignOut && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSignOut}
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  サインアウト
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="mt-12 space-y-8">{children}</div>
      </main>
      <SiteFooter />
    </div>
  )
}

function BackgroundAura() {
  return (
    <>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_60%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-[35%] h-[420px] bg-[radial-gradient(circle_at_center,_rgba(236,147,255,0.14),_transparent_65%)] blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 bottom-[-25%] h-[480px] bg-[radial-gradient(circle_at_bottom,_rgba(45,212,191,0.12),_transparent_70%)] blur-3xl" />
    </>
  )
}
