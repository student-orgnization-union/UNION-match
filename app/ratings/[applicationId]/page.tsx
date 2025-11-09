'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Star,
  MessageSquare,
  CheckCircle,
  AlertCircle,
  Send,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import {
  getCompanySession,
  getOrganizationSession,
  getStudentSession,
  getStoredUserType,
  hasSupabaseConfig,
  type AuthUserType,
} from '@/lib/auth/session'

type Application = {
  id: string
  project_id: string
  project_title: string
  organization_id: string | null
  student_id: string | null
  projects: {
    id: string
    title: string
    company_id: string
  }
}

type RatingFormData = {
  score: number
  comment: string
  communication_rating?: number
  quality_rating?: number
  punctuality_rating?: number
  professionalism_rating?: number
}

export default function RatingPage() {
  const params = useParams()
  const router = useRouter()
  const applicationId = params.applicationId as string

  const supabase = useMemo(() => {
    try {
      return createClient()
    } catch {
      return null
    }
  }, [])

  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [userType, setUserType] = useState<AuthUserType>(() => getStoredUserType())
  const [formData, setFormData] = useState<RatingFormData>({
    score: 5,
    comment: '',
    communication_rating: 5,
    quality_rating: 5,
    punctuality_rating: 5,
    professionalism_rating: 5,
  })

  const isUsingMockData = useMemo(() => !hasSupabaseConfig, [])

  useEffect(() => {
    if (isUsingMockData) {
      setLoading(false)
      return
    }

    const fetchApplication = async () => {
      if (!supabase) return

      try {
        const companySession = getCompanySession()
        const organizationSession = getOrganizationSession()
        const studentSession = getStudentSession()
        const currentUserType = getStoredUserType()

        let accessToken: string | null = null
        if (currentUserType === 'company' && companySession.accessToken) {
          accessToken = companySession.accessToken
        } else if (currentUserType === 'organization' && organizationSession.accessToken) {
          accessToken = organizationSession.accessToken
        } else if (currentUserType === 'student' && studentSession.accessToken) {
          accessToken = studentSession.accessToken
        }

        const response = await fetch(`/api/applications/${applicationId}`, {
          headers: accessToken
            ? {
                Authorization: `Bearer ${accessToken}`,
              }
            : {},
        })

        if (!response.ok) {
          throw new Error('応募情報の取得に失敗しました')
        }

        const { data } = await response.json()
        setApplication(data)
      } catch (error) {
        console.error('Failed to fetch application:', error)
        setMessage({ type: 'error', text: '応募情報の取得に失敗しました' })
      } finally {
        setLoading(false)
      }
    }

    fetchApplication()
  }, [applicationId, isUsingMockData, supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)

    try {
      const companySession = getCompanySession()
      const organizationSession = getOrganizationSession()
      const studentSession = getStudentSession()
      const currentUserType = getStoredUserType()

      let accessToken: string | null = null
      if (currentUserType === 'company' && companySession.accessToken) {
        accessToken = companySession.accessToken
      } else if (currentUserType === 'organization' && organizationSession.accessToken) {
        accessToken = organizationSession.accessToken
      } else if (currentUserType === 'student' && studentSession.accessToken) {
        accessToken = studentSession.accessToken
      }

      if (!accessToken) {
        throw new Error('ログインが必要です')
      }

      if (!application) {
        throw new Error('応募情報が見つかりません')
      }

      // 評価対象を決定
      let rateeType: 'company' | 'organization' | 'student'
      let rateeId: string

      if (currentUserType === 'company') {
        // 企業が評価する場合：学生団体または学生個人を評価
        if (application.organization_id) {
          rateeType = 'organization'
          rateeId = application.organization_id
        } else if (application.student_id) {
          rateeType = 'student'
          rateeId = application.student_id
        } else {
          throw new Error('評価対象が見つかりません')
        }
      } else {
        // 学生団体または学生個人が評価する場合：企業を評価
        rateeType = 'company'
        rateeId = application.projects.company_id
      }

      const response = await fetch('/api/ratings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          project_id: application.project_id,
          application_id: applicationId,
          ratee_type: rateeType,
          ratee_id: rateeId,
          score: formData.score,
          comment: formData.comment,
          communication_rating: formData.communication_rating,
          quality_rating: formData.quality_rating,
          punctuality_rating: formData.punctuality_rating,
          professionalism_rating: formData.professionalism_rating,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || '評価の送信に失敗しました')
      }

      setMessage({ type: 'success', text: '評価を送信しました。ありがとうございます！' })
      setTimeout(() => {
        router.push('/dashboard/' + (currentUserType === 'company' ? 'company' : currentUserType === 'organization' ? 'organization' : 'student'))
      }, 2000)
    } catch (error: any) {
      console.error('Failed to submit rating:', error)
      setMessage({ type: 'error', text: error.message || '評価の送信に失敗しました' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#030712] via-[#050c1f] to-[#000308] text-slate-100">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-4 py-16 text-center">
          <p className="text-slate-400">読み込み中...</p>
        </div>
        <SiteFooter />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#030712] via-[#050c1f] to-[#000308] text-slate-100">
        <SiteHeader />
        <div className="mx-auto max-w-4xl px-4 py-16">
          <Alert className="border-rose-400/40 bg-rose-500/10 text-rose-100">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>応募情報が見つかりません</AlertDescription>
          </Alert>
        </div>
        <SiteFooter />
      </div>
    )
  }

  const isCompany = userType === 'company'
  const rateeName = isCompany
    ? application.organization_id
      ? '応募団体'
      : '応募学生'
    : '企業'

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030712] via-[#050c1f] to-[#000308] text-slate-100">
      <SiteHeader />
      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href={`/dashboard/${userType === 'company' ? 'company' : userType === 'organization' ? 'organization' : 'student'}`}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="h-4 w-4" />
            ダッシュボードに戻る
          </Link>
        </div>

        <Card className="glass-panel border-white/10 bg-black/25">
          <CardHeader>
            <CardTitle className="text-2xl text-white">案件完了後の評価</CardTitle>
            <CardDescription className="text-slate-400">
              案件「{application.project_title}」について、{rateeName}への評価をお願いします
            </CardDescription>
          </CardHeader>
          <CardContent>
            {message && (
              <Alert
                className={`mb-6 ${
                  message.type === 'success'
                    ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100'
                    : 'border-rose-400/40 bg-rose-500/10 text-rose-100'
                }`}
              >
                {message.type === 'success' ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertCircle className="h-4 w-4" />
                )}
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 総合評価 */}
              <div className="space-y-3">
                <Label className="text-white text-base">総合評価 *</Label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, score: star })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= formData.score
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-slate-600'
                        } transition`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-slate-400">{formData.score} / 5</span>
                </div>
              </div>

              {/* カテゴリ別評価 */}
              <div className="space-y-4">
                <Label className="text-white text-base">カテゴリ別評価（オプション）</Label>

                <div className="space-y-3">
                  <div>
                    <Label className="text-slate-300 text-sm">コミュニケーション</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, communication_rating: star })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              star <= (formData.communication_rating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-slate-600'
                            } transition`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300 text-sm">品質</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, quality_rating: star })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              star <= (formData.quality_rating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-slate-600'
                            } transition`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300 text-sm">時間厳守</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, punctuality_rating: star })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              star <= (formData.punctuality_rating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-slate-600'
                            } transition`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-slate-300 text-sm">プロフェッショナリズム</Label>
                    <div className="flex items-center gap-2 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setFormData({ ...formData, professionalism_rating: star })}
                          className="focus:outline-none"
                        >
                          <Star
                            className={`h-5 w-5 ${
                              star <= (formData.professionalism_rating || 0)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-slate-600'
                            } transition`}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* コメント */}
              <div className="space-y-3">
                <Label htmlFor="comment" className="text-white text-base">
                  コメント（オプション）
                </Label>
                <Textarea
                  id="comment"
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  placeholder="評価の詳細や感想を記入してください"
                  className="min-h-[120px] bg-black/40 border-white/20 text-white placeholder:text-slate-500"
                  rows={5}
                />
              </div>

              <div className="flex items-center gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="union-gradient union-glow h-11 px-8 text-sm font-semibold"
                >
                  {submitting ? (
                    <>
                      <Send className="mr-2 h-4 w-4 animate-pulse" />
                      送信中...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      評価を送信
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  )
}

