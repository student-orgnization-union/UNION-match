'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, LogIn, Sparkles, AlertCircle } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { hasSupabaseConfig, persistStudentSession } from '@/lib/auth/session'

export default function StudentLoginPage() {
  const supabase = useMemo(() => {
    try {
      return createClient()
    } catch {
      return null
    }
  }, [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams?.get('redirect') || '/projects/students'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!supabase || !hasSupabaseConfig) {
      setError('Supabase設定が完了していません。環境変数を確認してください。')
      setLoading(false)
      return
    }

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      // ユーザーが学生個人アカウントか確認
      if (data.user) {
        const { data: studentData } = await supabase
          .from('students')
          .select('id, name, email, university, department, grade, contact_email')
          .eq('user_id', data.user.id)
          .single()

        if (!studentData) {
          await supabase.auth.signOut()
          throw new Error('このアカウントは学生個人アカウントではありません')
        }

        persistStudentSession({
          accessToken: data.session?.access_token ?? null,
          refreshToken: data.session?.refresh_token ?? null,
          profile: {
            id: studentData.id,
            name: studentData.name ?? null,
            email: studentData.email ?? null,
            university: studentData.university ?? null,
            department: studentData.department ?? null,
            grade: studentData.grade ?? null,
            contact_email: studentData.contact_email ?? null,
          },
        })
      }

      router.replace(redirect)
    } catch (err: any) {
      setError(err?.message || 'ログインに失敗しました')
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
    <div className="relative min-h-screen overflow-hidden text-white motion-fade-in" style={{ background: 'var(--bg-0-fallback)' }}>
      <div 
        className="pointer-events-none absolute inset-0 opacity-10"
        style={{
          background: 'radial-gradient(circle at 50% 20%, var(--um-blue-fallback) 0%, transparent 60%)',
        }}
      />
      <SiteHeader />
      <main className="relative z-10 mx-auto max-w-lg px-4 pb-24 pt-16 sm:px-6 lg:px-8">
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

        <Card className="glass-panel border-0 rounded-um-lg">
          <CardHeader className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
              <Sparkles className="h-4 w-4" />
              Student Login
            </div>
            <CardTitle className="text-3xl text-white">学生個人ログイン</CardTitle>
            <CardDescription style={{ color: 'var(--ink-muted-fallback)' }}>
              登録済みのメールアドレスとパスワードを入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert className="border-rose-400/40 bg-rose-500/10 text-rose-100">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" style={{ color: 'var(--ink-muted-fallback)' }}>
                  メールアドレス
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                  style={{ 
                    '--tw-placeholder-opacity': '0.5',
                  } as React.CSSProperties}
                  placeholder="example@email.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">
                  パスワード
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                  style={{ 
                    '--tw-placeholder-opacity': '0.5',
                  } as React.CSSProperties}
                  placeholder="パスワードを入力"
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
                    ログイン中...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    ログイン
                  </>
                )}
              </Button>

              <p className="text-center text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>
                アカウントをお持ちでない方は{' '}
                <Link href="/register/student" className="text-indigo-300 hover:text-indigo-200">
                  新規登録
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  )
}

