'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState, useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { getStoredUserType } from '@/lib/auth/session'

const footerNav = [
  { href: '/projects', label: '案件を探す' },
  { href: '/start', label: 'はじめに' },
  { href: '/register/student', label: '学生個人登録' },
  { href: '/register/organization', label: '学生団体登録' },
  { href: '/register/company', label: '企業登録' },
]

export function SiteFooter() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const userType = getStoredUserType()
    setIsAuthenticated(userType !== null)
  }, [])

  const filteredNav = useMemo(() => {
    // ログイン後はCTA要素（登録リンク）を非表示
    if (isAuthenticated) {
      return footerNav.filter((item) => 
        item.href === '/projects' || item.href === '/start'
      )
    }
    return footerNav
  }, [isAuthenticated])

  // マウント前は全てのナビゲーションを表示（サーバーサイドと一致させる）
  const displayNav = mounted ? filteredNav : footerNav
  return (
    <footer className="relative mt-16 border-t border-white/10 pb-10 pt-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/8 to-transparent" />
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="glass-panel grid gap-10 rounded-3xl px-6 py-8 sm:px-10 md:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-6">
            <div style={{ position: 'relative', width: '220px', height: '48px' }}>
              <Image
                src="/images/service-edited.png"
                alt="UNION Match ロゴ"
                fill
                sizes="(max-width: 640px) 220px, 280px"
                className="object-contain object-left"
                loading="lazy"
              />
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-muted-fallback)' }}>
              学生個人・学生団体と企業が共創する未来を描くマッチング・プラットフォーム。
              <br />
              案件の投稿から応募、承認までをシームレスに支援します。
            </p>
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-indigo-200">
              <span>学生個人</span>
              <span style={{ color: 'var(--ink-muted-fallback)' }}>•</span>
              <span>学生団体</span>
              <span style={{ color: 'var(--ink-muted-fallback)' }}>•</span>
              <span>企業</span>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-8">
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-[0.25em]" style={{ color: 'var(--ink-muted-fallback)' }}>ナビゲーション</p>
              <nav className="grid gap-3 text-sm" style={{ color: 'var(--ink-muted-fallback)' }}>
                {displayNav.map((item) => (
                  <Link key={item.href} href={item.href} className="transition hover:text-white">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
            <p className="text-right text-[11px]" style={{ color: 'var(--ink-muted-fallback)' }}>
              © {new Date().getFullYear()} UNION Match. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
