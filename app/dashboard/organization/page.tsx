'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Eye,
  Send,
  Star,
  Edit,
  ExternalLink,
  Save,
  Globe,
  Mail,
  Phone,
  Upload,
  X,
  Loader2,
  Copy,
  Building2,
  Calendar,
  DollarSign,
  Link as LinkIcon,
  MessageSquare,
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
  getOrganizationSession,
  getStoredUserType,
  hasSupabaseConfig,
  subscribeAuthChange,
  type AuthUserType,
  type OrganizationSession,
} from '@/lib/auth/session'

type Application = {
  id: string
  project_id: string
  project_title: string
  project_description?: string | null
  project_budget?: string | null
  project_deadline?: string | null
  appeal: string
  created_at: string
  accepted_at?: string | null
  status?: string
  has_rating?: boolean // 評価済みかどうか
  project_contact_info?: string | null // 企業の連絡先情報
  company_name?: string | null // 企業名
  company_id?: string | null // 企業ID
}

type OrganizationInfo = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  website: string | null
  contact_email: string | null
  contact_phone: string | null
}

export default function OrganizationDashboardPage() {
  const router = useRouter()
  const supabase = useMemo(() => {
    try {
      return createClient()
    } catch {
      return null
    }
  }, [])
  const [organizationSession, setOrganizationSession] = useState<OrganizationSession>(() =>
    getOrganizationSession(),
  )
  const [userType, setUserType] = useState<AuthUserType>(() => getStoredUserType())
  const [applications, setApplications] = useState<Application[]>([])
  const [recommendedProjects, setRecommendedProjects] = useState<any[]>([])
  const [organizationInfo, setOrganizationInfo] = useState<OrganizationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingRecommendations, setLoadingRecommendations] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditingOrganization, setIsEditingOrganization] = useState(false)
  const [editingOrganization, setEditingOrganization] = useState<Partial<OrganizationInfo>>({})
  const [savingOrganization, setSavingOrganization] = useState(false)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const isUsingMockData = useMemo(() => !hasSupabaseConfig, [])
  const isAuthorized = useMemo(() => 
    userType === 'organization' && Boolean(organizationSession.accessToken && organizationSession.profile?.id),
    [userType, organizationSession.accessToken, organizationSession.profile?.id]
  )

  // フィルタリングされた応募リスト（パフォーマンス最適化）
  const acceptedApplications = useMemo(() => 
    applications.filter((app) => app.status === 'accepted'),
    [applications]
  )
  const pendingApplications = useMemo(() => 
    applications.filter((app) => app.status !== 'accepted' && app.status !== 'completed'),
    [applications]
  )

  useEffect(() => {
    const unsubscribe = subscribeAuthChange(() => {
      setOrganizationSession(getOrganizationSession())
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
      if (!supabase || !organizationSession.profile?.id) return

      try {
        // 学生団体情報を取得
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('id, name, description, logo_url, website, contact_email, contact_phone')
          .eq('id', organizationSession.profile.id)
          .single()

        if (orgError) throw orgError
        if (orgData) {
          setOrganizationInfo(orgData)
        }

        // 応募情報を取得
        const { data, error: fetchError } = await supabase
          .from('applications')
          .select(
            'id, project_id, appeal, created_at, accepted_at, status, projects(id, title, description, budget, deadline, contact_info, company_id, companies(id, name))',
          )
          .eq('organization_id', organizationSession.profile.id)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError

        // 各応募に対して評価済みかどうか、企業名を取得
        const applicationsWithRatings = await Promise.all(
          (data || []).map(async (app: any) => {
            let hasRating = false
            if (organizationSession.profile?.id) {
              const { data: ratingData } = await supabase
                .from('ratings')
                .select('id')
                .eq('application_id', app.id)
                .eq('rater_type', 'organization')
                .eq('rater_id', organizationSession.profile.id)
                .single()
              
              hasRating = !!ratingData
            }

            const project = app.projects && !Array.isArray(app.projects) ? app.projects : null
            const company = project?.companies && !Array.isArray(project.companies) ? project.companies : null
            
            return {
              id: app.id,
              project_id: app.project_id,
              project_title: project?.title || '不明な案件',
              project_description: project?.description || null,
              project_budget: project?.budget || null,
              project_deadline: project?.deadline || null,
              appeal: app.appeal,
              created_at: app.created_at,
              accepted_at: app.accepted_at,
              status: app.status || 'pending',
              has_rating: hasRating,
              project_contact_info: project?.contact_info || null,
              company_name: company?.name || null,
              company_id: project?.company_id || null,
            }
          })
        )

        setApplications(applicationsWithRatings)
      } catch (err: any) {
        console.error('Failed to fetch data:', err)
        setError('データの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [isAuthorized, isUsingMockData, supabase, organizationSession.profile?.id])

  // レコメンド案件の取得
  useEffect(() => {
    if (!isAuthorized || isUsingMockData) return

    const fetchRecommendations = async () => {
      if (!organizationSession.accessToken) return

      setLoadingRecommendations(true)
      try {
        const response = await fetch('/api/recommendations?target_type=organization&limit=5', {
          headers: {
            Authorization: `Bearer ${organizationSession.accessToken}`,
          },
        })

        if (response.ok) {
          const { data } = await response.json()
          setRecommendedProjects(data || [])
        }
      } catch (err) {
        console.error('Failed to fetch recommendations:', err)
      } finally {
        setLoadingRecommendations(false)
      }
    }

    fetchRecommendations()
  }, [isAuthorized, isUsingMockData, organizationSession.accessToken])

  const getStatusBadge = (status: string | null | undefined): { label: string; color: string; bg: string; border: string } => {
    const normalizedStatus = status || 'pending'
    switch (normalizedStatus) {
      case 'accepted':
        return { label: '承認済み', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-400/40' }
      case 'rejected':
        return { label: '不承認', color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-400/40' }
      case 'completed':
        return { label: '完了', color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-400/40' }
      default:
        return { label: '審査中', color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-400/40' }
    }
  }

  // 未認証の場合はリダイレクト
  useEffect(() => {
    if (!loading && !isAuthorized && !isUsingMockData) {
      router.push('/login/organization?redirect=/dashboard/organization')
    }
  }, [loading, isAuthorized, isUsingMockData, router])

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
              <div className="w-16 h-16 union-gradient rounded-2xl flex items-center justify-center">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white">
                  学生団体<span className="union-text-gradient">ダッシュボード</span>
                </h1>
                <p className="text-lg mt-2" style={{ color: 'var(--ink-muted-fallback)' }}>
                  {organizationSession.profile?.name || '学生団体アカウント'}としてログイン中
                </p>
              </div>
            </div>
            <Button
              asChild
              className="union-gradient union-glow h-11 px-6 text-sm font-semibold"
            >
              <Link href="/projects">
                <ArrowRight className="mr-2 h-4 w-4" />
                案件を探す
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

        {/* 学生団体詳細のプレビュー・編集 */}
        {organizationInfo && (
          <div className="mb-12">
            <Card className="glass-panel border-0 rounded-um-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl text-white">学生団体詳細情報</CardTitle>
                  <div className="flex items-center gap-2">
                    {!isEditingOrganization && (
                      <>
                        <Button
                          asChild
                          variant="outline"
                          size="sm"
                          className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                        >
                          <Link href={`/organizations/${organizationInfo.id}`} target="_blank">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            プレビュー
                          </Link>
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditingOrganization(true)
                            setEditingOrganization({
                              name: organizationInfo.name,
                              description: organizationInfo.description || '',
                              website: organizationInfo.website || '',
                              contact_email: organizationInfo.contact_email || '',
                              contact_phone: organizationInfo.contact_phone || '',
                              logo_url: organizationInfo.logo_url || '',
                            })
                            setLogoFile(null)
                            setLogoPreview(organizationInfo.logo_url || null)
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
                  企業側から見た学生団体詳細画面のプレビューと編集ができます
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isEditingOrganization ? (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="org-name" style={{ color: 'var(--ink-muted-fallback)' }}>
                        団体名 <span className="text-rose-300">*</span>
                      </Label>
                      <Input
                        id="org-name"
                        value={editingOrganization.name || ''}
                        onChange={(e) => setEditingOrganization({ ...editingOrganization, name: e.target.value })}
                        className="bg-white/5 border-white/10 text-white rounded-um-md"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-description" style={{ color: 'var(--ink-muted-fallback)' }}>
                        団体概要
                      </Label>
                      <Textarea
                        id="org-description"
                        value={editingOrganization.description || ''}
                        onChange={(e) => setEditingOrganization({ ...editingOrganization, description: e.target.value })}
                        rows={6}
                        className="bg-white/5 border-white/10 text-white rounded-um-md"
                        placeholder="団体の概要や特徴を入力してください"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-website" style={{ color: 'var(--ink-muted-fallback)' }}>
                        公式サイトURL
                      </Label>
                      <Input
                        id="org-website"
                        type="url"
                        value={editingOrganization.website || ''}
                        onChange={(e) => setEditingOrganization({ ...editingOrganization, website: e.target.value })}
                        className="bg-white/5 border-white/10 text-white rounded-um-md"
                        placeholder="https://example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-contact-email" style={{ color: 'var(--ink-muted-fallback)' }}>
                        連絡先メールアドレス <span className="text-rose-300">*</span>
                      </Label>
                      <Input
                        id="org-contact-email"
                        type="email"
                        value={editingOrganization.contact_email || ''}
                        onChange={(e) => setEditingOrganization({ ...editingOrganization, contact_email: e.target.value })}
                        className="bg-white/5 border-white/10 text-white rounded-um-md"
                        placeholder="contact@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-contact-phone" style={{ color: 'var(--ink-muted-fallback)' }}>
                        連絡先電話番号
                      </Label>
                      <Input
                        id="org-contact-phone"
                        type="tel"
                        value={editingOrganization.contact_phone || ''}
                        onChange={(e) => setEditingOrganization({ ...editingOrganization, contact_phone: e.target.value })}
                        className="bg-white/5 border-white/10 text-white rounded-um-md"
                        placeholder="090-1234-5678"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="org-logo" style={{ color: 'var(--ink-muted-fallback)' }}>
                        ロゴ
                      </Label>
                      <div className="space-y-3">
                        {logoPreview ? (
                          <div className="relative">
                            <div className="relative w-32 h-32 rounded-lg border border-white/10 bg-white/5 overflow-hidden">
                              <img
                                src={logoPreview}
                                alt="ロゴプレビュー"
                                className="w-full h-full object-contain"
                                style={{ backgroundColor: 'transparent' }}
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setLogoFile(null)
                                setLogoPreview(null)
                                setEditingOrganization({ ...editingOrganization, logo_url: '' })
                              }}
                              className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-rose-500 hover:bg-rose-600 flex items-center justify-center text-white"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <label
                            htmlFor="org-logoFile"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-xl bg-white/5 hover:bg-white/10 cursor-pointer transition"
                          >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-2" style={{ color: 'var(--ink-muted-fallback)' }} />
                              <p className="mb-2 text-sm" style={{ color: 'var(--ink-muted-fallback)' }}>
                                <span className="font-semibold">クリックしてアップロード</span>
                              </p>
                              <p className="text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>PNG, JPG, GIF, WebP (最大5MB)</p>
                            </div>
                            <input
                              id="org-logoFile"
                              type="file"
                              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (!file) return

                                // ファイルサイズチェック（5MB以下）
                                if (file.size > 5 * 1024 * 1024) {
                                  setError('ファイルサイズは5MB以下にしてください')
                                  return
                                }

                                // ファイルタイプチェック
                                const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
                                if (!allowedTypes.includes(file.type)) {
                                  setError('画像ファイル（JPEG、PNG、GIF、WebP）のみアップロード可能です')
                                  return
                                }

                                setLogoFile(file)
                                setError(null)

                                // プレビューを生成
                                const reader = new FileReader()
                                reader.onloadend = () => {
                                  setLogoPreview(reader.result as string)
                                }
                                reader.readAsDataURL(file)
                              }}
                              className="hidden"
                            />
                          </label>
                        )}
                        <div className="text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>
                          または、ロゴURLを直接入力することもできます
                        </div>
                        <Input
                          id="org-logo"
                          type="url"
                          value={editingOrganization.logo_url || ''}
                          onChange={(e) => {
                            setEditingOrganization({ ...editingOrganization, logo_url: e.target.value })
                            if (e.target.value) {
                              setLogoPreview(e.target.value)
                              setLogoFile(null)
                            }
                          }}
                          disabled={!!logoFile}
                          className="bg-white/5 border-white/10 text-white rounded-um-md disabled:opacity-50"
                          placeholder="https://example.com/logo.png（ファイルアップロード時は無効）"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={async () => {
                          if (!supabase || !organizationInfo.id || !editingOrganization.name || !editingOrganization.contact_email) return
                          setSavingOrganization(true)
                          setUploadingLogo(!!logoFile)
                          try {
                            let finalLogoUrl = editingOrganization.logo_url || null

                            // ロゴファイルをアップロード
                            if (logoFile && organizationSession.profile?.id) {
                              try {
                                const fileName = `${organizationSession.profile.id}-${Date.now()}.${logoFile.name.split('.').pop()}`
                                
                                const { error: uploadError } = await supabase.storage
                                  .from('organization-logos')
                                  .upload(fileName, logoFile, {
                                    cacheControl: '3600',
                                    upsert: false,
                                  })

                                if (uploadError) throw uploadError

                                const { data: urlData } = supabase.storage
                                  .from('organization-logos')
                                  .getPublicUrl(fileName)

                                finalLogoUrl = urlData.publicUrl
                              } catch (uploadErr: any) {
                                console.warn('Logo upload error:', uploadErr)
                                setError('ロゴのアップロードに失敗しましたが、他の情報は更新されます。')
                              } finally {
                                setUploadingLogo(false)
                              }
                            }

                            const { error: updateError } = await supabase
                              .from('organizations')
                              .update({
                                name: editingOrganization.name,
                                description: editingOrganization.description || null,
                                website: editingOrganization.website || null,
                                contact_email: editingOrganization.contact_email,
                                contact_phone: editingOrganization.contact_phone || null,
                                logo_url: finalLogoUrl,
                              })
                              .eq('id', organizationInfo.id)

                            if (updateError) throw updateError

                            setOrganizationInfo({ ...organizationInfo, ...editingOrganization, logo_url: finalLogoUrl })
                            setIsEditingOrganization(false)
                            setLogoFile(null)
                            setLogoPreview(finalLogoUrl)
                            setError(null)
                          } catch (err: any) {
                            console.error('Failed to update organization:', err)
                            setError('学生団体情報の更新に失敗しました')
                          } finally {
                            setSavingOrganization(false)
                            setUploadingLogo(false)
                          }
                        }}
                        disabled={savingOrganization || uploadingLogo || !editingOrganization.name || !editingOrganization.contact_email}
                        className="union-gradient union-glow h-10 px-6 text-sm font-semibold"
                      >
                        {uploadingLogo ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ロゴをアップロード中...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            {savingOrganization ? '保存中...' : '保存'}
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => {
                          setIsEditingOrganization(false)
                          setEditingOrganization({})
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
                      {organizationInfo.logo_url ? (
                        <div className="flex-shrink-0">
                          <div className="relative max-w-[96px] max-h-[96px] rounded-2xl border border-white/10 bg-white/5 p-2 overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={organizationInfo.logo_url}
                              alt={`${organizationInfo.name} ロゴ`}
                              className="w-full h-full rounded-xl object-contain"
                              style={{ backgroundColor: 'transparent' }}
                              onError={(e) => {
                                // 画像読み込みエラー時のフォールバック
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  parent.innerHTML = '<div class="w-full h-full flex items-center justify-center"><svg class="w-12 h-12" style="color: var(--ink-muted-fallback)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>'
                                }
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="w-24 h-24 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center flex-shrink-0">
                          <Users className="h-12 w-12" style={{ color: 'var(--ink-muted-fallback)' }} />
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-white mb-2">{organizationInfo.name}</h3>
                        {organizationInfo.website && (
                          <a
                            href={organizationInfo.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm hover:text-white transition mb-2"
                            style={{ color: 'var(--ink-muted-fallback)' }}
                          >
                            <Globe className="h-4 w-4" />
                            {organizationInfo.website}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {organizationInfo.contact_email && (
                          <div className="flex items-center gap-2 text-sm mb-1" style={{ color: 'var(--ink-muted-fallback)' }}>
                            <Mail className="h-4 w-4" />
                            {organizationInfo.contact_email}
                          </div>
                        )}
                        {organizationInfo.contact_phone && (
                          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--ink-muted-fallback)' }}>
                            <Phone className="h-4 w-4" />
                            {organizationInfo.contact_phone}
                          </div>
                        )}
                      </div>
                    </div>
                    {organizationInfo.description && (
                      <div>
                        <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--ink-muted-fallback)' }}>団体概要</h4>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--ink-muted-fallback)' }}>
                          {organizationInfo.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="glass-panel border-0 rounded-um-lg">
            <CardHeader>
              <CardTitle className="text-lg text-white">応募済み案件</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{applications.length}</div>
              <p className="text-sm mt-2" style={{ color: 'var(--ink-muted-fallback)' }}>件</p>
            </CardContent>
          </Card>
        </div>

        {/* おすすめ案件 */}
        {recommendedProjects.length > 0 && (
          <div className="mb-12 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">おすすめ案件</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--ink-muted-fallback)' }}>
                  高評価の企業からの案件を推薦しています
                </p>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendedProjects.map((project: any) => {
                const company = project.company && !Array.isArray(project.company) ? project.company : null
                return (
                  <Card key={project.id} className="glass-panel border-0 rounded-um-lg hover:border-indigo-400/40 transition">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <CardTitle className="text-lg text-white line-clamp-2">{project.title}</CardTitle>
                        {company?.rating_avg && (
                          <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-xs text-yellow-400 font-semibold">
                              {company.rating_avg.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>
                      {company && (
                        <CardDescription style={{ color: 'var(--ink-muted-fallback)' }}>
                          {company.name}
                        </CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-4 line-clamp-3" style={{ color: 'var(--ink-muted-fallback)' }}>{project.description}</p>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10"
                      >
                        <Link href={`/projects/${project.id}`}>
                          詳細を見る
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* マッチング成立 */}
        {acceptedApplications.length > 0 && (
          <div className="mb-12 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white">マッチング成立</h2>
                <p className="text-sm mt-1" style={{ color: 'var(--ink-muted-fallback)' }}>
                  承認された応募一覧です。企業の連絡先情報を確認して、プロジェクトを進めてください。
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
                              {application.company_name ? (
                                <span className="font-semibold text-indigo-200">
                                  {application.company_name}
                                </span>
                              ) : (
                                <span className="font-semibold text-indigo-200">企業</span>
                              )}
                              とのマッチングが成立しました。
                            </p>
                            {application.accepted_at && (
                              <p className="text-xs mt-2" style={{ color: 'var(--ink-muted-fallback)' }}>
                                成立日: {new Date(application.accepted_at).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            )}
                          </div>

                          {application.company_name && application.company_id && (
                            <p className="text-sm mb-2" style={{ color: 'var(--ink-muted-fallback)' }}>
                              企業:{' '}
                              <Link
                                href={`/companies/${application.company_id}`}
                                target="_blank"
                                className="font-semibold text-white hover:text-indigo-400 transition underline inline-flex items-center gap-1"
                              >
                                {application.company_name}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </p>
                          )}
                          
                          {/* アクションエリア */}
                          <div className="mt-4 flex flex-wrap gap-2">
                            {application.project_contact_info && application.project_contact_info.includes('@') && (
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

                                    const mailtoLink = `mailto:${application.project_contact_info}?subject=${encodeURIComponent(`【UNION Match】${application.project_title}について`)}&body=${encodeURIComponent(emailBody)}`
                                    
                                    // 連絡履歴を記録
                                    if (organizationSession.accessToken) {
                                      try {
                                        await fetch('/api/contact/log', {
                                          method: 'POST',
                                          headers: {
                                            'Content-Type': 'application/json',
                                            Authorization: `Bearer ${organizationSession.accessToken}`,
                                          },
                                          body: JSON.stringify({
                                            application_id: application.id,
                                            recipient_type: 'company',
                                            recipient_id: application.company_id,
                                            contact_method: 'email',
                                            contact_info: application.project_contact_info,
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
                                企業にメールで連絡
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

                          {/* 企業連絡先情報 */}
                          {application.project_contact_info && (
                            <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-400/20">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-sm font-semibold text-green-400 flex items-center gap-2">
                                  <Building2 className="h-4 w-4" />
                                  企業連絡先情報
                                </p>
                              </div>
                              <div className="space-y-3">
                                {application.project_contact_info.includes('@') ? (
                                  <div className="text-sm">
                                    <p className="text-white mb-2">メールアドレスが登録されています。上記の「企業にメールで連絡」ボタンから連絡できます。</p>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-sm text-white">
                                      <Phone className="h-4 w-4" />
                                      {application.project_contact_info}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs border-green-400/40 bg-green-500/10 text-green-100 hover:bg-green-500/20"
                                      onClick={async () => {
                                        try {
                                          await navigator.clipboard.writeText(application.project_contact_info || '')
                                          alert('企業連絡先情報をコピーしました')
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
                                    上記の「企業にメールで連絡」ボタンから、案件詳細を含むメールを送信してください
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
                                    定期的に進捗を報告し、必要に応じて連絡を取り合ってください
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
                                    プロジェクトが完了したら、企業側から「完了にする」が押された後、評価を行ってください
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 ml-4">
                          <Button
                            asChild
                            variant="outline"
                            size="sm"
                            className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                          >
                            <Link href={`/projects/${application.project_id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              案件詳細
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">応募履歴</h2>
          </div>

          {applications.length === 0 ? (
            <Card className="glass-panel border-0 rounded-um-lg">
              <CardContent className="py-12 text-center">
                <Send className="h-12 w-12 mx-auto mb-4" style={{ color: 'var(--ink-muted-fallback)' }} />
                <p className="text-lg mb-2 text-white">まだ案件に応募していません</p>
                <p className="text-sm mb-6" style={{ color: 'var(--ink-muted-fallback)' }}>
                  案件一覧から興味のある案件を探して、応募してみましょう
                </p>
                <Button
                  asChild
                  className="union-gradient union-glow h-11 px-6 text-sm font-semibold"
                >
                  <Link href="/projects">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    案件を探す
                  </Link>
                </Button>
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
                            const statusInfo = getStatusBadge(application.status || 'pending')
                            return (
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.bg} ${statusInfo.border} border ${statusInfo.color}`}
                              >
                                {statusInfo.label}
                              </span>
                            )
                          })()}
                        </div>
                        {application.status === 'rejected' && (
                          <div className="mb-3 p-3 rounded-lg bg-rose-500/10 border border-rose-400/20">
                            <p className="text-sm text-rose-300">
                              この応募は不承認となりました
                            </p>
                          </div>
                        )}
                        {(!application.status || application.status === 'pending') && (
                          <div className="mb-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-400/20">
                            <p className="text-sm text-yellow-300">
                              企業側の審査をお待ちください
                            </p>
                          </div>
                        )}
                        <p className="text-sm mb-4 line-clamp-3" style={{ color: 'var(--ink-muted-fallback)' }}>{application.appeal}</p>
                        <div className="text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>
                          応募日: {new Date(application.created_at).toLocaleDateString('ja-JP')}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
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

