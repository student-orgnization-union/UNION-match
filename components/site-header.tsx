'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  getCompanySession,
  getOrganizationSession,
  getStudentSession,
  getStoredUserType,
  signOutCurrentUser,
  subscribeAuthChange,
  type AuthUserType,
} from '@/lib/auth/session'

type HeaderAuthState =
  | { userType: 'company'; displayName: string | null }
  | { userType: 'organization'; displayName: string | null }
  | { userType: 'student'; displayName: string | null }
  | { userType: null; displayName: null }

const initialAuthState: HeaderAuthState = { userType: null, displayName: null }

export function SiteHeader() {
  const router = useRouter()
  const [authState, setAuthState] = useState<HeaderAuthState>(initialAuthState)
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const syncAuthState = useCallback(() => {
    const userType: AuthUserType = getStoredUserType()
    if (userType === 'company') {
      const session = getCompanySession()
      setAuthState({ userType, displayName: session.profile?.name ?? null })
      return
    }

    if (userType === 'organization') {
      const session = getOrganizationSession()
      setAuthState({ userType, displayName: session.profile?.name ?? null })
      return
    }

    if (userType === 'student') {
      const session = getStudentSession()
      setAuthState({ userType, displayName: session.profile?.name ?? null })
      return
    }

    setAuthState(initialAuthState)
  }, [])

  useEffect(() => {
    syncAuthState()
    const unsubscribe = subscribeAuthChange(syncAuthState)
    return unsubscribe
  }, [syncAuthState])

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true)
    try {
      await signOutCurrentUser()
      syncAuthState()
      router.refresh()
    } finally {
      setIsLoggingOut(false)
    }
  }, [router, syncAuthState])

  const isAuthenticated = authState.userType !== null

  const primaryAction = useMemo(() => {
    if (!authState.userType) {
      return (
        <Button
          asChild
          className="union-gradient union-glow h-10 rounded-full px-5 text-xs font-semibold uppercase tracking-[0.2em]"
        >
          <Link href="/register/company">案件を投稿</Link>
        </Button>
      )
    }

    if (authState.userType === 'company') {
      return (
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--ink-muted-fallback)' }}>企業</span>
          <span className="text-sm font-medium text-white">
            {authState.displayName ?? '企業アカウント'}
          </span>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-white/20 bg-white/5 text-xs font-semibold tracking-[0.2em] text-white hover:bg-white/10"
          >
            <Link href="/dashboard/company">ダッシュボード</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="union-gradient border-0 text-xs font-semibold tracking-[0.2em] text-white"
          >
            <Link href="/post">案件投稿</Link>
          </Button>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-xs font-semibold text-white hover:opacity-80"
            disabled={isLoggingOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? 'ログアウト中…' : 'ログアウト'}
          </Button>
        </div>
      )
    }

    if (authState.userType === 'organization') {
      return (
        <div className="flex items-center gap-3">
          <span className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--ink-muted-fallback)' }}>学生団体</span>
          <span className="text-sm font-medium text-white">
            {authState.displayName ?? '団体アカウント'}
          </span>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-white/20 bg-white/5 text-xs font-semibold tracking-[0.2em] text-white hover:bg-white/10"
          >
            <Link href="/dashboard/organization">ダッシュボード</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="border-white/20 bg-white/5 text-xs font-semibold tracking-[0.2em] text-white hover:bg-white/10"
          >
            <Link href="/projects/organizations">案件一覧</Link>
          </Button>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-xs font-semibold text-white hover:opacity-80"
            disabled={isLoggingOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? 'ログアウト中…' : 'ログアウト'}
          </Button>
        </div>
      )
    }

    // 学生個人
    return (
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--ink-muted-fallback)' }}>学生個人</span>
        <span className="text-sm font-medium text-white">
          {authState.displayName ?? '学生アカウント'}
        </span>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-white/20 bg-white/5 text-xs font-semibold tracking-[0.2em] text-white hover:bg-white/10"
        >
          <Link href="/dashboard/student">ダッシュボード</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="border-white/20 bg-white/5 text-xs font-semibold tracking-[0.2em] text-white hover:bg-white/10"
        >
          <Link href="/projects/students">案件一覧</Link>
        </Button>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="text-xs font-semibold text-white hover:opacity-80"
            disabled={isLoggingOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            {isLoggingOut ? 'ログアウト中…' : 'ログアウト'}
          </Button>
      </div>
    )
  }, [authState.displayName, authState.userType, handleLogout, isLoggingOut])

  return (
    <header className="sticky top-0 z-50 border-b glass-panel">
      <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="glass-panel flex h-16 items-center justify-between rounded-full px-4 py-2 sm:px-6">
          <Link href="/" className="flex items-center gap-3" aria-label="UNION Match ホーム">
            <div style={{ position: 'relative', width: '160px', height: '40px' }}>
              <Image
                src="/images/service-edited.png"
                alt="UNION Match ロゴ"
                fill
                sizes="(max-width: 640px) 160px, 220px"
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex" style={{ color: 'var(--ink-muted-fallback)' }}>
            <Link href="/projects" className="transition hover:text-white font-medium">
              案件を探す
            </Link>
            {/* ログイン後はCTA要素（はじめに、企業登録）を非表示 */}
            {!isAuthenticated && (
              <>
                <Link href="/start" className="transition hover:text-white">
                  はじめに
                </Link>
                <Link href="/register/company" className="transition hover:text-white">
                  企業登録
                </Link>
              </>
            )}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            {primaryAction}
          </div>
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
