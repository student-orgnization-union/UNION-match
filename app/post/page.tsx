'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Building2, Send, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react'
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

export default function PostPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    budget: '',
    deadline: '',
    description: '',
    contact_info: '',
    target_type: 'organization' as 'student' | 'organization' | 'both',
  })
  const [companySession, setCompanySession] = useState<CompanySession>(() => getCompanySession())
  const [userType, setUserType] = useState<AuthUserType>(() => getStoredUserType())

  const isUsingMockData = useMemo(() => !hasSupabaseConfig, [])

  useEffect(() => {
    const unsubscribe = subscribeAuthChange(() => {
      setCompanySession(getCompanySession())
      setUserType(getStoredUserType())
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (isUsingMockData) return
    if (!companySession.profile?.contact_email) return
    setFormData((prev) => {
      if (prev.contact_info) return prev
      return {
        ...prev,
        contact_info: companySession.profile?.contact_email ?? '',
      }
    })
  }, [companySession.profile?.contact_email, isUsingMockData])

  const isAuthorized =
    userType === 'company' && Boolean(companySession.accessToken && companySession.profile?.id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setMessage(null)

    try {
      if (isUsingMockData) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setMessage({ type: 'success', text: '案件を投稿しました（デモモード）。実際の環境では運営による承認後に公開されます。' })
        setFormData({ title: '', budget: '', deadline: '', description: '', contact_info: '', target_type: 'organization' })
      } else {
        if (!companySession.accessToken || !companySession.profile?.id) {
          throw new Error('企業アカウントで再度ログインしてください。')
        }

        const response = await fetch('/api/projects', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${companySession.accessToken}`,
          },
          body: JSON.stringify(formData),
        })

        if (response.ok) {
          setMessage({ type: 'success', text: '案件を投稿しました。運営による承認後に公開されます。' })
          setFormData({ title: '', budget: '', deadline: '', description: '', contact_info: '', target_type: 'organization' })
        } else {
          const j = await response.json().catch(() => ({}))
          throw new Error(j?.error || '投稿に失敗しました')
        }
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || '投稿に失敗しました。もう一度お試しください。' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const isFormValid = formData.title && formData.description && formData.contact_info
  const canSubmit = Boolean(isFormValid && (isUsingMockData || isAuthorized))
  const showAuthWarning = !isUsingMockData && !isAuthorized

  return (
    <div className="min-h-screen text-white motion-fade-in" style={{ background: 'var(--bg-0-fallback)' }}>
      <SiteHeader />

      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 union-gradient-2 rounded-2xl flex items-center justify-center mr-4">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold">
              案件<span className="union-text-gradient">投稿</span>
            </h1>
          </div>
          <p className="text-xl" style={{ color: 'var(--ink-muted-fallback)' }}>
            学生団体との協業案件を投稿してください。投稿後、運営による承認後に公開されます。
          </p>
        </div>

        {/* 企業登録未完の注意 */}
        {showAuthWarning && (
          <Card className="union-card border-yellow-500/30 bg-yellow-500/10 mb-8">
            <CardContent className="py-4">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-yellow-400 mr-3" />
                <div>
                  <p className="text-yellow-300 font-medium">企業登録が必要です</p>
                  <p className="text-yellow-400/80 text-sm">
                    企業アカウントでログイン後に案件投稿が可能になります。まだ企業登録を済ませていない場合は、先に企業登録を完了してください。
                  </p>
                  <Button asChild variant="outline" className="mt-3 border-white/30 text-white hover:bg-white/10">
                    <Link href="/login/company?redirect=/post">企業ログインへ</Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!isUsingMockData && isAuthorized && (
          <Card className="union-card border-emerald-500/20 bg-emerald-500/10 mb-8">
            <CardContent className="py-4">
              <p className="text-sm text-emerald-100">
                {companySession.profile?.name
                  ? `${companySession.profile.name} としてログイン中です。`
                  : '企業アカウントでログイン中です。'}
              </p>
            </CardContent>
          </Card>
        )}

        {message && (
          <Alert className={`mb-8 ${message.type === 'success' ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
            <div className="flex items-center">
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-400 mr-2" />
              )}
              <AlertDescription className={message.type === 'success' ? 'text-green-300' : 'text-red-300'}>
                {message.text}
              </AlertDescription>
            </div>
          </Alert>
        )}

        <Card className="glass-panel border-0 rounded-um-lg">
          <CardHeader>
            <CardTitle className="text-2xl text-white">案件詳細</CardTitle>
            <CardDescription style={{ color: 'var(--ink-muted-fallback)' }}>学生個人・学生団体が興味を持てるよう、詳細な情報を記載してください</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-3">
                <Label className="text-white text-base">募集対象 *</Label>
                <RadioGroup
                  value={formData.target_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, target_type: value as 'student' | 'organization' | 'both' }))}
                  className="space-y-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="organization" id="target-organization" />
                    <Label htmlFor="target-organization" className="text-white cursor-pointer">
                      学生団体のみ
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="student" id="target-student" />
                    <Label htmlFor="target-student" className="text-white cursor-pointer">
                      学生個人のみ
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="target-both" />
                    <Label htmlFor="target-both" className="text-white cursor-pointer">
                      学生団体・学生個人の両方
                    </Label>
                  </div>
                </RadioGroup>
                <p className="text-sm" style={{ color: 'var(--ink-muted-fallback)' }}>選択した対象に応じて、適切な案件一覧に表示されます</p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="title" className="text-white text-base">案件名 *</Label>
                <Input id="title" name="title" value={formData.title} onChange={handleChange} required
                  placeholder="例：学生向けイベント企画・運営パートナー募集"
                  className="bg-white/5 border-white/20 text-white focus:border-white/40 h-12 rounded-um-md"
                  style={{ 
                    '--tw-placeholder-opacity': '0.5',
                  } as React.CSSProperties}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="budget" className="text-white text-base">予算・報酬</Label>
                <Input id="budget" name="budget" value={formData.budget} onChange={handleChange}
                  placeholder="例：10万円〜20万円、応相談"
                  className="bg-white/5 border-white/20 text-white focus:border-white/40 h-12 rounded-um-md"
                  style={{ 
                    '--tw-placeholder-opacity': '0.5',
                  } as React.CSSProperties}
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="deadline" className="text-white text-base">応募締切</Label>
                <Input id="deadline" name="deadline" type="date" value={formData.deadline} onChange={handleChange}
                  className="bg-white/5 border-white/20 text-white focus:border-white/40 h-12"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="description" className="text-white text-base">案件詳細 *</Label>
                <Textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={10} required
                  placeholder="案件の詳細、求めるスキル、期待する成果物などを記載してください"
                  className="bg-white/5 border-white/20 text-white focus:border-white/40 rounded-um-md"
                  style={{ 
                    '--tw-placeholder-opacity': '0.5',
                  } as React.CSSProperties}
                />
                <p className="text-sm" style={{ color: 'var(--ink-muted-fallback)' }}>Markdown記法が使用できます</p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="contact_info" className="text-white text-base">連絡先 *</Label>
                <Input id="contact_info" name="contact_info" type="email" value={formData.contact_info} onChange={handleChange} required
                  placeholder="example@company.com"
                  className="bg-white/5 border-white/20 text-white focus:border-white/40 h-12 rounded-um-md"
                  style={{ 
                    '--tw-placeholder-opacity': '0.5',
                  } as React.CSSProperties}
                />
                <p className="text-sm" style={{ color: 'var(--ink-muted-fallback)' }}>この情報は公開されません。応募があった際の連絡に使用します。</p>
              </div>

              <Button
                type="submit"
                className="w-full union-gradient text-white border-0 py-4 text-lg hover:opacity-90"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? '投稿中...' : (<><Send className="h-5 w-5 mr-2" />案件を投稿する</>)}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-12 text-center">
          <p className="text-sm" style={{ color: 'var(--ink-muted-fallback)' }}>
            投稿された案件は運営による承認後に公開されます。
            <br />通常1-2営業日以内に承認いたします。
          </p>
        </div>
      </div>
      <SiteFooter />
    </div>
  )
}
