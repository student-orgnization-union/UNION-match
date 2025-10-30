'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import Link from 'next/link'
import { AlertTriangle, CheckCircle, ExternalLink, Loader2, LogIn } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

const DISABLED = process.env.NEXT_PUBLIC_DISABLE_RUNTIME_BOOTSTRAP === '1'
const hasSupabaseConfig =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) && Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

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

export default function DbSetupCallout() {
  const supabase = useMemo(
    () => (hasSupabaseConfig ? createClient() : null),
    [],
  ) // Avoid instantiating Supabase when env vars are absent.
  const [state, setState] = useState<'idle' | 'running' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState<string>('')
  const [session, setSession] = useState<Session | null>(null)
  const [checkingAuth, setCheckingAuth] = useState(hasSupabaseConfig)

  useEffect(() => {
    if (!supabase) {
      setCheckingAuth(false)
      return
    }

    let active = true

    const syncSession = async () => {
      try {
        const { data } = await supabase.auth.getSession()
        if (active) {
          setSession(data.session ?? null)
        }
      } finally {
        if (active) setCheckingAuth(false)
      }
    }

    syncSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return
      setSession(nextSession)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [supabase])

  const accessToken = session?.access_token ?? null
  const isAdmin = session ? userHasAdminRole(session.user) : false

  const runSetup = async () => {
    if (!accessToken) {
      setState('error')
      setMessage('管理者としてサインインすると初期化を実行できます。')
      return
    }

    setState('running')
    setMessage('')

    try {
      const res = await fetch('/api/admin/bootstrap', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          await supabase?.auth.signOut().catch(() => {})
          throw new Error('認証情報の有効期限が切れました。再度サインインしてください。')
        }

        if (data?.error?.message === 'requested path is invalid') {
          throw new Error('Supabase の URL 設定が不正です。/setup の手順に従って修正してください。')
        }

        throw new Error(data?.error?.message || '初期化に失敗しました')
      }

      setState('done')
      setMessage('データベースを初期化しました。数秒後にページを再読み込みしてください。')
    } catch (error: any) {
      setState('error')
      setMessage(error?.message || '初期化に失敗しました')
    }
  }

  const showSignInPrompt = hasSupabaseConfig && !isAdmin
  const buttonDisabled =
    DISABLED || checkingAuth || state === 'running' || state === 'done' || !hasSupabaseConfig || !isAdmin

  return (
    <Card className="union-card border-yellow-500/30 bg-yellow-500/10 mb-8">
      <CardContent className="py-5">
        <div className="flex items-start gap-3">
          {state === 'done' ? (
            <CheckCircle className="mt-1 h-5 w-5 text-green-400" />
          ) : (
            <AlertTriangle className="mt-1 h-5 w-5 text-yellow-400" />
          )}
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-yellow-300 font-medium">データベース未初期化</p>
              <p className="text-yellow-400/80 text-sm">
                projects テーブルが見つかりません。管理者としてサインインすると、このページから初期化を実行できます。
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {showSignInPrompt ? (
                <Button asChild className="union-gradient text-white">
                  <Link href="/admin">
                    <LogIn className="mr-2 h-4 w-4" />
                    管理画面でサインイン
                  </Link>
                </Button>
              ) : (
                <Button
                  onClick={runSetup}
                  disabled={buttonDisabled}
                  className="union-gradient text-white"
                  title={
                    DISABLED
                      ? '本番では手動初期化をご利用ください'
                      : hasSupabaseConfig
                        ? undefined
                        : 'Supabase の設定後に実行できます'
                  }
                >
                  {state === 'running' || checkingAuth ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      初期化中…
                    </>
                  ) : (
                    'DBを初期化する'
                  )}
                </Button>
              )}

              <Button
                asChild
                variant="outline"
                className="border-yellow-500/40 text-yellow-200 hover:bg-yellow-500/10"
              >
                <Link href="/setup">
                  手動初期化ガイド
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>

              {message && (
                <span className={`text-sm ${state === 'done' ? 'text-green-300' : 'text-yellow-300'}`}>
                  {message}
                </span>
              )}
            </div>

            {!hasSupabaseConfig && (
              <p className="text-xs text-yellow-400/80">
                Supabase の URL と鍵が未設定です。`.env.local` を整備した後、再度お試しください。
              </p>
            )}

            {DISABLED && (
              <p className="text-xs text-yellow-400/80">
                本番では安全のためランタイム初期化を無効化しています。手動手順に従って Supabase 側で一度だけ初期化してください。
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
