'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Sparkles, AlertCircle, CheckCircle2, Building2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export default function CompanyRegisterPage() {
  const supabase = useMemo(() => {
    try {
      return createClient()
    } catch {
      return null
    }
  }, [])
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    contactEmail: '',
    website: '',
    logoUrl: '',
    description: '',
  })

  const hasSupabaseConfig =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!supabase || !hasSupabaseConfig) {
      setError('Supabase設定が完了していません。環境変数を確認してください。')
      setLoading(false)
      return
    }

    // バリデーション
    if (formData.password !== formData.confirmPassword) {
      setError('パスワードが一致しません')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      setLoading(false)
      return
    }

    try {
      // 1. Supabase Authでユーザー作成
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            type: 'company',
            company_name: formData.companyName,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('ユーザー作成に失敗しました')

      // 2. companiesテーブルに登録
      const { error: companyError } = await supabase.from('companies').insert({
        user_id: authData.user.id,
        name: formData.companyName,
        contact_email: formData.contactEmail || formData.email,
        website: formData.website || null,
        logo_url: formData.logoUrl || null,
        description: formData.description || null,
      })

      if (companyError) {
        // ユーザー作成済みなので削除を試みる（エラーは無視）
        await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {})
        throw companyError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/post')
      }, 2000)
    } catch (err: any) {
      setError(err?.message || '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (!hasSupabaseConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#030712] via-[#050c1f] to-[#000308] text-slate-100">
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

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#030712] via-[#050c1f] to-[#000308] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_60%)]" />
      <SiteHeader />
      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            トップに戻る
          </Link>
        </div>

        <div className="mx-auto max-w-2xl">
          <Card className="glass-panel border-white/10 bg-black/25">
            <CardHeader className="space-y-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
                <Building2 className="h-4 w-4" />
                Company Registration
              </div>
              <CardTitle className="text-3xl text-white">企業として登録</CardTitle>
              <CardDescription className="text-slate-300">
                アカウントを作成して、案件の投稿や管理を行えます
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <Alert className="border-emerald-400/40 bg-emerald-500/10 text-emerald-100">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    登録が完了しました。案件投稿ページに移動します...
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert className="border-rose-400/40 bg-rose-500/10 text-rose-100">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="text-slate-300">
                      企業名 <span className="text-rose-300">*</span>
                    </Label>
                    <Input
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                      placeholder="例）ユニオン株式会社"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">
                      メールアドレス（ログインID） <span className="text-rose-300">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                      placeholder="example@company.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-300">
                      パスワード <span className="text-rose-300">*</span>
                    </Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      className="h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                      placeholder="6文字以上"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-slate-300">
                      パスワード（確認） <span className="text-rose-300">*</span>
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="text-slate-300">
                      連絡先メールアドレス
                    </Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      className="h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                      placeholder="連絡用メール（任意）"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-slate-300">
                      Webサイト
                    </Label>
                    <Input
                      id="website"
                      name="website"
                      type="url"
                      value={formData.website}
                      onChange={handleChange}
                      className="h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                      placeholder="https://example.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="logoUrl" className="text-slate-300">
                      ロゴURL
                    </Label>
                    <Input
                      id="logoUrl"
                      name="logoUrl"
                      type="url"
                      value={formData.logoUrl}
                      onChange={handleChange}
                      className="h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                      placeholder="https://.../logo.png"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-slate-300">
                      企業概要
                    </Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500"
                      placeholder="事業内容や学生との協業における姿勢・期待などをご記入ください"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="union-gradient union-glow h-11 w-full text-sm font-semibold"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        登録中...
                      </>
                    ) : (
                      '登録して案件投稿へ進む'
                    )}
                  </Button>

                  <p className="text-center text-xs text-slate-400">
                    すでにアカウントをお持ちですか？{' '}
                    <Link href="/login/company" className="text-indigo-300 hover:text-indigo-200">
                      ログイン
                    </Link>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
