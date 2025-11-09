'use client'

import { useMemo, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Mail, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { hasSupabaseConfig } from '@/lib/auth/session'

export default function ResetPasswordPage() {
  const supabase = useMemo(() => {
    try {
      return createClient()
    } catch {
      return null
    }
  }, [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const type = searchParams?.get('type') || 'company' // company or organization

  // SupabaseのパスワードリセットはURLハッシュ（#access_token=...）を使用
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [step, setStep] = useState<'request' | 'reset'>('request')

  // ページロード時にハッシュをチェック
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash
      if (hash && hash.includes('access_token')) {
        setStep('reset')
      }
    }
  }, [])

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!supabase || !hasSupabaseConfig) {
      setError('Supabase設定が完了していません。環境変数を確認してください。')
      setLoading(false)
      return
    }

    try {
      const redirectUrl = `${window.location.origin}/reset-password?type=${type}`
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })

      if (resetError) throw resetError

      setSuccess(true)
    } catch (err: any) {
      setError(err?.message || 'パスワードリセットメールの送信に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!supabase || !hasSupabaseConfig) {
      setError('Supabase設定が完了していません。環境変数を確認してください。')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) throw updateError

      setSuccess(true)
      setTimeout(() => {
        router.push(`/login/${type}`)
      }, 2000)
    } catch (err: any) {
      setError(err?.message || 'パスワードの更新に失敗しました')
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
      <main className="relative z-10 mx-auto max-w-lg px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href={`/login/${type}`}
            className="inline-flex items-center gap-2 text-sm transition hover:text-white"
            style={{ color: 'var(--ink-muted-fallback)' }}
          >
            <ArrowLeft className="h-4 w-4" />
            ログインページに戻る
          </Link>
        </div>

        <Card className="glass-panel border-0 rounded-um-lg">
          <CardHeader className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
              <KeyRound className="h-4 w-4" />
              Password Reset
            </div>
            <CardTitle className="text-3xl text-white">
              {step === 'request' ? 'パスワードリセット' : '新しいパスワードを設定'}
            </CardTitle>
            <CardDescription style={{ color: 'var(--ink-muted-fallback)' }}>
              {step === 'request'
                ? '登録済みのメールアドレスを入力してください。パスワードリセット用のリンクを送信します。'
                : '新しいパスワードを入力してください。'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success && step === 'request' ? (
              <Alert className="border-emerald-400/40 bg-emerald-500/10 text-emerald-100">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  パスワードリセット用のメールを送信しました。メール内のリンクをクリックして、新しいパスワードを設定してください。
                </AlertDescription>
              </Alert>
            ) : success && step === 'reset' ? (
              <Alert className="border-emerald-400/40 bg-emerald-500/10 text-emerald-100">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  パスワードを更新しました。ログインページに移動します...
                </AlertDescription>
              </Alert>
            ) : (
              <form
                onSubmit={step === 'request' ? handleRequestReset : handleResetPassword}
                className="space-y-6"
              >
                {error && (
                  <Alert className="border-rose-400/40 bg-rose-500/10 text-rose-100">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {step === 'request' ? (
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
                      placeholder="example@company.com"
                    />
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="password" style={{ color: 'var(--ink-muted-fallback)' }}>
                        新しいパスワード
                      </Label>
                      <Input
                        id="password"
                        name="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                        style={{
                          '--tw-placeholder-opacity': '0.5',
                        } as React.CSSProperties}
                        placeholder="6文字以上"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword" style={{ color: 'var(--ink-muted-fallback)' }}>
                        パスワード（確認）
                      </Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        autoComplete="new-password"
                        className="h-11 rounded-um-md border-white/10 bg-white/5 text-white"
                        style={{
                          '--tw-placeholder-opacity': '0.5',
                        } as React.CSSProperties}
                      />
                    </div>
                  </>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="union-gradient union-glow h-11 w-full text-sm font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {step === 'request' ? '送信中...' : '更新中...'}
                    </>
                  ) : (
                    <>
                      {step === 'request' ? (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          リセットメールを送信
                        </>
                      ) : (
                        <>
                          <KeyRound className="mr-2 h-4 w-4" />
                          パスワードを更新
                        </>
                      )}
                    </>
                  )}
                </Button>

                <div className="text-center">
                  <p className="text-xs" style={{ color: 'var(--ink-muted-fallback)' }}>
                    <Link href={`/login/${type}`} className="text-indigo-300 hover:text-indigo-200">
                      ログインページに戻る
                    </Link>
                  </p>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  )
}

