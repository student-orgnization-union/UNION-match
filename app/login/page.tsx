'use client'

import { useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, LogIn, Sparkles } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const hasSupabaseConfig =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

function setSessionFlagCookie(enabled: boolean) {
  if (typeof document === 'undefined') return
  // Middleware watches this cookie to decide if /admin pages can be served.
  const base = 'um-admin-session'
  if (enabled) {
    document.cookie = `${base}=1; Path=/; SameSite=Lax`
  } else {
    document.cookie = `${base}=; Path=/; Max-Age=0; SameSite=Lax`
  }
}

export default function LoginPage() {
  const supabase = useMemo(() => (hasSupabaseConfig ? createClient() : null), [])
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams?.get('redirect') || '/admin'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!hasSupabaseConfig) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#030712] via-[#050c1f] to-[#000308] px-4 py-16 text-slate-100">
        <div className="mx-auto max-w-md text-center space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-200">
            <Sparkles className="h-4 w-4" />
            Setup Required
          </div>
          <h1 className="text-2xl font-semibold">Supabase の設定が必要です</h1>
          <p className="text-sm text-yellow-100/80">
            `.env.local` に Supabase プロジェクトの URL とキーを設定した後、ページを再読み込みしてください。
          </p>
        </div>
      </div>
    )
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase) return
    setLoading(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
      if (signInError) {
        throw new Error(signInError.message || 'サインインに失敗しました')
      }

      setSessionFlagCookie(true)
      router.replace(redirect || '/admin')
    } catch (err: any) {
      setError(err?.message || 'サインインに失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#030712] via-[#050c1f] to-[#000308] px-4 py-16 text-slate-100">
      <div className="mx-auto max-w-lg space-y-8">
        <Card className="glass-outline border-white/10 bg-black/25">
          <CardHeader className="space-y-4 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/40 bg-indigo-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
              <Sparkles className="h-4 w-4" />
              Admin Login
            </div>
            <CardTitle className="text-3xl text-white">UNION 運営ログイン</CardTitle>
            <CardDescription className="text-slate-300">
              Supabase Auth で作成した管理者アカウントのメールアドレスとパスワードを入力してください。
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="glass-outline border-white/10 bg-black/30">
          <CardHeader>
            <CardTitle className="text-2xl text-white">サインイン</CardTitle>
            <CardDescription className="text-slate-300">
              ログインするとダッシュボードにリダイレクトします。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="login-email">メールアドレス</Label>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="h-11 rounded-xl border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:border-indigo-300/60 focus:ring-2 focus:ring-indigo-400/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">パスワード</Label>
                <Input
                  id="login-password"
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
      </div>
    </div>
  )
}

