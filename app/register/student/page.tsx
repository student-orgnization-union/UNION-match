'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'

export default function StudentRegisterPage() {
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
    name: '',
    university: '',
    department: '',
    grade: '',
    contactEmail: '',
    contactPhone: '',
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
          emailRedirectTo: `${window.location.origin}/login/student?confirmed=true`,
          data: {
            type: 'student',
            student_name: formData.name,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('ユーザー作成に失敗しました')

      // メール確認が必要な場合（sessionがnull）、ユーザーに案内を表示
      if (!authData.session) {
        setError(
          'メール確認が必要です。\n\n' +
          '⚠️ メールが届かない場合:\n' +
          '1. Supabase Dashboard → Authentication → Settings を開く\n' +
          '2. 「Enable email confirmations」をOFFにする（推奨）\n' +
          'または\n' +
          '3. 「SMTP Settings」でメール送信設定を行う\n\n' +
          '設定後、再度登録をお試しください。'
        )
        setLoading(false)
        return
      }

      // 2. studentsテーブルに登録
      const { error: studentError } = await supabase.from('students').insert({
        user_id: authData.user.id,
        name: formData.name,
        email: formData.email,
        university: formData.university || null,
        department: formData.department || null,
        grade: formData.grade || null,
        contact_email: formData.contactEmail || formData.email,
        contact_phone: formData.contactPhone || null,
      })

      if (studentError) {
        // ユーザー作成済みなので削除を試みる（エラーは無視）
        await supabase.auth.admin.deleteUser(authData.user.id).catch(() => {})
        throw studentError
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/projects/students')
      }, 2000)
    } catch (err: any) {
      setError(err?.message || '登録に失敗しました')
    } finally {
      setLoading(false)
    }
  }

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

  return (
    <div className="relative min-h-screen overflow-hidden text-white motion-fade-in" style={{ background: 'var(--bg-0-fallback)' }}>
      <div 
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          background: 'radial-gradient(circle at 50% 20%, var(--um-blue-fallback) 0%, transparent 60%)',
        }}
      />
      <SiteHeader />
      <main className="relative z-10 mx-auto max-w-4xl px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm transition hover:text-white"
            style={{ color: 'var(--ink-muted-fallback)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            トップに戻る
          </Link>
        </div>

        <div className="mx-auto max-w-2xl">
          <Card className="glass-panel border-0 rounded-um-lg">
            <CardHeader className="space-y-4 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
                <Sparkles className="h-4 w-4" />
                Student Registration
              </div>
              <CardTitle className="text-3xl text-white">学生個人として登録</CardTitle>
              <CardDescription style={{ color: 'var(--ink-muted-fallback)' }}>
                アカウントを作成して、案件への応募や管理を行えます
              </CardDescription>
            </CardHeader>
            <CardContent>
              {success ? (
                <Alert className="border-emerald-400/40 bg-emerald-500/10 text-emerald-100">
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    登録が完了しました。ページを移動します...
                  </AlertDescription>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <Alert className="border-rose-400/40 bg-rose-500/10 text-rose-100">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="whitespace-pre-line">
                        {error}
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="name" style={{ color: 'var(--ink-muted-fallback)' }}>
                      氏名 <span className="text-rose-300">*</span>
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                      style={{ 
                        '--tw-placeholder-opacity': '0.5',
                      } as React.CSSProperties}
                      placeholder="山田 太郎"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" style={{ color: 'var(--ink-muted-fallback)' }}>
                      メールアドレス（ログインID） <span className="text-rose-300">*</span>
                    </Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                      style={{ 
                        '--tw-placeholder-opacity': '0.5',
                      } as React.CSSProperties}
                      placeholder="example@email.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" style={{ color: 'var(--ink-muted-fallback)' }}>
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
                      className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                      style={{ 
                        '--tw-placeholder-opacity': '0.5',
                      } as React.CSSProperties}
                      placeholder="6文字以上"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" style={{ color: 'var(--ink-muted-fallback)' }}>
                      パスワード（確認） <span className="text-rose-300">*</span>
                    </Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                      style={{ 
                        '--tw-placeholder-opacity': '0.5',
                      } as React.CSSProperties}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="university" style={{ color: 'var(--ink-muted-fallback)' }}>
                      大学名
                    </Label>
                    <Input
                      id="university"
                      name="university"
                      value={formData.university}
                      onChange={handleChange}
                      className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                      style={{ 
                        '--tw-placeholder-opacity': '0.5',
                      } as React.CSSProperties}
                      placeholder="例）○○大学"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department" style={{ color: 'var(--ink-muted-fallback)' }}>
                      学部・学科
                    </Label>
                    <Input
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                      style={{ 
                        '--tw-placeholder-opacity': '0.5',
                      } as React.CSSProperties}
                      placeholder="例）経済学部 経済学科"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade" style={{ color: 'var(--ink-muted-fallback)' }}>
                      学年
                    </Label>
                    <Input
                      id="grade"
                      name="grade"
                      value={formData.grade}
                      onChange={handleChange}
                      className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                      style={{ 
                        '--tw-placeholder-opacity': '0.5',
                      } as React.CSSProperties}
                      placeholder="例）3年生"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" style={{ color: 'var(--ink-muted-fallback)' }}>
                      連絡先メールアドレス
                    </Label>
                    <Input
                      id="contactEmail"
                      name="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={handleChange}
                      className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                      style={{ 
                        '--tw-placeholder-opacity': '0.5',
                      } as React.CSSProperties}
                      placeholder="連絡用メール（任意）"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactPhone" style={{ color: 'var(--ink-muted-fallback)' }}>
                      電話番号
                    </Label>
                    <Input
                      id="contactPhone"
                      name="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={handleChange}
                      className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                      style={{ 
                        '--tw-placeholder-opacity': '0.5',
                      } as React.CSSProperties}
                      placeholder="090-1234-5678"
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
                      '登録する'
                    )}
                  </Button>

                  <p className="text-center text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>
                    すでにアカウントをお持ちですか？{' '}
                    <Link href="/login/student" className="text-indigo-300 hover:text-indigo-200">
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

